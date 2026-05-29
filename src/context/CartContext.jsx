import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);

// Regras de negócio do carrinho — centralizadas para fácil ajuste.
const COUPON_CODE = 'CANASTRA10';
const COUPON_DISCOUNT = 11.0;
const SHIPPING_FEE = 15.9;

// Itens iniciais (mock) — mantém a UX do protótipo enquanto não há backend.
// TODO: zerar este array quando o catálogo vier do Firestore.
const INITIAL_ITEMS = [
  {
    id: 'i1',
    name: 'Queijo Canastra Maturado 60 dias',
    producer: 'Fazenda São João',
    weight: '400g',
    price: 54.9,
    qty: 1,
    colors: ['#f1dca1', '#a87532'],
  },
  {
    id: 'i2',
    name: 'Café Especial Cerrado',
    producer: 'Torrefação Mineira',
    weight: '250g',
    price: 34.9,
    qty: 2,
    colors: ['#c08a55', '#3a1a08'],
  },
  {
    id: 'i3',
    name: 'Doce de Leite Cremoso',
    producer: 'Doceria Artesanal',
    weight: '350g',
    price: 18.5,
    qty: 1,
    sale: 20,
    colors: ['#e3a96a', '#7a3c0e'],
  },
];

export function CartProvider({ children }) {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [coupon, setCoupon] = useState(COUPON_CODE);
  const [couponApplied, setCouponApplied] = useState(true);

  // Adiciona um item. Se já existir (mesmo id), soma à quantidade.
  const addItem = useCallback((item) => {
    if (!item || !item.id) return;
    setItems((arr) => {
      const exists = arr.find((x) => x.id === item.id);
      if (exists) {
        return arr.map((x) =>
          x.id === item.id ? { ...x, qty: x.qty + (item.qty ?? 1) } : x
        );
      }
      return [...arr, { ...item, qty: item.qty ?? 1 }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((arr) => arr.filter((x) => x.id !== id));
  }, []);

  // qty <= 0 remove o item.
  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) {
      setItems((arr) => arr.filter((x) => x.id !== id));
      return;
    }
    setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty } : x)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Aplica o cupom. Retorna `true` se válido, `false` caso contrário.
  const applyCoupon = useCallback((code) => {
    const trimmed = (code ?? '').trim();
    setCoupon(trimmed);
    const isValid = trimmed.toUpperCase() === COUPON_CODE;
    setCouponApplied(isValid);
    return isValid;
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon('');
    setCouponApplied(false);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + x.price * x.qty, 0),
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, x) => sum + x.qty, 0),
    [items]
  );

  const shipping = items.length ? SHIPPING_FEE : 0;
  const discount = couponApplied && items.length ? COUPON_DISCOUNT : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const value = {
    items,
    coupon,
    setCoupon,
    couponApplied,
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
