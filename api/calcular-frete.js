// Token do Melhor Envio.
// Prefira definir MELHOR_ENVIO_TOKEN nas Environment Variables do Vercel;
// o valor abaixo é apenas fallback de desenvolvimento.
const MELHOR_ENVIO_TOKEN =
  process.env.MELHOR_ENVIO_TOKEN ||
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiOWVkOGFmNWQ0NThlMjA0ZDQ2NjhjOGIzZjY2NmVhZDI0YmI5ZWI5MzE0ZTI5NzliYTg5MmUwOTc5ZTBhNWJhYjE4NmFiNzVmOTkzYTdhZDMiLCJpYXQiOjE3ODIwNzk5MjIuNDkxMzc3LCJuYmYiOjE3ODIwNzk5MjIuNDkxMzc5LCJleHAiOjE4MTM2MTU5MjIuNDc5MjU4LCJzdWIiOiI5ZjQ0Yzg3OC1iMTI3LTQ1ZmItOTdhZC0xNTEzNmExOTQzNmUiLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.dSU3PC7HKmrkhirRgo0XI7iKaj6-oOiC7xJpcwKhDUElDK-eUDYTHrhob9bHkVfv5cmHY2bdOwevr0oDk_EsuJ8xoguVp_20hIvbyGUgGsS9FYQ8rQek6ll73wqxHRvI1hDBmPLz3JoRYGRfmdC5Wx3pwq6k5wP2AI7O_601PXeqom1gUGP-njCvliMvTlzZ8TS6gkTXlp8Z2v42NgWBEM7UfwQ2Uib6ubHcYg-me7M0596M-zoMq8X2Eq3Y7ZQqPmOiXC1-GO4XRuoFtH5sEPOT5__zA8pIqVhowhtdWdknRdXbAcWxyj7jmvlTKysJCmP06cvL_XX2CcntozsnjQ_oz83ZbmcON3FR2AYdKGwBc9pFehHFTSE5dUlZkAiUoIZ6YZRJMQXzPBKieengh4Xwgwi6FNjTFueyMKqsjOgcDHouU3ilJJW3iEzJed_P9p5p5xSGrwdjg6Brw9X1brBIjg2O0ph4Stmu5vAccFsop1KzgdtD1rlVPQ2nXdJEWP6xv8A1mp-fkICUvTO1U5bQlGcijUVjp3xefk0ToBCyFi6YPOiUY5T7DG-3FElsxAL-RjaDe5Cg69pY-Qb6TuwMxoZ5G1UphxQYD9uK3ALdYOEK38v-DfXB649GfJGA_33VIYzdGu6l_i1pmBmjbaUWAfDkIQZGHtCnbsxY5m-QY';

const MELHOR_ENVIO_URL =
  'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
