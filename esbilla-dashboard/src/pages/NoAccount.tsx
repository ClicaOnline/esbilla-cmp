import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { XCircle, Mail, Sparkles, LogOut } from 'lucide-react';
import { isSaasMode } from '../utils/featureFlags';

export function NoAccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
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
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            No tienes una cuenta activa
          </h1>
          <p className="text-stone-600 text-sm">
            Has iniciado sesión correctamente, pero tu cuenta aún no está configurada.
          </p>
        </div>

        {/* User info */}
        <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
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

        {/* Options */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  ¿Esperas una invitación?
                </h3>
                <p className="text-sm text-blue-700">
                  Si tu organización te va a invitar, espera a recibir un email con el enlace de invitación.
                  Una vez aceptes la invitación, podrás acceder al dashboard.
                </p>
              </div>
            </div>
          </div>

          {isSaasMode() && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">
                    ¿Quieres crear una organización?
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    Si eres el responsable de tu empresa, puedes seleccionar un plan y crear tu propia organización.
                  </p>
                  <a
                    href="https://esbilla.com/es/saas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    Ver planes y empezar
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-stone-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors font-medium"
          >
            <LogOut size={18} />
            Cerrar sesión y usar otra cuenta
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-stone-500 text-center mt-6">
          Si crees que esto es un error, contacta con el soporte de tu organización.
        </p>
      </div>
    </div>
  );
}
