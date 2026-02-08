import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { Clock, RefreshCw, AlertCircle, MessageCircle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, userData, signOut, hasOrgAccess } = useAuth();
  const { t } = useI18n();

  // Detect limbo state: has orgAccess but onboardingCompleted is false
  const isLimboState = hasOrgAccess && userData?.onboardingCompleted === false;

  // Listen for approval in real-time
  useEffect(() => {
    if (!user || !db) return;

    // Set up real-time listener on user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();
        const globalRole = data.globalRole || data.role || 'pending';
        const orgAccess = data.orgAccess || {};

        // Check if user has been approved (has orgAccess and not pending)
        if (Object.keys(orgAccess).length > 0 && globalRole !== 'pending') {
          console.log('[PendingApproval] Usuario aprobado, redirigiendo...');
          // Reload to update AuthContext
          window.location.href = '/';
        } else if (globalRole === 'superadmin') {
          // User was promoted to superadmin
          console.log('[PendingApproval] Usuario promovido a superadmin, redirigiendo...');
          window.location.href = '/';
        }
      },
      (error) => {
        console.error('[PendingApproval] Error en listener:', error);
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  // If already has access, redirect
  useEffect(() => {
    if (hasOrgAccess || userData?.globalRole === 'superadmin') {
      navigate('/');
    }
  }, [hasOrgAccess, userData, navigate]);

  function handleCheckAgain() {
    window.location.reload();
  }

  async function handleUseOther() {
    await signOut();
    navigate('/login');
  }

  function handleCreateTicket() {
    navigate('/support/new?reason=limbo');
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Icon */}
        <div className="text-center mb-6">
          {isLimboState ? (
            <>
              <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h1 className="text-2xl font-bold text-stone-800 mb-2">
                Cuenta en Estado Limbo
              </h1>
              <p className="text-stone-600 text-sm">
                Tu cuenta tiene permisos pero requiere configuración adicional
              </p>
            </>
          ) : (
            <>
              <Clock className="w-16 h-16 mx-auto text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold text-stone-800 mb-2">
                {t.auth.pending.title}
              </h1>
              <p className="text-stone-600 text-sm">
                {t.auth.pending.message}
              </p>
            </>
          )}
        </div>

        {/* User info */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-stone-800">{user.displayName}</p>
              <p className="text-sm text-stone-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Real-time status indicator */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-stone-500">
          <RefreshCw size={16} className="animate-spin" />
          <span>Comprobando estado...</span>
        </div>

        {/* Instructions */}
        {isLimboState ? (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-stone-700">
            <p className="font-medium mb-2">Tu cuenta requiere atención</p>
            <ul className="space-y-1 text-xs">
              <li>• Tu cuenta tiene permisos pero no se completó el onboarding</li>
              <li>• Esto puede deberse a un error o configuración incompleta</li>
              <li>• Por favor, abre un ticket de soporte para resolver esta situación</li>
            </ul>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-stone-700">
            <p className="font-medium mb-2">¿Qué hacer mientras esperas?</p>
            <ul className="space-y-1 text-xs">
              <li>• Contacta con el administrador de tu organización</li>
              <li>• Recibirás acceso cuando tu cuenta sea aprobada</li>
              <li>• Esta página se actualizará automáticamente</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isLimboState ? (
            <>
              <button
                onClick={handleCreateTicket}
                className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} />
                Abrir Ticket de Soporte
              </button>
              <button
                onClick={handleCheckAgain}
                className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm"
              >
                Comprobar de nuevo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCheckAgain}
                className="w-full py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
              >
                {t.auth.pending.checkAgain}
              </button>
            </>
          )}
          <button
            onClick={handleUseOther}
            className="w-full text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            {t.auth.pending.useOther}
          </button>
        </div>
      </div>
    </div>
  );
}
