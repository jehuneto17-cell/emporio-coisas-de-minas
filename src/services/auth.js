import {
  getReactNativePersistence,
  browserLocalPersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import app from './firebase';

const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}

export function signInWithGoogle() {
  if (Platform.OS !== 'web') {
    return Promise.reject({
      code: 'auth/platform-not-supported',
      message: 'Login com Google disponível apenas na versão web por enquanto.',
    });
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithRedirect(auth, provider);
}

export function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

export function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha inválidos.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/email-already-in-use': 'Este e-mail já está em uso.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    'auth/user-disabled': 'Esta conta foi desativada.',
  };
  return messages[code] ?? 'Erro ao autenticar. Tente novamente.';
}
