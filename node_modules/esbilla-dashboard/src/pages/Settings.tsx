import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site } from '../types';
import {
  Palette,
  Layout as LayoutIcon,
  Type,
  MousePointer2,
  FileText,
  Save,
  RotateCcw,
  Check,
  X,
  Eye,
  Globe2,
  AlertCircle,
  Loader2
} from 'lucide-react';

type BannerLayout = 'modal' | 'bar' | 'corner';
type ButtonStyle = 'equal' | 'acceptHighlight';
type FontFamily = 'system' | 'inter' | 'roboto' | 'opensans' | 'lato' | 'montserrat';

interface BannerConfig {
  layout: BannerLayout;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  font: FontFamily;
  buttonStyle: ButtonStyle;
  labels: {
    acceptAll: string;
    rejectAll: string;
    customize: string;
    acceptEssential: string;
  };
  legal: {
    title: string;
    content: string;
  };
  customCSS?: string;
}

const defaultConfig: BannerConfig = {
  layout: 'modal',
  colors: {
    primary: '#FFBF00',
    secondary: '#6B7280',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  font: 'system',
  buttonStyle: 'equal',
  labels: {
    acceptAll: 'Aceptar todas',
    rejectAll: 'Rechazar todas',
    customize: 'Personalizar',
    acceptEssential: 'Solo esenciales',
  },
  legal: {
    title: 'Aviso Legal',
    content: '',
  },
  customCSS: '',
};

export function SettingsPage() {
  const { t } = useI18n();
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<BannerConfig>(defaultConfig);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLegalPreview, setShowLegalPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Site selection state
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [loadingSites, setLoadingSites] = useState(true);

  // Analytics settings
  const [enableG100, setEnableG100] = useState(false);

  // Load sites on mount
  useEffect(() => {
    loadSites();
  }, []);

  // Load site settings when selection changes
  useEffect(() => {
    if (selectedSiteId) {
      loadSiteSettings(selectedSiteId);
    }
  }, [selectedSiteId]);

  async function loadSites() {
    if (!db || !isAdmin) {
      setLoadingSites(false);
      return;
    }

    try {
      const q = query(collection(db, 'sites'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const siteList: Site[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        siteList.push({
          id: docSnapshot.id,
          name: data.name,
          domains: data.domains || [],
          settings: data.settings,
          apiKey: data.apiKey,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
        });
      });
      setSites(siteList);

      // Auto-select first site
      if (siteList.length > 0 && !selectedSiteId) {
        setSelectedSiteId(siteList[0].id);
      }
    } catch (err) {
      console.error('Error loading sites:', err);
      setError('Error al cargar sitios');
    } finally {
      setLoadingSites(false);
    }
  }

  function loadSiteSettings(siteId: string) {
    const site = sites.find(s => s.id === siteId);
    if (site?.settings?.banner) {
      // Merge with defaults to handle missing fields
      setConfig({
        ...defaultConfig,
        ...site.settings.banner,
        colors: { ...defaultConfig.colors, ...site.settings.banner.colors },
        labels: { ...defaultConfig.labels, ...site.settings.banner.labels },
        legal: { ...defaultConfig.legal, ...site.settings.banner.legal },
      });
    } else {
      setConfig(defaultConfig);
    }

    // Load analytics settings
    setEnableG100(site?.enableG100 || false);

    setSaved(false);
  }

  const updateConfig = <K extends keyof BannerConfig>(
    key: K,
    value: BannerConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateColors = (key: keyof BannerConfig['colors'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
    setSaved(false);
  };

  const updateLabels = (key: keyof BannerConfig['labels'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      labels: { ...prev.labels, [key]: value },
    }));
    setSaved(false);
  };

  const updateLegal = (key: keyof BannerConfig['legal'], value: string) => {
    setConfig((prev) => ({
      ...prev,
      legal: { ...prev.legal, [key]: value },
    }));
    setSaved(false);
  };

  const updateCustomCSS = (value: string) => {
    setConfig((prev) => ({
      ...prev,
      customCSS: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedSiteId || !db) {
      setError('Selecciona un sitio para guardar');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const siteRef = doc(db, 'sites', selectedSiteId);
      await updateDoc(siteRef, {
        'settings.banner': config,
        enableG100: enableG100,
        updatedAt: serverTimestamp()
      });

      // Update local sites list - preserve categories from existing settings
      setSites(prev => prev.map(site =>
        site.id === selectedSiteId
          ? {
              ...site,
              settings: {
                ...site.settings,
                banner: {
                  ...config,
                  categories: site.settings?.banner?.categories || []
                }
              },
              enableG100: enableG100
            }
          : site
      ));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setSaved(false);
  };

  if (loadingSites) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{t.settings.title}</h1>
            <p className="text-stone-500">{t.settings.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Site selector */}
            {sites.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe2 size={18} className="text-stone-400" />
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <RotateCcw size={18} />
              {t.settings.resetDefaults}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !selectedSiteId}
              className="flex items-center gap-2 px-4 py-2 text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
              {saving ? 'Guardando...' : saved ? t.settings.saved : t.settings.saveChanges}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* No sites warning */}
        {sites.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-amber-800 font-medium">Sin sitios configurados</p>
              <p className="text-amber-600 text-sm">Crea un sitio en la sección "Sitios" para poder configurar el banner.</p>
            </div>
          </div>
        )}

        {/* Layout Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LayoutIcon className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.layoutSection}</h2>
              <p className="text-sm text-stone-500">{t.settings.layoutDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LayoutOption
              selected={config.layout === 'modal'}
              onClick={() => updateConfig('layout', 'modal')}
              title={t.settings.layoutModal}
              description={t.settings.layoutModalDesc}
              preview={
                <div className="w-full h-20 bg-stone-100 rounded flex items-center justify-center">
                  <div className="w-16 h-10 bg-white border-2 border-stone-300 rounded shadow-lg" />
                </div>
              }
            />
            <LayoutOption
              selected={config.layout === 'bar'}
              onClick={() => updateConfig('layout', 'bar')}
              title={t.settings.layoutBar}
              description={t.settings.layoutBarDesc}
              preview={
                <div className="w-full h-20 bg-stone-100 rounded flex flex-col justify-end">
                  <div className="w-full h-6 bg-white border-t-2 border-stone-300" />
                </div>
              }
            />
            <LayoutOption
              selected={config.layout === 'corner'}
              onClick={() => updateConfig('layout', 'corner')}
              title={t.settings.layoutCorner}
              description={t.settings.layoutCornerDesc}
              preview={
                <div className="w-full h-20 bg-stone-100 rounded flex items-end justify-end p-2">
                  <div className="w-10 h-8 bg-white border-2 border-stone-300 rounded shadow-lg" />
                </div>
              }
            />
          </div>
        </section>

        {/* Colors Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Palette className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.colorsSection}</h2>
              <p className="text-sm text-stone-500">{t.settings.colorsDescription}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ColorPicker
              label={t.settings.primaryColor}
              description={t.settings.primaryColorDesc}
              value={config.colors.primary}
              onChange={(v) => updateColors('primary', v)}
            />
            <ColorPicker
              label={t.settings.secondaryColor}
              description={t.settings.secondaryColorDesc}
              value={config.colors.secondary}
              onChange={(v) => updateColors('secondary', v)}
            />
            <ColorPicker
              label={t.settings.backgroundColor}
              description={t.settings.backgroundColorDesc}
              value={config.colors.background}
              onChange={(v) => updateColors('background', v)}
            />
            <ColorPicker
              label={t.settings.textColor}
              description={t.settings.textColorDesc}
              value={config.colors.text}
              onChange={(v) => updateColors('text', v)}
            />
          </div>
        </section>

        {/* Fonts Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Type className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.fontsSection}</h2>
              <p className="text-sm text-stone-500">{t.settings.fontsDescription}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              {t.settings.fontFamily}
            </label>
            <select
              value={config.font}
              onChange={(e) => updateConfig('font', e.target.value as FontFamily)}
              className="w-full max-w-xs px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="system">{t.settings.fontFamilies.system}</option>
              <option value="inter">{t.settings.fontFamilies.inter}</option>
              <option value="roboto">{t.settings.fontFamilies.roboto}</option>
              <option value="opensans">{t.settings.fontFamilies.opensans}</option>
              <option value="lato">{t.settings.fontFamilies.lato}</option>
              <option value="montserrat">{t.settings.fontFamilies.montserrat}</option>
            </select>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <MousePointer2 className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.buttonsSection}</h2>
              <p className="text-sm text-stone-500">{t.settings.buttonsDescription}</p>
            </div>
          </div>

          {/* Button Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-3">
              {t.settings.buttonStyle}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ButtonStyleOption
                selected={config.buttonStyle === 'equal'}
                onClick={() => updateConfig('buttonStyle', 'equal')}
                title={t.settings.buttonStyles.equal}
                description={t.settings.buttonStyles.equalDesc}
                preview={
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded font-medium">
                      Aceptar
                    </div>
                    <div className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded font-medium">
                      Rechazar
                    </div>
                  </div>
                }
              />
              <ButtonStyleOption
                selected={config.buttonStyle === 'acceptHighlight'}
                onClick={() => updateConfig('buttonStyle', 'acceptHighlight')}
                title={t.settings.buttonStyles.acceptHighlight}
                description={t.settings.buttonStyles.acceptHighlightDesc}
                preview={
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded font-medium">
                      Aceptar
                    </div>
                    <div className="px-3 py-1.5 border border-stone-300 text-stone-600 text-xs rounded">
                      Rechazar
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Button Labels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.acceptAllLabel}
              </label>
              <input
                type="text"
                value={config.labels.acceptAll}
                onChange={(e) => updateLabels('acceptAll', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.rejectAllLabel}
              </label>
              <input
                type="text"
                value={config.labels.rejectAll}
                onChange={(e) => updateLabels('rejectAll', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.customizeLabel}
              </label>
              <input
                type="text"
                value={config.labels.customize}
                onChange={(e) => updateLabels('customize', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.acceptEssentialLabel}
              </label>
              <input
                type="text"
                value={config.labels.acceptEssential}
                onChange={(e) => updateLabels('acceptEssential', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </section>

        {/* Legal Notice Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="text-red-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.legalSection}</h2>
              <p className="text-sm text-stone-500">{t.settings.legalDescription}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.legalTitle}
              </label>
              <input
                type="text"
                value={config.legal.title}
                onChange={(e) => updateLegal('title', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t.settings.legalContent}
              </label>
              <textarea
                value={config.legal.content}
                onChange={(e) => updateLegal('content', e.target.value)}
                placeholder={t.settings.legalPlaceholder}
                rows={8}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              />
            </div>
            <button
              onClick={() => setShowLegalPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <Eye size={18} />
              {t.settings.previewModal}
            </button>
          </div>
        </section>

        {/* Custom CSS Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-stone-100 rounded-lg">
              <svg className="text-stone-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-800">CSS Personalizado</h2>
          </div>
          <p className="text-sm text-stone-500 mb-4">
            Añade CSS personalizado para modificar el aspecto del banner de cookies.
            Puedes usar los IDs y clases de los elementos del banner para personalizar su apariencia.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Código CSS
              </label>
              <textarea
                value={config.customCSS || ''}
                onChange={(e) => updateCustomCSS(e.target.value)}
                placeholder={`/* Ejemplo de personalización */\n#esbilla-banner {\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0,0,0,0.12);\n}\n\n#esbilla-banner-title {\n  font-size: 1.5rem;\n  color: #1e40af;\n}\n\n.esbilla-btn.btn-primary {\n  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n}`}
                rows={12}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y font-mono text-sm"
              />
            </div>
            <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="text-blue-600 flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">IDs y clases disponibles:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-banner</code> - Contenedor principal</li>
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-banner-inner</code> - Contenedor interno</li>
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-banner-icon</code> - Icono del banner</li>
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-banner-title</code> - Título</li>
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-banner-description</code> - Descripción</li>
                  <li><code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-btn-accept</code>, <code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-btn-reject</code>, <code className="bg-blue-100 px-1 py-0.5 rounded">#esbilla-btn-settings</code> - Botones</li>
                </ul>
                <p className="mt-2">
                  <a href="https://esbilla.com/docs/personalizacion-banner" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-xs">
                    Ver guía completa de personalización →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics Settings Section */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="text-green-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">Configuración de Analytics</h2>
              <p className="text-sm text-stone-500">Control de medición antes del consentimiento</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* G100 Toggle */}
            <div className="flex items-start gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <input
                type="checkbox"
                id="enableG100"
                checked={enableG100}
                onChange={(e) => {
                  setEnableG100(e.target.checked);
                  setSaved(false);
                }}
                className="mt-1 h-5 w-5 rounded border-stone-300 text-amber-500 focus:ring-2 focus:ring-amber-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="enableG100" className="font-medium text-stone-800 cursor-pointer">
                  Activar pings anónimos de Google Analytics (G100)
                </label>
                <p className="text-sm text-stone-600 mt-1">
                  Cuando está activado, se envían pings anónimos a Google Analytics 4 <strong>antes del consentimiento</strong> del usuario,
                  siguiendo la característica G100 de Google Consent Mode V2.
                </p>
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-xs text-amber-800 mb-2">
                    <strong>⚠️ Advertencia GDPR:</strong>
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Los pings anónimos establecen conexión con servidores de Google <strong>sin consentimiento previo</strong></li>
                    <li>La dirección IP del usuario se envía a Google, incluso si está anonimizada</li>
                    <li>Según CJEU (caso Breyer), las IPs son datos personales</li>
                    <li>La CNIL francesa ha multado por usar GA sin consentimiento previo</li>
                  </ul>
                  <p className="text-xs text-amber-800 mt-2">
                    <strong>Recomendación:</strong> Mantener desactivado para cumplimiento estricto de GDPR.
                    Solo activar si tu asesor legal lo aprueba.
                  </p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>💡 Alternativa cookieless:</strong> SealMetrics (activado por defecto) mide tráfico sin cookies ni consentimiento,
                    cumpliendo 100% con GDPR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Preview */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-stone-100 rounded-lg">
              <Eye className="text-stone-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-800">{t.settings.preview}</h2>
              <p className="text-sm text-stone-500">{t.settings.previewDescription}</p>
            </div>
          </div>

          <BannerPreview config={config} />
        </section>
      </div>

      {/* Legal Notice Modal Preview */}
      {showLegalPreview && (
        <LegalModal
          title={config.legal.title}
          content={config.legal.content}
          onClose={() => setShowLegalPreview(false)}
        />
      )}
    </Layout>
  );
}

// Helper Components

interface LayoutOptionProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  preview: React.ReactNode;
}

function LayoutOption({ selected, onClick, title, description, preview }: LayoutOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-amber-500 bg-amber-50'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="mb-3">{preview}</div>
      <h3 className="font-medium text-stone-800">{title}</h3>
      <p className="text-xs text-stone-500 mt-1">{description}</p>
    </button>
  );
}

