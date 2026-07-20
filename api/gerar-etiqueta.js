import { auth } from './_firebaseAdmin.js';

const ADMIN_EMAILS = ['emporiominas00@gmail.com'];

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

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (e) {
    console.warn('[gerar-etiqueta] token inválido:', e.message);
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  if (!ADMIN_EMAILS.includes(decoded.email)) {
    return res.status(403).json({ error: 'Acesso restrito ao administrador.' });
  }

  const ME_TOKEN = process.env.MELHOR_ENVIO_TOKEN;
  if (!ME_TOKEN) return res.status(500).json({ error: 'Token do Melhor Envio não configurado.' });

  try {
    const { pedido, remetente } = req.body;

    // 1. Adicionar ao carrinho do Melhor Envio
    const cartRes = await fetch('https://melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ME_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'EmporioCoisasDeMinas (emporiominas00@gmail.com)',
      },
      body: JSON.stringify({
        service: pedido.serviceId, // ID do serviço (Jadlog, PAC, SEDEX, etc.)
        agency: null,
        from: {
          name: remetente.nome,
          phone: remetente.telefone?.replace(/\D/g, ''),
          email: remetente.email,
          document: remetente.cpf?.replace(/\D/g, ''),
          address: remetente.rua,
          complement: remetente.complemento || '',
          number: remetente.numero,
          district: remetente.bairro,
          city: remetente.cidade,
          state_abbr: remetente.estado,
          country_id: 'BR',
          postal_code: remetente.cep?.replace(/\D/g, ''),
        },
        to: {
          name: pedido.customerName,
          phone: pedido.customerPhone?.replace(/\D/g, '') || '',
          email: pedido.customerEmail || '',
          document: pedido.customerCpf?.replace(/\D/g, '') || '',
          address: pedido.deliveryAddress?.street || '',
          complement: pedido.deliveryAddress?.complement || '',
          number: pedido.deliveryAddress?.number || '',
          district: pedido.deliveryAddress?.neighborhood || '',
          city: pedido.deliveryAddress?.city || '',
          state_abbr: pedido.deliveryAddress?.state || '',
          country_id: 'BR',
          postal_code: pedido.deliveryAddress?.cep?.replace(/\D/g, '') || '',
        },
        products: (pedido.items || []).map(item => ({
          name: item.name || 'Produto',
          quantity: item.qty || 1,
          unitary_value: item.price || 0,
          weight: item.weight || 0.3,
        })),
        volumes: [{
          height: pedido.packageHeight || 10,
          width: pedido.packageWidth || 15,
          length: pedido.packageLength || 20,
          weight: pedido.packageWeight || 0.5,
        }],
        options: {
          insurance_value: pedido.total || 0,
          receipt: false,
          own_hand: false,
          reverse: false,
          non_commercial: false,
          invoice: { key: '' },
          platform: 'Empório Coisas de Minas',
          tags: [{ tag: `Pedido #${String(pedido.orderId).slice(-6)}`, url: null }],
        },
      }),
    });

    const cartData = await cartRes.json();
    if (!cartRes.ok) {
      console.error('[gerar-etiqueta] erro ao adicionar no carrinho:', cartData);
      return res.status(cartRes.status).json({ error: cartData.message || 'Erro ao criar etiqueta no Melhor Envio.' });
    }

    const orderId = cartData.id;

    // 2. Fazer checkout (gerar a etiqueta)
    const checkoutRes = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ME_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'EmporioCoisasDeMinas (emporiominas00@gmail.com)',
      },
      body: JSON.stringify({ orders: [orderId] }),
    });

    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok) {
      console.error('[gerar-etiqueta] erro no checkout:', checkoutData);
      return res.status(checkoutRes.status).json({ error: checkoutData.message || 'Erro ao fazer checkout da etiqueta.' });
    }

    // 3. Gerar URL de impressão
    const printRes = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/generate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ME_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'EmporioCoisasDeMinas (emporiominas00@gmail.com)',
      },
      body: JSON.stringify({ orders: [orderId] }),
    });

    const printData = await printRes.json();

    return res.status(200).json({
      success: true,
      melhorEnvioOrderId: orderId,
      printUrl: printData.url || null,
      trackingCode: cartData.tracking || null,
    });

  } catch (e) {
    console.error('[gerar-etiqueta]', e);
    return res.status(502).json({ error: 'Erro interno ao gerar etiqueta.' });
  }
}
