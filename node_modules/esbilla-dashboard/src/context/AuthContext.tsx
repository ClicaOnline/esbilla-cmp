import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, initError, isFirebaseConfigured } from '../lib/firebase';

// ============================================
// TIPOS DE ROLES Y PERMISOS
// ============================================

export type GlobalRole = 'superadmin' | 'admin' | 'viewer' | 'pending';
export type UserRole = GlobalRole;
export type SiteRole = 'owner' | 'admin' | 'viewer';

export interface SiteAccess {
  role: SiteRole;
  siteId: string;
  siteName?: string;
  addedAt: Date;
  addedBy: string;
}

export interface UserData {
  email: string;
  displayName: string;
  photoURL: string;
  role: GlobalRole;
  siteAccess?: Record<string, SiteAccess>;
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthorized: boolean;
  hasAccessToSite: (siteId: string) => boolean;
  getSiteRole: (siteId: string) => SiteRole | null;
  canManageSite: (siteId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar llamadas duplicadas a loadUserData
  const loadingUserData = useRef(false);

  // ============================================
  // CARGA DE DATOS DEL USUARIO
  // ============================================
  async function loadUserData(firebaseUser: User) {
    // Evitar llamadas duplicadas
    if (loadingUserData.current) return;
    loadingUserData.current = true;

    if (!db) {
      setError('Firestore no está disponible');
      loadingUserData.current = false;
      return;
    }

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const parsedData: UserData = {
          email: data.email || firebaseUser.email || '',
          displayName: data.displayName || firebaseUser.displayName || '',
          photoURL: data.photoURL || firebaseUser.photoURL || '',
          role: data.role || 'pending',
          siteAccess: data.siteAccess || {},
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || new Date(),
          createdBy: data.createdBy
        };

        setUserData(parsedData);

        // Actualizar último login (no esperar)
        setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch(console.error);
      } else {
        // Primer login - crear usuario con rol 'pending'
        const newUserData: UserData = {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          role: 'pending',
          siteAccess: {},
          createdAt: new Date(),
          lastLogin: new Date()
        };

        await setDoc(userRef, {
          ...newUserData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });

        setUserData(newUserData);
      }
    } catch (err) {
      console.error('Error cargando datos del usuario:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      loadingUserData.current = false;
    }
  }

  // ============================================
  // EFECTO DE AUTENTICACIÓN
  // ============================================
  useEffect(() => {
    if (initError || !isFirebaseConfigured) {
      setError(initError?.message || 'Firebase no está configurado correctamente');
      setLoading(false);
      return;
    }

    if (!auth) {
      setError('Firebase Auth no está disponible');
      setLoading(false);
      return;
    }

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

  // ============================================
  // ACCIONES DE AUTENTICACIÓN
  // ============================================
  async function signInWithGoogle() {
    if (!auth || !googleProvider) {
      setError('Firebase Auth no está disponible');
      return;
    }

    try {
      setError(null);
      // Solo llamar a signInWithPopup - onAuthStateChanged se encargará del resto
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Error en login:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  }

  async function signOut() {
    if (!auth) {
      setError('Firebase Auth no está disponible');
      return;
    }

    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err: unknown) {
      console.error('Error en logout:', err);
      setError(err instanceof Error ? err.message : 'Error al cerrar sesión');
    }
  }

  // ============================================
  // HELPERS DE PERMISOS
  // ============================================
  // Compatibilidad: verificar tanto 'role' (legacy) como 'globalRole' (nuevo sistema)
  // 'admin' del sistema antiguo se trata como 'superadmin' (era el único nivel admin)
  const isSuperAdmin = userData?.role === 'superadmin' || userData?.role === 'admin';
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';
  const isAuthorized = ['superadmin', 'admin', 'viewer'].includes(userData?.role || '');

  function hasAccessToSite(siteId: string): boolean {
    if (isSuperAdmin) return true;
    return !!userData?.siteAccess?.[siteId];
  }

  function getSiteRole(siteId: string): SiteRole | null {
    if (isSuperAdmin) return 'owner';
    return userData?.siteAccess?.[siteId]?.role || null;
  }

  function canManageSite(siteId: string): boolean {
    if (isSuperAdmin) return true;
    const siteRole = getSiteRole(siteId);
    return siteRole === 'owner' || siteRole === 'admin';
  }

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      error,
      signInWithGoogle,
      signOut,
      isAdmin,
      isSuperAdmin,
      isAuthorized,
      hasAccessToSite,
      getSiteRole,
      canManageSite
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
