const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;

if (!MELHOR_ENVIO_TOKEN) {
  console.error('[calcular-frete] MELHOR_ENVIO_TOKEN não configurado nas variáveis de ambiente.');
}

const MELHOR_ENVIO_URL =
  'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!MELHOR_ENVIO_TOKEN) {
    return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const upstream = await fetch(MELHOR_ENVIO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'EmporioCoisasDeMinas (emporiominas00@gmail.com)',
      },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Resposta inválida do Melhor Envio', raw: text };
    }

    // Repassa o status real do Melhor Envio (ex.: 401 Unauthenticated)
    // em vez de mascarar tudo como 200.
    if (!upstream.ok) {
      console.error(
        '[calcular-frete] Melhor Envio respondeu',
        upstream.status,
        text.slice(0, 500)
      );
      return res.status(upstream.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('[calcular-frete]', error);
    return res.status(502).json({ error: 'Erro ao calcular frete' });
  }
}
