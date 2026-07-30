import { auth, db } from './_firebaseAdmin.js';

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const firebaseToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!firebaseToken) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  let uid;
  try {
    const decoded = await auth.verifyIdToken(firebaseToken);
    uid = decoded.uid;
  } catch (e) {
    console.warn('[criar-pagamento-pix] token inválido:', e.message);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const token = process.env.PAGBANK_TOKEN?.trim();
  if (!token) {
    console.error('[criar-pagamento-pix] PAGBANK_TOKEN ausente no ambiente');
    return res.status(500).json({ error: 'Token não configurado' });
  }
  console.log('[criar-pagamento-pix] token presente, length:', token.length, 'prefixo:', token.slice(0, 4) + '***');

  const PAGBANK_URL = 'https://sandbox.api.pagseguro.com/charges';

  try {
    const { total, email, orderId, description } = req.body;
    console.log('[criar-pagamento-pix] orderId:', orderId, 'total:', total, 'temEmail:', !!email);

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

    const requestBody = {
      reference_id: orderId,
      description: description || `Pedido #${orderId.slice(-6)} — Empório Coisas de Minas`,
      amount: { value: Math.round(total * 100) },
      payment_method: { type: 'pix' },
      customer: { email: email || 'cliente@emporiominas.com.br' },
    };
    console.log('[criar-pagamento-pix] POST', PAGBANK_URL);
    console.log('[criar-pagamento-pix] body (sem PII):', JSON.stringify({
      ...requestBody,
      customer: { email: '[omitido]' },
    }));

    let response;
    try {
      response = await fetch(PAGBANK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      console.error('[criar-pagamento-pix] fetch error:', fetchError.message);
      console.error('[criar-pagamento-pix] error name:', fetchError.name);
      console.error('[criar-pagamento-pix] error cause:', fetchError.cause);
      return res.status(502).json({ error: 'Falha ao conectar com o PagBank' });
    }

    console.log('[criar-pagamento-pix] PagBank response status:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('[criar-pagamento-pix] PagBank error:', data);
      return res.status(400).json({ error: 'Falha ao criar pagamento' });
    }

    const qr = data.qr_codes?.[0];
    const pixCopyPaste = qr?.text || qr?.emv || '';
    const qrImageUrl = qr?.links?.find((l) => l.rel === 'QRCODE.PNG' || l.media === 'image/png')?.href;
    console.log('[criar-pagamento-pix] chargeId:', data.id, 'status:', data.status, 'temEmv:', !!pixCopyPaste, 'temQrUrl:', !!qrImageUrl);

    if (!pixCopyPaste && !qrImageUrl) {
      console.error('[criar-pagamento-pix] resposta sem QR code. Chaves recebidas:', Object.keys(data));
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
      qr_code: pixCopyPaste || null,
      qr_code_base64: qrCodeBase64,
    });
  } catch (error) {
    console.error('[criar-pagamento-pix] erro geral:', error.message);
    console.error('[criar-pagamento-pix] error name:', error.name);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

export default handler;
