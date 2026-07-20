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
    console.warn('[criar-pagamento-cartao] token inválido:', e.message);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Token do Mercado Pago não configurado.' });

  try {
    const { total, email, orderId, description, token: cardToken, installments, paymentMethodId, issuerId } = req.body;

    const orderRef = db.doc(`users/${uid}/orders/${orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const orderData = orderSnap.data();

    if (Math.abs(orderData.total - total) > 0.01) {
      console.warn('[criar-pagamento-cartao] total divergente do pedido:', orderData.total, 'vs', total);
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
        payment_method_id: paymentMethodId,
        issuer_id: issuerId,
        token: cardToken,
        installments: installments || 1,
        payer: { email: email || 'cliente@emporiominas.com.br' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[criar-pagamento-cartao]', data);
      return res.status(response.status).json({ error: data.message || 'Erro ao processar cartão.' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
    });
  } catch (e) {
    console.error('[criar-pagamento-cartao]', e);
    return res.status(502).json({ error: 'Erro interno ao processar cartão.' });
  }
}
