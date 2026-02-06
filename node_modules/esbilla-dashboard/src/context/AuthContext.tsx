import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, initError, isFirebaseConfigured } from '../lib/firebase';
import { isSelfHostedMode } from '../utils/featureFlags';

// ============================================
// TIPOS DE ROLES Y PERMISOS
// ============================================

export type GlobalRole = 'superadmin' | 'pending';
export type OrganizationRole = 'org_owner' | 'org_admin' | 'org_viewer';
export type SiteRole = 'site_admin' | 'site_viewer';
export type LegacyRole = 'admin' | 'viewer'; // For backward compatibility

export interface OrganizationAccess {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
  addedAt: Date;
  addedBy: string;
}

export interface SiteAccess {
  siteId: string;
  siteName?: string;
  role: SiteRole;
  addedAt: Date;
  addedBy: string;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  globalRole: GlobalRole | LegacyRole; // Support legacy roles
  orgAccess?: Record<string, OrganizationAccess>;
  siteAccess?: Record<string, SiteAccess>;
  createdAt: Date;
  lastLogin: Date;
  createdBy?: string;
  authProvider?: 'google' | 'email';
  onboardingCompleted?: boolean;
  locale?: string;
  // Legacy field for backward compatibility
  role?: GlobalRole | LegacyRole;
}

interface AuthContextType {
  // User state
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;

  // New state properties
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  hasOrgAccess: boolean;
  isPending: boolean;
  locale: string;

  // Authentication methods
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;

  // Legacy permission helpers
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
  async function loadUserData(firebaseUser: User, skipDocumentCreation = false) {
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
          id: firebaseUser.uid,
          email: data.email || firebaseUser.email || '',
          displayName: data.displayName || firebaseUser.displayName || '',
          photoURL: data.photoURL || firebaseUser.photoURL || '',
          // Support both new globalRole and legacy role
          globalRole: data.globalRole || data.role || 'pending',
          role: data.role || data.globalRole || 'pending', // Backward compatibility
          orgAccess: data.orgAccess || {},
          siteAccess: data.siteAccess || {},
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || new Date(),
          createdBy: data.createdBy,
          authProvider: data.authProvider || 'google',
          onboardingCompleted: data.onboardingCompleted || false,
          locale: data.locale || 'es',
        };

        setUserData(parsedData);

