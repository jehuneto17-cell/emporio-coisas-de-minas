import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { fmt } from '../theme';
import {
  getCartItems,
  setCartItem,
  deleteCartItem,
  clearCartItems,
  getCupons,
} from '../services/firestore';

const CartContext = createContext(null);

const SHIPPING_FEE = 15.9;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponData, setCouponData] = useState(null);
  // true enquanto a leitura inicial do Firestore não terminou (só quando logado).
  const [hydrating, setHydrating] = useState(false);

  // Hidrata quando o usuário loga; limpa quando desloga (sem deletar do Firestore).
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setHydrating(true);
    getCartItems(user.uid)
      .then((data) => setItems(data))
      .catch((e) => console.warn('[Cart] hydration error', e))
      .finally(() => setHydrating(false));
  }, [user]);

  // Adiciona um item. Se já existir (mesmo id), soma à quantidade.
  const addItem = useCallback((item) => {
    if (!item || !item.id) return;
    setItems((arr) => {
      const exists = arr.find((x) => x.id === item.id);
      if (exists) {
        const updated = { ...exists, qty: exists.qty + (item.qty ?? 1) };
        if (user) setCartItem(user.uid, updated).catch((e) => console.warn('[Cart]', e));
        return arr.map((x) => x.id === item.id ? updated : x);
      }
      const newItem = { ...item, qty: item.qty ?? 1 };
      if (user) setCartItem(user.uid, newItem).catch((e) => console.warn('[Cart]', e));
      return [...arr, newItem];
    });
  }, [user]);

  const removeItem = useCallback((id) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
    if (user) deleteCartItem(user.uid, id).catch((e) => console.warn('[Cart]', e));
  }, [user]);

  // qty <= 0 remove o item.
  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) {
      setItems((arr) => arr.filter((x) => x.id !== id));
      if (user) deleteCartItem(user.uid, id).catch((e) => console.warn('[Cart]', e));
      return;
    }
    setItems((arr) => {
      const item = arr.find((x) => x.id === id);
      if (!item) return arr;
      const updated = { ...item, qty };
      if (user) setCartItem(user.uid, updated).catch((e) => console.warn('[Cart]', e));
      return arr.map((x) => x.id === id ? updated : x);
    });
  }, [user]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (user) clearCartItems(user.uid).catch((e) => console.warn('[Cart]', e));
  }, [user]);

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + x.price * x.qty, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, x) => sum + x.qty, 0),
    [items]
  );

  const applyCoupon = useCallback(async (code) => {
    const trimmed = (code ?? '').trim().toUpperCase();
    setCoupon(trimmed);
    setCouponError('');
    if (!trimmed) {
      setCouponApplied(false);
      setCouponData(null);
      return false;
    }
    try {
      const cupons = await getCupons();
      const found = cupons.find(
        (c) => (c.code || c.codigo || '').toUpperCase() === trimmed
      );
      if (!found) {
        setCouponApplied(false);
        setCouponData(null);
        setCouponError('Cupom inválido ou não encontrado.');
        return false;
      }
      const status = (found.status || '').toLowerCase();
      if (status !== 'ativo') {
        setCouponApplied(false);
        setCouponData(null);
        setCouponError('Este cupom não está mais ativo.');
        return false;
      }
      const minOrder = found.minOrder ?? found.minimo ?? 0;
      if (subtotal < minOrder) {
        setCouponApplied(false);
        setCouponData(null);
        setCouponError(`Pedido mínimo de ${fmt(minOrder)} para usar este cupom.`);
        return false;
      }
      const discountValue = found.discountValue ?? found.valor ?? found.discount ?? 0;
      setCouponData({ ...found, discountValue });
      setCouponApplied(true);
      return true;
    } catch (e) {
      console.warn('[Cupom] erro ao buscar cupons:', e);
      setCouponError('Erro ao validar cupom. Tente novamente.');
      setCouponApplied(false);
      setCouponData(null);
      return false;
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    setCoupon('');
    setCouponApplied(false);
    setCouponData(null);
    setCouponError('');
  }, []);

  const shipping = items.length ? SHIPPING_FEE : 0;
  const discount = couponApplied && couponData && items.length ? couponData.discountValue : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const value = {
    items,
    hydrating,
    coupon,
    setCoupon,
    couponApplied,
    couponError,
    couponData,
    applyCoupon,
    removeCoupon,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    totalItems,
    shipping,
    discount,
    total,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de um <CartProvider>.');
  }
  return ctx;
}
