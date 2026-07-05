export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) return res.status(500).json({ error: 'Token não configurado.' });

  const { paymentId } = req.query;
  if (!paymentId) return res.status(400).json({ error: 'paymentId obrigatório.' });

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message });
    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
    });
  } catch (e) {
    return res.status(502).json({ error: 'Erro ao verificar pagamento.' });
  }
}
