import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { Check, Copy, ExternalLink, Building, Globe as GlobeIcon, FileText } from 'lucide-react';
import { doc, setDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isSaasMode } from '../utils/featureFlags';
import { getPlan, type PlanId } from '../config/plans';

type Step = 1 | 2 | 3;

export function OnboardingSetupPage() {
  const navigate = useNavigate();
  const { user, userData, isEmailVerified, hasCompletedOnboarding } = useAuth();
  const { language, t } = useI18n();

  // Current step
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Get plan from sessionStorage
  const [selectedPlan] = useState<PlanId>(() => {
    const plan = sessionStorage.getItem('esbilla_onboarding_plan') as PlanId | null;
    return plan || 'free';
  });

  // Step 1: Organization
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');

  // Step 2: Site
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');

  // Step 3: Installation
  const [siteId, setSiteId] = useState('');
  const [copied, setCopied] = useState(false);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or email not verified
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!isEmailVerified && userData?.authProvider === 'email') {
      navigate(`/verify-email?email=${encodeURIComponent(user.email || '')}`);
    } else if (hasCompletedOnboarding) {
      navigate('/');
    }
  }, [user, isEmailVerified, hasCompletedOnboarding, userData, navigate]);

  // Redirect if not in SaaS mode
  useEffect(() => {
    if (!isSaasMode()) {
      navigate('/');
    }
  }, [navigate]);

  const plan = getPlan(selectedPlan);

  // Step 1: Create organization and user document
  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (orgName.trim().length < 2) {
      setError(t.auth.errors.nameTooShort);
      return;
    }

    if (website && !website.match(/^https?:\/\/.+/)) {
      setError('El sitio web debe empezar con http:// o https://');
      return;
    }

    setIsCreating(true);

    try {
      if (!user || !db) throw new Error('No auth');

      // Generate organization ID
      const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create organization and user documents in a batch
      const batch = writeBatch(db);

      // Organization document
      const orgRef = doc(db, 'organizations', orgId);
      batch.set(orgRef, {
        id: orgId,
        name: orgName,
        website: website || null,
        taxId: taxId || null,
        plan: selectedPlan,
        maxSites: plan.maxSites,
        maxConsentsPerMonth: plan.maxConsentsPerMonth,
        billingEmail: user.email,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      // User document
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || orgName,
        photoURL: user.photoURL || '',
        globalRole: 'pending', // Will have org access but global role stays pending
        role: 'pending', // Backward compatibility
        orgAccess: {
          [orgId]: {
            organizationId: orgId,
            organizationName: orgName,
            role: 'org_owner',
            addedAt: serverTimestamp(),
            addedBy: user.uid,
          },
        },
        siteAccess: {},
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        authProvider: userData?.authProvider || 'google',
        onboardingCompleted: false, // Will be set to true after step 2
        locale: language,
      });

      await batch.commit();

      // Move to step 2
      setCurrentStep(2);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(t.auth.onboarding.error);
    } finally {
      setIsCreating(false);
    }
  }

  // Step 2: Create first site
  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate
    if (siteName.trim().length < 2) {
      setError(t.auth.errors.nameTooShort);
      return;
    }

    // Validate domain (basic validation)
    const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
    if (!domainRegex.test(domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, ''))) {
      setError(t.auth.errors.invalidDomain);
      return;
    }

    setIsCreating(true);

    try {
      if (!user || !db) throw new Error('No auth');

      // Get organization ID from user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) throw new Error('User document not found');

      const userData = userDoc.data();
      const orgAccess = userData.orgAccess || {};
      const orgId = Object.keys(orgAccess)[0];

      if (!orgId) throw new Error('Organization not found');

      // Generate site ID
      const generatedSiteId = `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSiteId(generatedSiteId);

      // Clean domain
      const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

      // Create site document
      await setDoc(doc(db, 'sites', generatedSiteId), {
        id: generatedSiteId,
        name: siteName,
        domains: [cleanDomain],
        organizationId: orgId,
        apiKey: `esb_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        settings: {},
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      // Update user document to mark onboarding as completed
      await setDoc(
        doc(db, 'users', user.uid),
        {
          onboardingCompleted: true,
        },
        { merge: true }
      );

      // Clear plan from sessionStorage
      sessionStorage.removeItem('esbilla_onboarding_plan');

      // Move to step 3
      setCurrentStep(3);
    } catch (err) {
      console.error('Error creating site:', err);
      setError(t.auth.onboarding.error);
    } finally {
      setIsCreating(false);
    }
  }

  function handleCopyCode() {
    const code = getInstallationCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getInstallationCode(): string {
    return `<script
  src="https://api.esbilla.com/pegoyu.js"
  data-id="${siteId}"
  data-api="https://api.esbilla.com"
></script>`;
  }

  function handleGoToDashboard() {
    // Force reload to update AuthContext
    window.location.href = '/';
  }

  if (!user || !isSaasMode()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌽</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">
            {t.auth.onboarding.welcome}
          </h1>
          <p className="text-stone-600">
            {t.auth.onboarding.stepOf.replace('{current}', currentStep.toString()).replace('{total}', '3')}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                    ? 'bg-amber-500 text-white'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                {step < currentStep ? <Check size={20} /> : step}
              </div>
            ))}
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          {/* Selected plan badge */}
          {currentStep === 1 && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <p className="text-xs text-stone-600 mb-1">{t.auth.onboarding.planSelected}</p>
              <p className="font-bold text-amber-700">
                {t.auth.onboarding.planSelected}: {plan.name[language]}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Organization */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="text-center mb-6">
                <Building className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <h2 className="text-xl font-bold text-stone-800 mb-2">
                  {t.auth.onboarding.step1.title}
                </h2>
                <p className="text-sm text-stone-600">
                  {t.auth.onboarding.step1.subtitle}
                </p>
              </div>

              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-stone-700 mb-2">
                  {t.auth.onboarding.step1.orgName} *
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder={t.auth.onboarding.step1.orgNamePlaceholder}
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-stone-700 mb-2">
                  {t.auth.onboarding.step1.website}
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder={t.auth.onboarding.step1.websitePlaceholder}
                  disabled={isCreating}
                />
              </div>

              <div>
                <label htmlFor="taxId" className="block text-sm font-medium text-stone-700 mb-2">
                  {t.auth.onboarding.step1.taxId}{' '}
                  <span className="text-stone-500">{t.auth.onboarding.step1.taxIdOptional}</span>
                </label>
                <input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder={t.auth.onboarding.step1.taxIdPlaceholder}
                  disabled={isCreating}
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isCreating ? t.auth.onboarding.creating : t.auth.onboarding.step1.next}
              </button>
            </form>
          )}

          {/* Step 2: First Site */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-6">
              <div className="text-center mb-6">
                <GlobeIcon className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                <h2 className="text-xl font-bold text-stone-800 mb-2">
                  {t.auth.onboarding.step2.title}
                </h2>
                <p className="text-sm text-stone-600">
                  {t.auth.onboarding.step2.subtitle}
                </p>
              </div>

              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-stone-700 mb-2">
                  {t.auth.onboarding.step2.siteName} *
                </label>
                <input
                  id="siteName"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder={t.auth.onboarding.step2.siteNamePlaceholder}
                  disabled={isCreating}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-stone-700 mb-2">
                  {t.auth.onboarding.step2.domain} *
                </label>
                <input
                  id="domain"
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-amber-400 focus:outline-none transition-colors"
                  placeholder={t.auth.onboarding.step2.domainPlaceholder}
                  disabled={isCreating}
                />
                <p className="mt-1 text-xs text-stone-500">
                  Ejemplo: www.ejemplo.com o ejemplo.com
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isCreating}
                  className="flex-1 py-3 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {t.auth.onboarding.step2.back}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isCreating ? t.auth.onboarding.creating : t.auth.onboarding.step2.next}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Installation Code */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                  {t.auth.onboarding.step3.title}
                </h2>
                <p className="text-sm text-stone-600">
                  {t.auth.onboarding.step3.subtitle}
                </p>
              </div>

              {/* Installation code */}
              <div>
                <div className="relative">
                  <pre className="bg-stone-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                    {getInstallationCode()}
                  </pre>
                  <button
                    onClick={handleCopyCode}
                    className="absolute top-3 right-3 p-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors"
                    title={t.auth.onboarding.step3.copyCode}
                  >
                    {copied ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <Copy size={18} className="text-stone-400" />
                    )}
                  </button>
                </div>
                {copied && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <Check size={16} />
                    {t.auth.onboarding.step3.copied}
                  </p>
                )}
              </div>

              {/* Help link */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-stone-700 mb-2">
                  <FileText className="inline w-4 h-4 mr-1" />
                  {t.auth.onboarding.step3.needHelp}
                </p>
                <a
                  href={`https://esbilla.com/${language}/como-empezar`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                >
                  {t.auth.onboarding.step3.installGuide}
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Go to dashboard */}
              <button
                onClick={handleGoToDashboard}
                className="w-full py-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium text-lg"
              >
                {t.auth.onboarding.step3.goToDashboard}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
