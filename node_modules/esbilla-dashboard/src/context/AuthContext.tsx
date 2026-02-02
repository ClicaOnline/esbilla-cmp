import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

export type UserRole = 'admin' | 'viewer' | 'pending';

interface UserData {
  email: string;
  role: UserRole;
  displayName: string;
  photoURL: string;
  createdAt: Date;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del usuario desde Firestore
  async function loadUserData(firebaseUser: User) {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserData;
        setUserData(data);

        // Actualizar último login
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      } else {
        // Primer login - crear usuario con rol 'pending'
        const newUserData: Partial<UserData> = {
          email: firebaseUser.email || '',
          role: 'pending',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          createdAt: new Date(),
          lastLogin: new Date()
        };

        await setDoc(userRef, {
          ...newUserData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        setUserData(newUserData as UserData);
      }
    } catch (err) {
      console.error('Error cargando datos del usuario:', err);
      setError('Error al cargar los datos del usuario');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function signInWithGoogle() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await loadUserData(result.user);
    } catch (err: any) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err: any) {
      console.error('Error en logout:', err);
      setError(err.message || 'Error al cerrar sesión');
    }
  }

  const isAdmin = userData?.role === 'admin';
  const isAuthorized = userData?.role === 'admin' || userData?.role === 'viewer';

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      error,
      signInWithGoogle,
      signOut,
      isAdmin,
      isAuthorized
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
