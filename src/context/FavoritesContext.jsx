import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

const FavoritesContext = createContext(null);

// Favoritos iniciais (mock) — mantém a UX do protótipo enquanto não há backend.
// TODO: zerar este array quando os favoritos forem persistidos no Firestore.
const INITIAL_FAVORITES = [
  {
    id: 'f1',
    name: 'Queijo Canastra Maturado 60 dias',
    producer: 'Fazenda São João',
    price: 'R$ 54,90',
    rating: '4.9',
    colors: ['#f1dca1', '#a87532'],
  },
  {
    id: 'f2',
    name: 'Café Especial Cerrado',
    producer: 'Sítio Boa Vista',
    price: 'R$ 34,90',
    rating: '4.8',
    colors: ['#a86434', '#3a1a08'],
  },
  {
    id: 'f3',
    name: 'Doce de Leite Cremoso',
    producer: 'Fazenda Pé da Serra',
    price: 'R$ 18,50',
    rating: '4.9',
    sale: 20,
    colors: ['#e3a96a', '#7a3c0e'],
  },
  {
    id: 'f4',
    name: 'Cachaça Ouro Velho',
    producer: 'Alambique Salinas',
    price: 'R$ 89,00',
    rating: '4.7',
    colors: ['#e9c071', '#8b5a14'],
  },
];

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);

  const addFavorite = useCallback((product) => {
    if (!product || !product.id) return;
    setFavorites((arr) => {
      if (arr.some((x) => x.id === product.id)) return arr;
      return [...arr, product];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites((arr) => arr.filter((x) => x.id !== id));
  }, []);

  const isFavorite = useCallback(
    (id) => favorites.some((x) => x.id === id),
    [favorites]
  );

  // Atalho útil para botões de "coração" que alternam o estado.
  const toggleFavorite = useCallback((product) => {
    if (!product || !product.id) return;
    setFavorites((arr) => {
      if (arr.some((x) => x.id === product.id)) {
        return arr.filter((x) => x.id !== product.id);
      }
      return [...arr, product];
    });
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = {
    favorites,
    count: favorites.length,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites deve ser usado dentro de um <FavoritesProvider>.');
  }
  return ctx;
}