interface ButtonStyleOptionProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  preview: React.ReactNode;
}

function ButtonStyleOption({ selected, onClick, title, description, preview }: ButtonStyleOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-amber-500 bg-amber-50'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="mb-3">{preview}</div>
      <h3 className="font-medium text-stone-800">{title}</h3>
      <p className="text-xs text-stone-500 mt-1">{description}</p>
    </button>
  );
}

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-lg border border-stone-200 cursor-pointer"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-stone-700">{label}</label>
        <p className="text-xs text-stone-500">{description}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 px-2 py-1 text-xs border border-stone-200 rounded w-24 font-mono"
        />
      </div>
    </div>
  );
}

interface BannerPreviewProps {
  config: BannerConfig;
}

// Componente extraído para evitar recreación en cada render
interface PreviewContentProps {
  config: BannerConfig;
  fontClass: string;
  isEqual: boolean;
}

function PreviewContent({ config, fontClass, isEqual }: PreviewContentProps) {
  return (
    <div
      className={`p-4 rounded-lg shadow-lg ${fontClass}`}
      style={{ backgroundColor: config.colors.background, color: config.colors.text }}
    >
      <h3 className="font-semibold mb-2">🍪 Usamos cookies</h3>
      <p className="text-sm mb-4 opacity-80">
        Este sitio usa cookies para mejorar tu experiencia.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 rounded font-medium text-sm"
          style={{
            backgroundColor: config.colors.primary,
            color: config.colors.background,
          }}
        >
          {config.labels.acceptAll}
        </button>
        <button
          className="px-4 py-2 rounded font-medium text-sm"
          style={
            isEqual
              ? {
                  backgroundColor: config.colors.primary,
                  color: config.colors.background,
                }
              : {
                  backgroundColor: 'transparent',
                  border: `1px solid ${config.colors.secondary}`,
                  color: config.colors.text,
                }
          }
        >
          {config.labels.rejectAll}
        </button>
        <button
          className="px-4 py-2 text-sm underline"
          style={{ color: config.colors.text }}
        >
          {config.labels.customize}
        </button>
        <button
          className="px-4 py-2 text-sm underline"
          style={{ color: config.colors.text }}
        >
          {config.labels.acceptEssential}
        </button>
      </div>
    </div>
  );
}

