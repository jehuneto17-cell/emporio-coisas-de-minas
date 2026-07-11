import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import app from './firebase';

const db = getFirestore(app);
const COL = 'produtos';

// ─── Mapeamento de campos ─────────────────────────────────────────────────────
// O painel admin salva os campos abaixo. Esta função adapta para o formato
// esperado pelas telas do app.
//
// Campos do admin → campos do app:
//   promo (R$)   → sale (% desconto calculado)
//   description  → description (shortDesc do formulário)
//   longDesc     → longDesc
//   category     → category (id) + categoryLabel (buscado das categorias)
//   featured     → featured
//   rating/reviewCount → não gerenciados pelo admin; default 0

function mapProduct(d) {
  const raw = { id: d.id, ...d.data() };
  const sale =
    raw.promo && raw.price && raw.price > 0
      ? Math.round((1 - raw.promo / raw.price) * 100)
      : (raw.sale || 0);
  return {
    ...raw,
    sale,
    rating: raw.rating || 0,
    reviewCount: raw.reviewCount || 0,
    weights: raw.weights || [],
    colors: raw.colors || [],
    categoryLabel: raw.categoryLabel || raw.category || '',
    weight: raw.weight || 0,
    weightHeight: raw.weightHeight || 0,
    weightWidth: raw.weightWidth || 0,
    weightLength: raw.weightLength || 0,
  };
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
// Busca apenas produtos visíveis e ativos do Firestore.
// Retorna array vazio se coleção estiver vazia — nunca usa SEED_PRODUCTS
// como fallback automático (dados mock não devem aparecer em produção).

async function fetchAll() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs
    .map(mapProduct)
    .filter((p) => p.visible !== false && p.status !== 'Inativo');
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

export async function getProducts() {
  return fetchAll();
}

export async function getProductsByCategory(categoryId) {
  if (!categoryId) return fetchAll();
  const all = await fetchAll();
  return all.filter(p =>
    p.visible !== false &&
    p.status !== 'Inativo' &&
    (p.category === categoryId || p.subcategory === categoryId)
  );
}

export async function getProductById(id) {
  const all = await fetchAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function createUserProfile(uid, { name, email, phone, cpf }) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    phone: phone || '',
    cpf: cpf || '',
    createdAt: serverTimestamp(),
  });
}

