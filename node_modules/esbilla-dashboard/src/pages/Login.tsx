import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function LoginPage() {
  const { user, userData, loading, error, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si está autenticado y autorizado, redirigir al dashboard
  if (user && userData?.role !== 'pending') {
    return <Navigate to="/" replace />;
  }

  // Si está autenticado pero pendiente de aprobación
  if (user && userData?.role === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            Pendiente de Aprobación
          </h1>
          <p className="text-stone-600 mb-6">
            Tu cuenta está pendiente de aprobación por un administrador.
            Recibirás acceso una vez que sea aprobada.
          </p>
          <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 rounded-lg mb-6">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full" />
            )}
            <div className="text-left">
              <p className="font-medium text-stone-800">{user.displayName}</p>
              <p className="text-sm text-stone-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors mb-3"
          >
            Comprobar de nuevo
          </button>
          <button
            onClick={() => {
              const auth = useAuth();
              auth.signOut();
            }}
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            Usar otra cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌽</div>
          <h1 className="text-3xl font-bold text-stone-800">Esbilla CMP</h1>
          <p className="text-stone-500 mt-2">Panel de Control</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-stone-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-medium text-stone-700">Continuar con Google</span>
        </button>

        <p className="mt-6 text-center text-xs text-stone-400">
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  );
}
