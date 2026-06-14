import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithGoogle as authSignInWithGoogle,
  getGoogleRedirectResult,
  onAuthStateChanged,
} from '../services/auth';

const AuthContext = createContext(null);

// E-mail com privilégio de administrador — deve bater com firestore.rules (isAdmin).
// TODO: mover para Custom Claim do Firebase quando o backend evoluir.
const ADMIN_EMAILS = ['emporiominas00@gmail.com'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    getGoogleRedirectResult()
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((e) => {
        if (e?.code !== 'auth/no-auth-event' && e?.code !== 'auth/argument-error') {
          console.warn('[Auth] redirect result error', e);
        }
      });
  }, []);

  // Faz login no Firebase. Lança erro com `code` se falhar — a tela trata a UI.
  const login = (email, password) => {
    return authSignIn(email, password);
  };

  // Cadastro de novo usuário. Lança erro com `code` se falhar.
  const signup = (email, password) => {
    return authSignUp(email, password);
  };

  // Login com Google via popup (web) ou erro amigável (nativo).
  const loginWithGoogle = () => {
    return authSignInWithGoogle();
  };

  // Logout. O onAuthStateChanged limpa o `user` e o AppNavigator redireciona para Login.
  const logout = () => {
    return authSignOut();
  };

  const isAdmin = !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  const value = {
    user,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>.');
  }
  return ctx;
}
