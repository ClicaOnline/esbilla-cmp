import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import { Globe, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resendVerificationEmail } = useAuth();
  const { language, setLanguage, t } = useI18n();

  // Get email from query param
  const emailParam = searchParams.get('email') || '';
  const [email] = useState(emailParam);

  // UI state
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Poll for email verification every 5 seconds
  useEffect(() => {
    if (!auth) return;

    const checkInterval = setInterval(async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        // Reload user to get latest emailVerified status
        await currentUser.reload();

        if (currentUser.emailVerified) {
          setIsVerifying(true);
          clearInterval(checkInterval);

          // Wait a bit to show the success message
          setTimeout(() => {
            navigate('/login?verified=true');
          }, 1500);
        }
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [navigate]);

  // Listen to auth state changes (for when user comes back from email link)
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsVerifying(true);
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 1500);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleResend() {
    if (resendCooldown > 0) return;

    setError(null);
    setSuccess(null);
    setIsResending(true);

    try {
      await resendVerificationEmail();
      setSuccess('Email de verificación reenviado');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('too-many-requests')) {
          setError(t.auth.errors.tooManyAttempts);
        } else {
          setError('Error al reenviar email. Inténtalo más tarde.');
        }
      }
    } finally {
      setIsResending(false);
    }
  }

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
        {/* Icon */}
        <div className="text-center mb-6">
          {isVerifying ? (
            <div className="text-6xl mb-4">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
            </div>
          ) : (
            <div className="text-6xl mb-4">
              <Mail className="w-16 h-16 mx-auto text-amber-500" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-stone-800 mb-2">
            {isVerifying ? t.auth.verifyEmail.verified : t.auth.verifyEmail.title}
          </h1>

          {!isVerifying && (
            <p className="text-stone-600 text-sm">
              {t.auth.verifyEmail.sentTo}{' '}
              <span className="font-medium text-stone-800">{email}</span>
            </p>
          )}
        </div>

        {/* Success message */}
        {success && !isVerifying && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!isVerifying && (
          <>
            {/* Instructions */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-stone-700 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">1.</span>
                {t.auth.verifyEmail.checkInbox}
              </p>
              <p className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">2.</span>
                {t.auth.verifyEmail.clickLink}
              </p>
            </div>

            {/* Resend button */}
            <div className="text-center mb-6">
              <p className="text-sm text-stone-600 mb-3">{t.auth.verifyEmail.didntReceive}</p>
              <button
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <RefreshCw size={18} className={isResending ? 'animate-spin' : ''} />
                {resendCooldown > 0
                  ? t.auth.verifyEmail.resendCooldown.replace('{seconds}', resendCooldown.toString())
                  : t.auth.verifyEmail.resend}
              </button>
            </div>

            {/* Checking indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-stone-500 mb-6">
              <RefreshCw size={16} className="animate-spin" />
              <span>{t.auth.verifyEmail.verifying}</span>
            </div>
          </>
        )}

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            {t.auth.verifyEmail.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}
