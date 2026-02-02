import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import { Globe } from 'lucide-react';

export function LoginPage() {
  const { user, userData, loading, error, signInWithGoogle, signOut } = useAuth();
  const { language, setLanguage, t } = useI18n();

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-stone-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Usuario autenticado con rol válido (no pending) - ir al dashboard
  // Importante: solo redirigir si userData existe Y el rol NO es pending
  if (user && userData && userData.role !== 'pending') {
    return <Navigate to="/" replace />;
  }

  // Usuario autenticado pero pendiente o sin userData
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {t.login.pendingApproval}
          </h1>
          <p className="text-stone-600 mb-6">
            {t.login.pendingMessage}
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
            {t.login.checkAgain}
          </button>
          <button
            onClick={signOut}
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            {t.login.useOtherAccount}
          </button>
        </div>
      </div>
    );
  }

  // No autenticado - mostrar formulario de login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Language selector */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur rounded-lg shadow-sm">
          <Globe size={16} className="text-stone-500" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className="bg-transparent text-sm text-stone-600 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌽</div>
          <h1 className="text-3xl font-bold text-stone-800">Esbilla CMP</h1>
          <p className="text-stone-500 mt-2">{t.login.title}</p>
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
          <span className="font-medium text-stone-700">{t.login.continueWithGoogle}</span>
        </button>

        <p className="mt-6 text-center text-xs text-stone-400">
          {t.login.onlyAuthorized}
        </p>
      </div>
    </div>
  );
}
