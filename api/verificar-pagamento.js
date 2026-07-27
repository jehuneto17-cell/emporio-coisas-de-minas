const STATUS_MAP = {
  PAID: 'approved',
  DECLINED: 'rejected',
  CANCELED: 'cancelled',
  WAITING: 'pending',
  IN_ANALYSIS: 'pending',
  AUTHORIZED: 'pending',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
  if (!PAGBANK_TOKEN) return res.status(500).json({ error: 'Token não configurado.' });

  const { paymentId } = req.query;
  if (!paymentId) return res.status(400).json({ error: 'paymentId obrigatório.' });

  try {
    const response = await fetch(`https://api.pagbank.com.br/charges/${paymentId}`, {
      headers: { Authorization: `Bearer ${PAGBANK_TOKEN}` },
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error_messages?.[0]?.description || 'Erro ao verificar pagamento.' });
    return res.status(200).json({
      id: data.id,
      status: STATUS_MAP[data.status] || 'pending',
      status_detail: data.status,
    });
  } catch (e) {
    return res.status(502).json({ error: 'Erro ao verificar pagamento.' });
  }
}
