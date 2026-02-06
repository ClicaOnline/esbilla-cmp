import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import { Globe, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { isSaasMode } from '../utils/featureFlags';

export function LoginPage() {
  const { user, userData, loading, error, signInWithGoogle, signInWithEmail, isEmailVerified, hasCompletedOnboarding, hasOrgAccess } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Success messages from query params
  const verified = searchParams.get('verified') === 'true';
  const reset = searchParams.get('reset') === 'true';

  // Handle email/password login
  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(email, password);
      // onAuthStateChanged will handle navigation
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'EMAIL_NOT_VERIFIED') {
          setLoginError(t.auth.errors.emailNotVerified);
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } else if (err.message.includes('wrong-password') || err.message.includes('user-not-found')) {
          setLoginError(t.auth.errors.invalidCredentials);
        } else if (err.message.includes('too-many-requests')) {
          setLoginError(t.auth.errors.tooManyAttempts);
        } else {
          setLoginError(t.auth.errors.unknownError);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

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

  // Post-login routing based on user state
  if (user && userData) {
    // 1. Check email verification (for email/password users)
    if (!isEmailVerified && userData.authProvider === 'email') {
      return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email || '')}`} replace />;
    }

    // 2. Check if onboarding is completed
    if (!hasCompletedOnboarding) {
      // In SaaS mode, redirect to onboarding
      if (isSaasMode()) {
        return <Navigate to="/onboarding/setup" replace />;
      }
      // In self-hosted mode, first user becomes superadmin automatically
      // Other users should not be here without invitation
    }

    // 3. Check if has org access or is superadmin
    if (hasOrgAccess || userData.globalRole === 'superadmin' || userData.role === 'superadmin') {
      return <Navigate to="/" replace />;
    }

    // 4. User is pending approval
    return <Navigate to="/pending" replace />;
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

        {/* Success messages */}
        {verified && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{t.auth.verifyEmail.verified}</span>
          </div>
        )}

        {reset && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{t.auth.resetPassword.success}</span>
          </div>
        )}

        {/* Error */}
        {(error || loginError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{loginError || error}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
              {t.login.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="tu@email.com"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                {t.login.password}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                {t.login.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? t.common.loading : t.login.signIn}
          </button>
        </form>

        {/* Separator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-stone-500">{t.login.orContinueWith}</span>
          </div>
        </div>

        {/* Google Login button */}
        <button
          onClick={signInWithGoogle}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-stone-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Sign up link (only in SaaS mode) */}
        {isSaasMode() && (
          <p className="mt-6 text-center text-sm text-stone-600">
            {t.login.noAccount}{' '}
            <a
              href={`https://esbilla.com/${language}/saas`}
              className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              {t.login.startHere}
            </a>
          </p>
        )}

        <p className="mt-4 text-center text-xs text-stone-400">
          {t.login.onlyAuthorized}
        </p>
      </div>
    </div>
  );
}
