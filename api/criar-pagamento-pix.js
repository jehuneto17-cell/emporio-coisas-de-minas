import { auth, db } from './_firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  let uid;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (e) {
    console.warn('[criar-pagamento-pix] token inválido:', e.message);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
  if (!PAGBANK_TOKEN) return res.status(500).json({ error: 'Token do PagBank não configurado.' });

  try {
    const { total, email, orderId, description } = req.body;

    const orderRef = db.doc(`users/${uid}/orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderData = orderSnap.data();

    if (Math.abs(orderData.total - total) > 0.01) {
      console.warn('[criar-pagamento-pix] total divergente do pedido:', orderData.total, 'vs', total);
      return res.status(400).json({ error: 'Valor do pedido inválido.' });
    }

    const response = await fetch('https://api.pagbank.com.br/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference_id: orderId,
        description: description || `Pedido #${orderId.slice(-6)} — Empório Coisas de Minas`,
        amount: { value: Math.round(total * 100) },
        payment_method: { type: 'pix' },
        customer: { email: email || 'cliente@emporiominas.com.br' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[criar-pagamento-pix] PagBank error:', data);
      return res.status(response.status >= 400 && response.status < 500 ? 400 : 502).json({
        error: data.error_messages?.[0]?.description || 'Erro ao criar pagamento PIX.',
      });
    }

    const qr = data.qr_codes?.[0];
    const emv = qr?.text || qr?.emv;
    const qrImageUrl = qr?.links?.find((l) => l.rel === 'QRCODE.PNG' || l.media === 'image/png')?.href;

    if (!emv && !qrImageUrl) {
      console.error('[criar-pagamento-pix] resposta sem QR code:', data);
      return res.status(502).json({ error: 'PagBank não retornou QR Code.' });
    }

    let qrCodeBase64 = null;
    if (qrImageUrl) {
      try {
        const imgRes = await fetch(qrImageUrl);
        const buffer = await imgRes.arrayBuffer();
        qrCodeBase64 = Buffer.from(buffer).toString('base64');
      } catch (e) {
        console.warn('[criar-pagamento-pix] falha ao baixar imagem do QR Code:', e.message);
      }
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: emv || null,
      qr_code_base64: qrCodeBase64,
    });
  } catch (e) {
    console.error('[criar-pagamento-pix]', e);
    return res.status(502).json({ error: 'Erro interno ao criar pagamento PIX.' });
  }
}