        // Actualizar último login (no esperar)
        setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true }).catch(console.error);
      } else {
        // No tiene documento en Firestore
        // Si skipDocumentCreation es true, no crear documento (usado en registro con email)
        if (skipDocumentCreation) {
          setUserData(null);
          loadingUserData.current = false;
          return;
        }

        // Primer login con Google - determinar si es el primer usuario en self-hosted mode
        let globalRole: GlobalRole = 'pending';

        if (isSelfHostedMode()) {
          // En modo self-hosted, el primer usuario se convierte en superadmin
          const usersSnapshot = await getDocs(collection(db, 'users'));
          if (usersSnapshot.empty) {
            globalRole = 'superadmin';
            console.log('[Self-hosted] Primer usuario promovido a superadmin');
          }
        }

        const newUserData: UserData = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          globalRole,
          role: globalRole, // Backward compatibility
          orgAccess: {},
          siteAccess: {},
          createdAt: new Date(),
          lastLogin: new Date(),
          authProvider: 'google',
          onboardingCompleted: globalRole === 'superadmin', // Superadmin no necesita onboarding
          locale: 'es',
        };

        await setDoc(userRef, {
          id: firebaseUser.uid,
          email: newUserData.email,
          displayName: newUserData.displayName,
          photoURL: newUserData.photoURL,
          globalRole: newUserData.globalRole,
          role: newUserData.globalRole, // Backward compatibility
          orgAccess: {},
          siteAccess: {},
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'google',
          onboardingCompleted: newUserData.onboardingCompleted,
          locale: 'es',
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
  // EMAIL/PASSWORD AUTHENTICATION
  // ============================================

  /**
   * Sign up with email and password
   * Creates Firebase Auth user, sends verification email, but does NOT create Firestore document
   * The document is created later during onboarding after email verification
   */
  async function signUpWithEmail(email: string, password: string, displayName: string): Promise<UserCredential> {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }

    try {
      setError(null);

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Update profile with display name
      await updateProfile(userCredential.user, { displayName });

      // 3. Send email verification
      await sendEmailVerification(userCredential.user);

      // 4. Sign out immediately - user must verify email before continuing
      await firebaseSignOut(auth);
      setUser(null);
      setUserData(null);

      return userCredential;
    } catch (err: unknown) {
      console.error('Error en registro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    }
  }

  /**
   * Sign in with email and password
   * Validates email verification before allowing access
   */
  async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }

    try {
      setError(null);

      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Sign out and throw error
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      // 3. onAuthStateChanged will load user data automatically
      return userCredential;
    } catch (err: unknown) {
      console.error('Error en login:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    }
  }

  /**
   * Send password reset email
   * Always shows generic message (don't reveal if email exists)
   */
  async function resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }

    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      // Always succeed silently (don't reveal if email exists)
    } catch (err: unknown) {
      console.error('Error en reset de contraseña:', err);
      // Don't throw error - always show generic message to user
      // This prevents email enumeration attacks
    }
  }

  /**
   * Resend email verification
   */
  async function resendVerificationEmail(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth no está disponible');
    }

    if (!auth.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      setError(null);
      await sendEmailVerification(auth.currentUser);
    } catch (err: unknown) {
      console.error('Error al reenviar email:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al reenviar email';
      setError(errorMessage);
      throw err;
    }
  }

  // ============================================
  // COMPUTED STATE
  // ============================================
  const isAuthenticated = !!user;
  const isEmailVerified = user?.emailVerified ?? false;
  const hasCompletedOnboarding = userData?.onboardingCompleted ?? false;
  const hasOrgAccess = userData ? Object.keys(userData.orgAccess || {}).length > 0 : false;
  const globalRole = userData?.globalRole || userData?.role || 'pending';
  const isPending = globalRole === 'pending' && !hasOrgAccess;
  const locale = userData?.locale || 'es';

  // ============================================
  // HELPERS DE PERMISOS (Legacy)
  // ============================================
  // Compatibilidad: verificar tanto 'role' (legacy) como 'globalRole' (nuevo sistema)
  // 'admin' del sistema antiguo se trata como 'superadmin' (era el único nivel admin)
  const isSuperAdmin = globalRole === 'superadmin' || globalRole === 'admin';
  const isAdmin = globalRole === 'admin' || globalRole === 'superadmin';
  const isAuthorized = ['superadmin', 'admin', 'viewer'].includes(globalRole) || hasOrgAccess;

  function hasAccessToSite(siteId: string): boolean {
    if (isSuperAdmin) return true;
    // Check direct site access
    if (userData?.siteAccess?.[siteId]) return true;
    // Check if user has org_owner or org_admin role in any org (can access all sites in that org)
    // This will be fully implemented when we add organization-site relationships
    return false;
  }

  function getSiteRole(siteId: string): SiteRole | null {
    if (isSuperAdmin) return 'site_admin'; // Updated to new role name
    return userData?.siteAccess?.[siteId]?.role || null;
  }

  function canManageSite(siteId: string): boolean {
    if (isSuperAdmin) return true;
    const siteRole = getSiteRole(siteId);
    return siteRole === 'site_admin';
  }

  return (
    <AuthContext.Provider value={{
      // User state
      user,
      userData,
      loading,
      error,

      // Computed state
      isAuthenticated,
      isEmailVerified,
      hasCompletedOnboarding,
      hasOrgAccess,
      isPending,
      locale,

      // Authentication methods
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      resendVerificationEmail,
      signOut,

      // Legacy permission helpers
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
