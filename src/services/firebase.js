import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyA6ll77eLqckEbbyiQoJVZuYQ6VI470kIY",
  authDomain: "emporio-coisas-de-minas.firebaseapp.com",
  projectId: "emporio-coisas-de-minas",
  storageBucket: "emporio-coisas-de-minas.firebasestorage.app",
  messagingSenderId: "623158539642",
  appId: "1:623158539642:web:94977507f34e77cdbd12c3"
};

const app = initializeApp(firebaseConfig);

export default app;