export async function upsertClienteAdmin(uid, data) {
  try {
    await setDoc(doc(db, 'clientes', uid), {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      status: 'ativo',
      tier: 'Novo',
      orders: 0,
      spent: 0,
      since: new Date().toLocaleDateString('pt-BR'),
      last: '—',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('[upsertClienteAdmin]', e.message);
  }
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getUserOrders(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'orders'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────
// Visitante (uid null) não gera documento — retorna null silenciosamente.

export async function getOrder(uid, orderId) {
  const snap = await getDoc(doc(db, 'users', uid, 'orders', orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function addOrder(uid, orderData) {
  if (!uid) return null;
  const orderId = Date.now().toString();
  await setDoc(doc(db, 'users', uid, 'orders', orderId), {
    ...orderData,
    status: orderData.status || 'pendente',
    createdAt: serverTimestamp(),
  });
  return orderId;
}

export async function savePixData(uid, orderId, pixData) {
  try {
    console.log('[savePixData] gravando pixQrCode para orderId:', orderId, 'uid:', uid);
    await setDoc(doc(db, 'users', uid, 'orders', orderId), {
      pixId: pixData.id,
      pixQrCode: pixData.qr_code,
      pixQrCodeBase64: pixData.qr_code_base64,
      pixStatus: 'pending',
    }, { merge: true });
    // Espelha no /pedidos também
    await setDoc(doc(db, 'pedidos', orderId), {
      pixId: pixData.id,
      pixStatus: 'pending',
      status: 'Aguardando pagamento',
    }, { merge: true });
  } catch (e) {
    console.warn('[savePixData]', e.message);
  }
}

export async function updatePixStatus(uid, orderId, status) {
  try {
    await setDoc(doc(db, 'users', uid, 'orders', orderId), {
      pixStatus: status,
      status: status === 'approved' ? 'Pago' : 'Aguardando pagamento',
    }, { merge: true });
    await setDoc(doc(db, 'pedidos', orderId), {
      pixStatus: status,
      status: status === 'approved' ? 'Pago' : 'Aguardando pagamento',
    }, { merge: true });
  } catch (e) {
    console.warn('[updatePixStatus]', e.message);
  }
}

export async function getPedidoAdmin(orderId) {
  try {
    const snap = await getDoc(doc(db, 'pedidos', orderId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn('[getPedidoAdmin]', e.message);
    return null;
  }
}

export async function getTrackingInfo(trackingCode) {
  if (!trackingCode || trackingCode === '—' || trackingCode.trim() === '') return null;
  try {
    const res = await fetch(
      `https://emporio-coisas-de-minas.vercel.app/api/rastrear?codigo=${trackingCode}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) {
    console.warn('[getTrackingInfo]', e.message);
    return null;
  }
}

export async function addPedidoAdmin(uid, orderId, orderData, userProfile) {
  try {
    // Nome real do cliente. Fallback final 'Cliente' só quando não há nada utilizável.
    const customerName =
      userProfile?.name || userProfile?.email || 'Cliente';
    const initials = customerName.substring(0, 2).toUpperCase();
    await setDoc(doc(db, 'pedidos', orderId), {
      uid,
      customer: customerName,
      customerEmail: userProfile?.email || '',
      customerPhone: userProfile?.phone || '',
      initials,
      tint: '#a85a32',
      city: orderData.deliveryAddress?.city || '',
      number: '#' + orderId.slice(-6),
      total: orderData.total || 0,
      subtotal: orderData.subtotal || 0,
      freight: orderData.shippingCost || 0,
      shipping: orderData.shippingMethod || '',
      payment: orderData.paymentMethod || 'pix',
      // Cupom/desconto — o painel admin lê estes nomes de campo
      // (raw.coupon / raw.discountValue) no order-detail.
      coupon: orderData.coupon || '',
      discountValue: orderData.discount || 0,
      status: 'Pendente',
      tracking: '',
      // Array original do carrinho — necessário para o app sincronizar o
      // status do pedido via uid (o painel admin grava de volta em
      // /users/{uid}/orders/{orderId}).
      items: orderData.items || [],
      products: (orderData.items || []).map(item => ({
        n: item.name || '',
        sku: item.sku || '',
        p: item.price || 0,
        q: item.qty || 1,
        producer: item.producer || '',
        tint: '#a85a32',
        initials: (item.name || '').substring(0, 2).toUpperCase(),
      })),
      address: {
        name: customerName,
        line1: `${orderData.deliveryAddress?.street || ''}, ${orderData.deliveryAddress?.number || ''}`,
        district: orderData.deliveryAddress?.neighborhood || '',
        city: orderData.deliveryAddress?.city || '',
        state: orderData.deliveryAddress?.state || '',
        cep: orderData.deliveryAddress?.cep || '',
      },
      deliveryAddress: orderData.deliveryAddress || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (e) {
    console.warn('[addPedidoAdmin]', e.message);
    return null;
  }
}

// ─── Favoritos ────────────────────────────────────────────────────────────────

export async function getFavorites(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setFavorite(uid, product) {
  const clean = Object.fromEntries(
    Object.entries(product).filter(([, v]) => v !== undefined)
  );
  await setDoc(doc(db, 'users', uid, 'favorites', product.id), clean);
}

export async function deleteFavorite(uid, id) {
  await deleteDoc(doc(db, 'users', uid, 'favorites', id));
}

export async function clearFavoriteDocs(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

// ─── Carrinho ─────────────────────────────────────────────────────────────────

export async function getCartItems(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'cart'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setCartItem(uid, item) {
  const ref = doc(db, 'users', uid, 'cart', String(item.id));
  const clean = Object.fromEntries(
    Object.entries(item).filter(([, v]) => v !== undefined)
  );
  await setDoc(ref, clean);
}

export async function deleteCartItem(uid, itemId) {
  await deleteDoc(doc(db, 'users', uid, 'cart', itemId));
}

export async function clearCartItems(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'cart'));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function getCategories() {
  const snap = await getDocs(collection(db, 'categorias'));
  const all = await fetchAll();
  const cats = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.visible !== false && !c.parentId);
  return cats.map(c => ({
    ...c,
    count: all.filter(p => p.category === c.id).length,
  })).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getBanners() {
  try {
    const snap = await getDocs(collection(db, 'banners'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(b => b.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    console.warn('[getBanners]', e);
    return [];
  }
}

export async function getSimilarProducts(categoryId, excludeId) {
  const all = await fetchAll();
  return all
    .filter(p => (p.category === categoryId || p.subcategory === categoryId) && p.id !== excludeId)
    .slice(0, 8);
}

export async function getAllCategories() {
  const snap = await getDocs(collection(db, 'categorias'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSubcategories(parentId) {
  const snap = await getDocs(collection(db, 'categorias'));
  const all = await fetchAll();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.parentId === parentId && c.visible !== false)
    .map(c => ({
      ...c,
      count: all.filter(p => p.category === parentId && p.subcategory === c.id).length,
    }));
}

export async function updateUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── Endereços ────────────────────────────────────────────────────────────────

export async function getAddresses(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveAddress(uid, address) {
  const id = address.id || Date.now().toString();
  const { id: _id, ...data } = address;
  await setDoc(doc(db, 'users', uid, 'addresses', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  return id;
}

export async function deleteAddress(uid, addressId) {
  await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
}

export async function setDefaultAddress(uid, addressId) {
  const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, { isDefault: d.id === addressId });
  });
  await batch.commit();
}

export async function searchProducts(term) {
  const all = await fetchAll();
  const lower = term.toLowerCase().trim();
  if (!lower) return [];
  return all.filter(
    (p) =>
      p.name?.toLowerCase().includes(lower) ||
      p.producer?.toLowerCase().includes(lower) ||
      p.category?.toLowerCase().includes(lower) ||
      p.categoryLabel?.toLowerCase().includes(lower)
  );
}

// ─── Avaliações ───────────────────────────────────────────────────────────────

export async function getReviews(productId) {
  try {
    const snap = await getDocs(collection(db, 'produtos', productId, 'reviews'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[getReviews]', e.message);
    return [];
  }
}

export async function getUserReview(productId, uid) {
  try {
    const snap = await getDoc(doc(db, 'produtos', productId, 'reviews', uid));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn('[getUserReview]', e.message);
    return null;
  }
}

export async function hasUserBoughtProduct(uid, productId) {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'orders'));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return orders.some(order =>
      Array.isArray(order.items) &&
      order.items.some(item => String(item.id) === String(productId))
    );
  } catch (e) {
    console.warn('[hasUserBoughtProduct]', e.message);
    return false;
  }
}

export async function decrementarEstoque(items) {
  if (!items || items.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const item of items) {
      if (!item.id) continue;
      const ref = doc(db, 'produtos', String(item.id));
      const snap = await getDoc(ref);
      if (!snap.exists()) continue;
      const currentStock = snap.data().stock ?? 0;
      const newStock = Math.max(0, currentStock - (item.qty || 1));
      batch.update(ref, {
        stock: newStock,
        status: newStock === 0 ? 'Esgotado' : 'Ativo',
        updatedAt: new Date(),
      });
    }
    await batch.commit();
  } catch (e) {
    console.warn('[decrementarEstoque]', e.message);
  }
}

export async function getCupons() {
  try {
    const snap = await getDocs(collection(db, 'cupons'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[getCupons]', e);
    return [];
  }
}

// Lê as configurações da loja salvas pelo painel admin na coleção /configuracoes.
// O doc 'loja' é mesclado na raiz; os demais docs (ex.: 'pagamento') viram chaves
// pelo próprio id — espelha o comportamento de DB.getConfiguracoes() do admin.
export async function getConfiguracoes() {
  try {
    const snap = await getDocs(collection(db, 'configuracoes'));
    const result = {};
    snap.docs.forEach((d) => {
      if (d.id === 'loja') {
        Object.assign(result, d.data());
      } else {
        result[d.id] = d.data();
      }
    });
    return result;
  } catch (e) {
    console.warn('[getConfiguracoes]', e);
    return {};
  }
}

export async function submitReview(productId, uid, userName, rating, comment) {
  try {
    await setDoc(doc(db, 'produtos', productId, 'reviews', uid), {
      uid,
      userName,
      rating,
      comment: comment.trim(),
      createdAt: serverTimestamp(),
    });

    const snap = await getDocs(collection(db, 'produtos', productId, 'reviews'));
    const reviews = snap.docs.map(d => d.data());
    const count = reviews.length;
    const avg = count > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / count
      : 0;

    await setDoc(doc(db, 'produtos', productId), {
      rating: Math.round(avg * 10) / 10,
      reviewCount: count,
    }, { merge: true });

    return true;
  } catch (e) {
    console.warn('[submitReview]', e.message);
    return false;
  }
}
