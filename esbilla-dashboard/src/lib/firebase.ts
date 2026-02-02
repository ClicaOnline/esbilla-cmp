import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Configuración de Firebase - En producción usar variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'esbilla-cmp.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'esbilla-cmp',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'esbilla-cmp.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if Firebase is configured
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

// Log configuration status (only in development)
if (import.meta.env.DEV) {
  console.log('Firebase configured:', isFirebaseConfigured);
  if (!isFirebaseConfigured) {
    console.warn('Firebase configuration missing. Check VITE_FIREBASE_* environment variables.');
  }
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let initError: Error | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();

  // Configurar el proveedor de Google
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
} catch (error) {
  console.error('Error initializing Firebase:', error);
  initError = error instanceof Error ? error : new Error('Unknown Firebase initialization error');
}

export { auth, db, googleProvider, initError };
