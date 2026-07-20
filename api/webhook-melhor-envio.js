import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa Firebase Admin (apenas uma vez)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Mapeia status do Melhor Envio para status do app
function mapStatus(meStatus) {
  const map = {
    'posted':     'Em trânsito',
    'in_transit': 'Em trânsito',
    'delivered':  'Entregue',
    'undelivered':'Em trânsito',
    'canceled':   'Cancelado',
  };
  return map[meStatus] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Corpo pode vir vazio em requisições de teste do painel do Melhor Envio
  const rawBody = req.body && Object.keys(req.body).length > 0 ? req.body : {};

  // Validação da assinatura HMAC-SHA256 (X-ME-Signature)
  const secret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
  const signature = req.headers['x-me-signature'];

  if (!secret) {
    console.error('[webhook-ME] MELHOR_ENVIO_CLIENT_SECRET não configurado.');
    return res.status(500).json({ error: 'Configuração ausente.' });
  }

  // Se não há assinatura, verificar se parece uma notificação real de pedido (tem order_id).
  // Se não tiver order_id, é provavelmente o teste de validação do painel do Melhor Envio ao salvar o webhook.
  if (!signature) {
    if (!rawBody.order_id) {
      return res.status(200).json({ ok: true, test: true });
    }
    console.warn('[webhook-ME] requisição com order_id mas sem assinatura recebida — rejeitada.');
    return res.status(401).json({ error: 'Assinatura ausente.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(rawBody))
    .digest('hex');

  const validSignature =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!validSignature) {
    console.warn('[webhook-ME] assinatura inválida — possível tentativa de forjar requisição.');
    return res.status(401).json({ error: 'Assinatura inválida.' });
  }

  // A partir daqui, a requisição foi validada como vinda de fato do Melhor Envio.
  try {
    const { tracking, status, order_id } = rawBody;
    console.log('[webhook-ME] recebido:', { tracking, status, order_id });

    if (!order_id) {
      return res.status(200).json({ ok: true, ignored: true, reason: 'sem order_id' });
    }

    const newStatus = mapStatus(status);
    if (!newStatus) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const db = getFirestore();

    // Busca o pedido pelo melhorEnvioOrderId ou pelo tracking
    const pedidosSnap = await db.collection('pedidos')
      .where('melhorEnvioOrderId', '==', String(order_id))
      .limit(1)
      .get();

    if (pedidosSnap.empty) {
      console.warn('[webhook-ME] pedido não encontrado para order_id:', order_id);
      return res.status(200).json({ ok: true, notFound: true });
    }

    const pedidoDoc = pedidosSnap.docs[0];
    const pedidoData = pedidoDoc.data();
    const pedidoId = pedidoDoc.id;
    const uid = pedidoData.uid;

    // Atualiza status em /pedidos
    await pedidoDoc.ref.update({
      status: newStatus,
      tracking: tracking || pedidoData.tracking || '',
      updatedAt: new Date(),
    });

    // Atualiza status em /users/{uid}/orders/{pedidoId}
    if (uid) {
      await db.collection('users').doc(uid)
        .collection('orders').doc(pedidoId)
        .update({
          status: newStatus,
          tracking: tracking || '',
          updatedAt: new Date(),
        });
    }

    console.log('[webhook-ME] pedido', pedidoId, 'atualizado para', newStatus);
    return res.status(200).json({ ok: true, pedidoId, newStatus });
  } catch (e) {
    console.error('[webhook-ME]', e);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
