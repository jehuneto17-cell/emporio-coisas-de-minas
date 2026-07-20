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

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Token do Mercado Pago não configurado.' });

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

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(total.toFixed(2)),
        description: description || 'Empório Coisas de Minas',
        payment_method_id: 'pix',
        payer: { email: email || 'cliente@emporiominas.com.br' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[criar-pagamento-pix]', data);
      return res.status(response.status).json({ error: data.message || 'Erro ao criar pagamento PIX.' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: data.point_of_interaction?.transaction_data?.ticket_url,
    });
  } catch (e) {
    console.error('[criar-pagamento-pix]', e);
    return res.status(502).json({ error: 'Erro interno ao criar pagamento PIX.' });
  }
}
