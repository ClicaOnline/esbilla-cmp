import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface InvitationData {
  email: string;
  organizationName: string;
  role: string;
  invitedByName: string;
  expiresAt: string;
}

export function AcceptInvitePage() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { t, language } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load invitation data
  useEffect(() => {
    if (!inviteId) {
      setError('Enlace de invitación inválido');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [inviteId]);

  // If already logged in, accept invitation automatically
  useEffect(() => {
    if (user && invitation && !error) {
      acceptInvitation();
    }
  }, [user, invitation]);

  async function loadInvitation() {
    try {
      const response = await fetch(`/api/invitations/${inviteId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar la invitación');
      }

      const data = await response.json();
      setInvitation(data);
      setEmail(data.email);
      setLoading(false);
    } catch (err: unknown) {
      console.error('[AcceptInvite] Error loading invitation:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error desconocido');
      }
      setLoading(false);
    }
  }

  async function acceptInvitation() {
    if (!user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/invitations/${inviteId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aceptar la invitación');
      }

      // Success! Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err: unknown) {
      console.error('[AcceptInvite] Error accepting invitation:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }

  async function handleLoginWithGoogle() {
    setSubmitting(true);
    setError(null);

    try {
      await signInWithGoogle();
      // The useEffect will handle accepting the invitation
    } catch (err: unknown) {
      console.error('[AcceptInvite] Error with Google login:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
      setSubmitting(false);
    }
  }

  async function handleLoginWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signInWithEmail(email, password);
      // The useEffect will handle accepting the invitation
    } catch (err: unknown) {
      console.error('[AcceptInvite] Error with email login:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
      setSubmitting(false);
    }
  }

  async function handleRegisterWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate
    if (password.length < 8) {
      setError(t.auth.errors.passwordTooShort);
      setSubmitting(false);
      return;
    }

    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError(t.auth.errors.passwordRequirements);
      setSubmitting(false);
      return;
    }

    try {
      await signUpWithEmail(email, displayName, password);
      // User will be redirected to verify email
      // After verification, they can come back to this URL
    } catch (err: unknown) {
      console.error('[AcceptInvite] Error with registration:', err);
      if (err instanceof Error) {
        setError(err.message);
      }
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-amber-600 mb-4" />
          <p className="text-stone-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {error.includes('expired') ? 'Invitación expirada' : 'Invitación no válida'}
          </h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="py-3 px-6 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            {t.auth.resetPassword.backToLogin}
          </button>
        </div>
      </div>
    );
  }

  // Success state (logged in and accepting)
  if (user && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">¡Invitación aceptada!</h1>
          <p className="text-stone-600 mb-6">
            Redirigiendo al dashboard...
          </p>
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-600" />
        </div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌽</div>
          <h1 className="text-2xl font-bold text-stone-800">Invitación a Esbilla CMP</h1>
        </div>

        {/* Invitation info */}
        {invitation && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 mb-1">
                  <strong>{invitation.invitedByName}</strong> te invita a unirte a:
                </p>
                <p className="text-sm text-stone-700 font-semibold">
                  {invitation.organizationName}
                </p>
                <p className="text-xs text-stone-600 mt-1">
                  Rol: <strong>{invitation.role}</strong>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Email: {invitation.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleLoginWithGoogle}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-stone-300 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium mb-4"
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
          {mode === 'login' ? 'Aceptar con Google' : 'Crear cuenta con Google'}
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-stone-500">o con email</span>
          </div>
        </div>

        {/* Login/Register form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginWithEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                {t.login.email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                {t.login.password}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? t.common.loading : 'Aceptar e iniciar sesión'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterWithEmail} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-stone-700 mb-2">
                {t.auth.register.fullName}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-stone-700 mb-2">
                {t.auth.register.email}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg bg-stone-50 text-stone-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-stone-700 mb-2">
                {t.auth.register.password}
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={submitting}
                className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-stone-500">
                Mínimo 8 caracteres, 1 mayúscula y 1 número
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? t.common.loading : 'Crear cuenta y aceptar'}
            </button>
          </form>
        )}

        {/* Toggle mode */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            {mode === 'login' ? '¿No tienes cuenta? Crear cuenta' : '¿Ya tienes cuenta? Iniciar sesión'}
          </button>
        </div>

        {/* Language selector */}
        <div className="mt-6 text-center">
          <select
            value={language}
            onChange={(e) => {
              // Language change handled by I18nContext
              const event = new CustomEvent('languageChange', { detail: e.target.value });
              window.dispatchEvent(event);
            }}
            className="text-sm px-3 py-1 border border-stone-300 rounded-lg text-stone-600 hover:border-stone-400 transition-colors"
          >
            <option value="ast">Asturianu</option>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
