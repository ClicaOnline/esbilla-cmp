import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { CheckCircle, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

type ActionMode = 'resetPassword' | 'verifyEmail' | 'recoverEmail' | null;

export function AuthActionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();

  // Get params from URL
  const mode = searchParams.get('mode') as ActionMode;
  const oobCode = searchParams.get('oobCode');

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Handle email verification
  useEffect(() => {
    if (!auth || !oobCode) {
      setError('Enlace inválido');
      setLoading(false);
      return;
    }

    if (mode === 'verifyEmail') {
      handleVerifyEmail();
    } else if (mode === 'resetPassword') {
      // For password reset, just verify the code is valid
      verifyResetCode();
    } else {
      setError('Acción no soportada');
      setLoading(false);
    }
  }, [mode, oobCode]);

  async function handleVerifyEmail() {
    if (!auth || !oobCode) return;

    try {
      // Apply the action code to verify the email
      await applyActionCode(auth, oobCode);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login?verified=true');
      }, 2000);
    } catch (err: unknown) {
      console.error('Error verifying email:', err);
      if (err instanceof Error) {
        if (err.message.includes('expired')) {
          setError(t.auth.resetPassword.expiredLink);
        } else if (err.message.includes('invalid')) {
          setError(t.auth.resetPassword.invalidLink);
        } else {
          setError(t.auth.errors.unknownError);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyResetCode() {
    if (!auth || !oobCode) return;

    try {
      // Verify the password reset code is valid
      await verifyPasswordResetCode(auth, oobCode);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Error verifying reset code:', err);
      if (err instanceof Error) {
        if (err.message.includes('expired')) {
          setError(t.auth.resetPassword.expiredLink);
        } else if (err.message.includes('invalid')) {
          setError(t.auth.resetPassword.invalidLink);
        } else {
          setError(t.auth.errors.unknownError);
        }
      }
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!auth || !oobCode) return;

    // Validate
    if (newPassword.length < 8) {
      setError(t.auth.errors.passwordTooShort);
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError(t.auth.errors.passwordRequirements);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t.auth.errors.passwordsMismatch);
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login?reset=true');
      }, 2000);
    } catch (err: unknown) {
      console.error('Error resetting password:', err);
      if (err instanceof Error) {
        if (err.message.includes('expired')) {
          setError(t.auth.resetPassword.expiredLink);
        } else if (err.message.includes('invalid')) {
          setError(t.auth.resetPassword.invalidLink);
        } else if (err.message.includes('weak-password')) {
          setError(t.auth.errors.passwordTooShort);
        } else {
          setError(t.auth.errors.unknownError);
        }
      }
    } finally {
      setIsResetting(false);
    }
  }

  // Loading state
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

  // Email verification - success
  if (mode === 'verifyEmail' && success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">{t.auth.verifyEmail.verified}</h1>
          <p className="text-stone-600 mb-6">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Password reset - success
  if (mode === 'resetPassword' && success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">{t.auth.resetPassword.success}</h1>
          <p className="text-stone-600 mb-6">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Error</h1>
          <p className="text-stone-600 mb-6">{error}</p>
          <Link
            to="/login"
            className="inline-block py-3 px-6 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
          >
            {t.auth.resetPassword.backToLogin}
          </Link>
        </div>
      </div>
    );
  }

  // Reset password form
  if (mode === 'resetPassword') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🌽</div>
            <h1 className="text-2xl font-bold text-stone-800">{t.auth.resetPassword.title}</h1>
            <p className="text-stone-500 mt-2 text-sm">Esbilla CMP</p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700 mb-2">
                {t.auth.resetPassword.newPassword}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-12 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  disabled={isResetting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Mínimo 8 caracteres, 1 mayúscula y 1 número
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-2">
                {t.auth.resetPassword.confirmPassword}
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
                  disabled={isResetting}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isResetting ? t.common.loading : t.auth.resetPassword.resetButton}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
            >
              {t.auth.resetPassword.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Unknown mode
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Acción no válida</h1>
        <Link
          to="/login"
          className="inline-block mt-4 py-3 px-6 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
        >
          Ir al login
        </Link>
      </div>
    </div>
  );
}
