import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getFavorites,
  setFavorite,
  deleteFavorite,
  clearFavoriteDocs,
} from '../services/firestore';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  // Hidrata quando o usuário loga; limpa quando desloga (sem deletar do Firestore).
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }
    getFavorites(user.uid)
      .then((data) => setFavorites(data))
      .catch((e) => console.warn('[Favorites] hydration error', e));
  }, [user]);

  const addFavorite = useCallback((product) => {
    if (!product || !product.id) return;
    setFavorites((arr) => {
      if (arr.some((x) => x.id === product.id)) return arr;
      if (user) setFavorite(user.uid, product).catch((e) => console.warn('[Favorites]', e));
      return [...arr, product];
    });
  }, [user]);

  const removeFavorite = useCallback((id) => {
    setFavorites((arr) => arr.filter((x) => x.id !== id));
    if (user) deleteFavorite(user.uid, id).catch((e) => console.warn('[Favorites]', e));
  }, [user]);

  const isFavorite = useCallback(
    (id) => favorites.some((x) => x.id === id),
    [favorites]
  );

  // Atalho útil para botões de "coração" que alternam o estado.
  const toggleFavorite = useCallback((product) => {
    if (!product || !product.id) return;
    setFavorites((arr) => {
      const exists = arr.some((x) => x.id === product.id);
      if (exists) {
        if (user) deleteFavorite(user.uid, product.id).catch((e) => console.warn('[Favorites]', e));
        return arr.filter((x) => x.id !== product.id);
      }
      if (user) setFavorite(user.uid, product).catch((e) => console.warn('[Favorites]', e));
      return [...arr, product];
    });
  }, [user]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
    if (user) clearFavoriteDocs(user.uid).catch((e) => console.warn('[Favorites]', e));
  }, [user]);

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
