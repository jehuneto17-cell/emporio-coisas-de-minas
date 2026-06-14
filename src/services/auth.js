import {
  getReactNativePersistence,
  initializeAuth,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import app from './firebase';

WebBrowser.maybeCompleteAuthSession();

const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export { auth };

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

export async function signInWithGoogleCredential(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export function getGoogleRedirectResult() {
  return Promise.resolve(null);
}

export function sendPasswordResetEmail(email) {
  return firebaseSendPasswordResetEmail(auth, email);
}

export async function deleteAccount(password) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado.');
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUser(user);
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
    'auth/argument-error': 'Erro ao iniciar login com Google. Tente novamente.',
    'auth/popup-blocked': 'O popup foi bloqueado pelo navegador.',
    'auth/popup-closed-by-user': 'Login cancelado.',
    'auth/platform-not-supported': 'Login com Google disponível apenas na versão web.',
  };
  return messages[code] ?? 'Erro ao autenticar. Tente novamente.';
}
