// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
// Importa equí otros servicios que precises, como Auth o Firestore
// import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: "esbilla-cmp.firebaseapp.com",
  projectId: "esbilla-cmp",
  storageBucket: "esbilla-cmp.firebasestorage.app",
  messagingSenderId: "294704442008",
  appId: "1:294704442008:web:1879a4da2b9851df253eed"
};

// Inicializamos Firebase solo una vegada
const app = initializeApp(firebaseConfig);

// Esportamos pa usalo n'otros sitios
export { app };