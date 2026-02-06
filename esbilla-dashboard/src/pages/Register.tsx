import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import { Globe, User, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { isSaasMode } from '../utils/featureFlags';
import { getPlan, type PlanId } from '../config/plans';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUpWithEmail, signInWithGoogle, user } = useAuth();
  const { language, setLanguage, t } = useI18n();

  // Get plan from query param
  const planParam = searchParams.get('plan') as PlanId | null;
  const [selectedPlan] = useState<PlanId | null>(planParam);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not in SaaS mode
  useEffect(() => {
    if (!isSaasMode()) {
      navigate('/login');
    }
  }, [navigate]);

  // Redirect if no plan selected
  useEffect(() => {
    if (!selectedPlan) {
      // Redirect to pricing page on main site
      window.location.href = `https://esbilla.com/${language}/saas`;
    }
  }, [selectedPlan, language]);

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Password strength calculator
  function getPasswordStrength(pwd: string): 'weak' | 'medium' | 'strong' {
    if (pwd.length < 8) return 'weak';

    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    const score = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (score >= 3 && pwd.length >= 12) return 'strong';
    if (score >= 2 && pwd.length >= 8) return 'medium';
    return 'weak';
  }

  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Validate form
  function validateForm(): string | null {
    if (fullName.trim().length < 2) {
      return t.auth.errors.nameTooShort;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return t.auth.errors.invalidEmail;
    }

    if (password.length < 8) {
      return t.auth.errors.passwordTooShort;
    }

    if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      return t.auth.errors.passwordRequirements;
    }

    if (password !== confirmPassword) {
      return t.auth.errors.passwordsMismatch;
    }

    if (!acceptTerms) {
      return t.auth.errors.termsRequired;
    }

    return null;
  }

  // Handle email/password registration
  async function handleEmailRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create user in Firebase Auth
      await signUpWithEmail(email, password, fullName);

      // Save plan to sessionStorage for later use in onboarding
      if (selectedPlan) {
        sessionStorage.setItem('esbilla_onboarding_plan', selectedPlan);
      }

      // Redirect to verify email page
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          setError(t.auth.errors.emailAlreadyExists);
        } else if (err.message.includes('weak-password')) {
          setError(t.auth.errors.passwordTooShort);
        } else if (err.message.includes('network')) {
          setError(t.auth.errors.networkError);
        } else {
          setError(t.auth.errors.unknownError);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Google registration
  async function handleGoogleRegister() {
    setError(null);
    setIsSubmitting(true);

    try {
      // Save plan to sessionStorage for later use in onboarding
      if (selectedPlan) {
        sessionStorage.setItem('esbilla_onboarding_plan', selectedPlan);
      }

      // Sign in with Google (email is already verified by Google)
      await signInWithGoogle();

      // Redirect will be handled by AuthContext (to onboarding if new user)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('popup-closed')) {
          setError('Ventana cerrada. Inténtalo de nuevo.');
        } else if (err.message.includes('network')) {
          setError(t.auth.errors.networkError);
        } else {
          setError(t.auth.errors.unknownError);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!selectedPlan) {
    return null; // Will redirect
  }

  const plan = getPlan(selectedPlan);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
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

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌽</div>
          <h1 className="text-2xl font-bold text-stone-800">{t.auth.register.title}</h1>
          <p className="text-stone-500 mt-1">Esbilla CMP</p>
        </div>

        {/* Selected plan */}
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-600 mb-1">{t.auth.register.planSelected}</p>
              <p className="font-bold text-amber-700">{plan.name[language]}</p>
            </div>
            <a
              href={`https://esbilla.com/${language}/saas`}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              {t.auth.register.changePlan}
            </a>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleEmailRegister} className="space-y-4 mb-6">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-stone-700 mb-2">
              {t.auth.register.fullName}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="Juan Pérez"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
              {t.auth.register.email}
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
              {t.auth.register.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full pl-10 pr-12 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password strength indicator */}
            {password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === 'strong'
                          ? 'w-full bg-green-500'
                          : passwordStrength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-stone-600">
                    {t.auth.register.passwordStrength}:{' '}
                    {passwordStrength === 'strong'
                      ? t.auth.register.strong
                      : passwordStrength === 'medium'
                      ? t.auth.register.medium
                      : t.auth.register.weak}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-2">
              {t.auth.register.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              required
              className="mt-1 w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500"
              disabled={isSubmitting}
            />
            <label htmlFor="terms" className="text-sm text-stone-600">
              {t.auth.register.acceptTerms}{' '}
              <a href={`https://esbilla.com/${language}/terminos`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                {t.auth.register.termsLink}
              </a>
              {' y '}
              <a href={`https://esbilla.com/${language}/privacidad`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">
                {t.auth.register.privacyLink}
              </a>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? t.common.loading : t.auth.register.createAccount}
          </button>
        </form>

        {/* Separator */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-stone-500">{t.auth.register.orSignUpWith}</span>
          </div>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleRegister}
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

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-stone-600">
          {t.auth.register.haveAccount}{' '}
          <Link to="/login" className="text-amber-600 hover:text-amber-700 font-medium transition-colors">
            {t.auth.register.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
