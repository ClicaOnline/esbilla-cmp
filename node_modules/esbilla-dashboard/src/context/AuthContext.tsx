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

// ============================================
// TIPOS DE ROLES Y PERMISOS
// ============================================

/**
 * Roles globales del sistema:
 * - superadmin: Acceso total a todos los sitios y configuración global
 * - admin: Puede gestionar usuarios y ver estadísticas (del dashboard actual)
 * - viewer: Solo puede ver estadísticas y buscar footprints
 * - pending: Usuario registrado pendiente de aprobación
 */
export type GlobalRole = 'superadmin' | 'admin' | 'viewer' | 'pending';

// Alias para compatibilidad con código existente
export type UserRole = GlobalRole;

/**
 * Roles específicos por sitio (para multi-tenant futuro):
 * - owner: Propietario del sitio, control total
 * - admin: Puede configurar el sitio y ver estadísticas
 * - viewer: Solo puede ver estadísticas del sitio
 */
export type SiteRole = 'owner' | 'admin' | 'viewer';

/**
 * Acceso a un sitio específico
 */
export interface SiteAccess {
  role: SiteRole;
  siteId: string;
  siteName?: string;
  addedAt: Date;
  addedBy: string;
}

/**
 * Datos del usuario almacenados en Firestore
 */
export interface UserData {
  // Información básica
  email: string;
  displayName: string;
  photoURL: string;

  // Rol global (retrocompatible con campo 'role' anterior)
  role: GlobalRole;

  // Acceso a sitios específicos (multi-tenant futuro)
  // Formato: { "site-id-1": { role: "admin", ... }, "site-id-2": { role: "viewer", ... } }
  siteAccess?: Record<string, SiteAccess>;

  // Metadatos
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string;  // UID del admin que aprobó al usuario
}

/**
 * Contexto de autenticación
 */
interface AuthContextType {
  // Estado de autenticación
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;

  // Acciones
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Helpers de permisos globales
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAuthorized: boolean;

  // Helpers de permisos por sitio (multi-tenant futuro)
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

  // ============================================
  // CARGA DE DATOS DEL USUARIO
  // ============================================
  async function loadUserData(firebaseUser: User) {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        // Convertir datos de Firestore al tipo UserData
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

        // Actualizar último login
        await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
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
    }
  }

  // ============================================
  // EFECTOS
  // ============================================
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

  // ============================================
  // ACCIONES DE AUTENTICACIÓN
  // ============================================
  async function signInWithGoogle() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await loadUserData(result.user);
    } catch (err: unknown) {
      console.error('Error en login:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
    }
  }

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err: unknown) {
      console.error('Error en logout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
    }
  }

  // ============================================
  // HELPERS DE PERMISOS GLOBALES
  // ============================================
  const isSuperAdmin = userData?.role === 'superadmin';
  const isAdmin = userData?.role === 'admin' || userData?.role === 'superadmin';
  const isAuthorized = ['superadmin', 'admin', 'viewer'].includes(userData?.role || '');

  // ============================================
  // HELPERS DE PERMISOS POR SITIO (Multi-tenant)
  // ============================================

  /**
   * Verifica si el usuario tiene acceso a un sitio específico
   */
  function hasAccessToSite(siteId: string): boolean {
    // Superadmin tiene acceso a todo
    if (isSuperAdmin) return true;

    // Verificar acceso específico al sitio
    return !!userData?.siteAccess?.[siteId];
  }

  /**
   * Obtiene el rol del usuario en un sitio específico
   */
  function getSiteRole(siteId: string): SiteRole | null {
    // Superadmin es owner de todo
    if (isSuperAdmin) return 'owner';

    return userData?.siteAccess?.[siteId]?.role || null;
  }

  /**
   * Verifica si el usuario puede administrar un sitio
   */
  function canManageSite(siteId: string): boolean {
    if (isSuperAdmin) return true;

    const siteRole = getSiteRole(siteId);
    return siteRole === 'owner' || siteRole === 'admin';
  }

  // ============================================
  // PROVIDER
  // ============================================
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
