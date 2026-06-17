import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  writeBatch,
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

export async function createUserProfile(uid, { name, email, phone }) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    phone: phone || '',
    createdAt: serverTimestamp(),
  });
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
    status: 'pendente',
    createdAt: serverTimestamp(),
  });
  return orderId;
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