function BannerPreview({ config }: BannerPreviewProps) {
  const fontClass = {
    system: 'font-sans',
    inter: 'font-[Inter]',
    roboto: 'font-[Roboto]',
    opensans: 'font-[Open_Sans]',
    lato: 'font-[Lato]',
    montserrat: 'font-[Montserrat]',
  }[config.font];

  const isEqual = config.buttonStyle === 'equal';

  if (config.layout === 'modal') {
    return (
      <div className="relative h-64 bg-stone-800/20 rounded-lg flex items-center justify-center">
        <div className="max-w-sm">
          <PreviewContent config={config} fontClass={fontClass} isEqual={isEqual} />
        </div>
      </div>
    );
  }

  if (config.layout === 'bar') {
    return (
      <div className="relative h-64 bg-stone-100 rounded-lg flex flex-col justify-end">
        <PreviewContent config={config} fontClass={fontClass} isEqual={isEqual} />
      </div>
    );
  }

  return (
    <div className="relative h-64 bg-stone-100 rounded-lg flex items-end justify-end p-4">
      <div className="max-w-xs">
        <PreviewContent config={config} fontClass={fontClass} isEqual={isEqual} />
      </div>
    </div>
  );
}

interface LegalModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

function LegalModal({ title, content, onClose }: LegalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h2 className="text-xl font-semibold text-stone-800">{title || 'Aviso Legal'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {content ? (
            <div className="prose prose-stone max-w-none whitespace-pre-wrap">
              {content}
            </div>
          ) : (
            <p className="text-stone-400 italic">No hay contenido configurado</p>
          )}
        </div>
        <div className="flex justify-end p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
