import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../i18n';
import { Globe, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { language, setLanguage, t } = useI18n();

  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await resetPassword(email);

      // Always show success message (don't reveal if email exists)
      setEmailSent(true);
    } finally {
      setIsSubmitting(false);
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
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌽</div>
          <h1 className="text-2xl font-bold text-stone-800">{t.auth.forgotPassword.title}</h1>
          <p className="text-stone-500 mt-2 text-sm">Esbilla CMP</p>
        </div>

        {emailSent ? (
          /* Success state */
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-bold text-stone-800 mb-2">{t.auth.forgotPassword.checkEmail}</h2>
              <p className="text-stone-600 text-sm">
                {t.auth.forgotPassword.genericMessage}
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-sm text-stone-700">
              <p className="font-medium mb-1">{t.auth.forgotPassword.emailSent}</p>
              <p className="text-xs">Si no recibes el email en unos minutos, revisa tu carpeta de spam.</p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              <ArrowLeft size={18} />
              {t.auth.forgotPassword.backToLogin}
            </Link>
          </div>
        ) : (
          /* Form state */
          <>
            <div className="mb-6">
              <p className="text-stone-600 text-sm text-center">
                {t.auth.forgotPassword.enterEmail}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? t.common.loading : t.auth.forgotPassword.sendLink}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
              >
                <ArrowLeft size={16} />
                {t.auth.forgotPassword.backToLogin}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
