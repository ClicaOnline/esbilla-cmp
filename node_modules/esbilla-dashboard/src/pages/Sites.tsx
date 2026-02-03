import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site } from '../types';
import { DEFAULT_BANNER_SETTINGS, generateApiKey, generateSiteId } from '../types';
import {
  Plus,
  Globe2,
  Copy,
  Check,
  Trash2,
  Settings,
  BarChart3,
  X,
  RefreshCw,
  Code
} from 'lucide-react';

interface SiteFormData {
  name: string;
  domains: string;
}

export function SitesPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({ name: '', domains: '' });
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    if (!db) {
      console.error('Firestore not available');
      setLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'sites'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const siteList: Site[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        siteList.push({
          id: docSnapshot.id,
          name: data.name,
          domains: data.domains || [],
          organizationId: data.organizationId,
          settings: data.settings || { banner: DEFAULT_BANNER_SETTINGS },
          apiKey: data.apiKey,
          stats: data.stats,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
          updatedAt: data.updatedAt?.toDate?.(),
        });
      });

      setSites(siteList);
    } catch (err) {
      console.error('Error loading sites:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingSite(null);
    setFormData({ name: '', domains: '' });
    setShowModal(true);
  }

  function openEditModal(site: Site) {
    setEditingSite(site);
    setFormData({
      name: site.name,
      domains: site.domains.join(', ')
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user) return;

    setSaving(true);

    try {
      const domains = formData.domains
        .split(',')
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0);

      if (editingSite) {
        // Update existing site
        await updateDoc(doc(db, 'sites', editingSite.id), {
          name: formData.name,
          domains,
          updatedAt: new Date()
        });

        setSites(sites.map(s =>
          s.id === editingSite.id
            ? { ...s, name: formData.name, domains, updatedAt: new Date() }
            : s
        ));
      } else {
        // Create new site
        const siteId = generateSiteId();
        const newSite: Site = {
          id: siteId,
          name: formData.name,
          domains,
          settings: { banner: DEFAULT_BANNER_SETTINGS },
          apiKey: generateApiKey(),
          createdAt: new Date(),
          createdBy: user.uid,
        };

        await setDoc(doc(db, 'sites', siteId), {
          ...newSite,
          createdAt: new Date(),
        });

        setSites([newSite, ...sites]);
      }

      setShowModal(false);
    } catch (err) {
      console.error('Error saving site:', err);
    } finally {
      setSaving(false);
    }
  }

  async function deleteSite(site: Site) {
    if (!db) return;

    if (!confirm(t.sites.confirmDelete)) return;

    try {
      await deleteDoc(doc(db, 'sites', site.id));
      setSites(sites.filter(s => s.id !== site.id));
    } catch (err) {
      console.error('Error deleting site:', err);
    }
  }

  async function regenerateApiKey(site: Site) {
    if (!db) return;

    if (!confirm(t.sites.confirmRegenerate)) return;

    try {
      const newApiKey = generateApiKey();
      await updateDoc(doc(db, 'sites', site.id), {
        apiKey: newApiKey,
        updatedAt: new Date()
      });

      setSites(sites.map(s =>
        s.id === site.id
          ? { ...s, apiKey: newApiKey, updatedAt: new Date() }
          : s
      ));
    } catch (err) {
      console.error('Error regenerating API key:', err);
    }
  }

  function copyToClipboard(text: string, siteId: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(siteId);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function getIntegrationCode(site: Site): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://esbilla-api-xxxxxxxx-ew.a.run.app';
    return `<script src="${apiUrl}/sdk.js" data-id="${site.id}" data-key="${site.apiKey}"></script>`;
  }

  if (loading) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{t.sites.title}</h1>
            <p className="text-stone-500">{t.sites.subtitle}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus size={20} />
            <span>{t.sites.createSite}</span>
          </button>
        </div>

        {/* Sites list */}
        {sites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <Globe2 size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-medium text-stone-800 mb-2">{t.sites.noSites}</h3>
            <p className="text-stone-500 mb-6">{t.sites.noSitesMessage}</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus size={20} />
              <span>{t.sites.createSite}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden"
              >
                {/* Site header */}
                <div className="px-6 py-4 border-b border-stone-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Globe2 size={20} className="text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-stone-800">{site.name}</h3>
                        <p className="text-sm text-stone-500">
                          {site.domains.join(', ') || 'No domains configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedSite(expandedSite === site.id ? null : site.id)}
                        className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                        title={t.sites.integration}
                      >
                        <Code size={18} />
                      </button>
                      <button
                        onClick={() => openEditModal(site)}
                        className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                        title={t.common.edit}
                      >
                        <Settings size={18} />
                      </button>
                      <button
                        onClick={() => deleteSite(site)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t.common.delete}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="px-6 py-3 bg-stone-50 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-stone-400" />
                    <span className="text-stone-600">
                      {t.sites.totalConsents}: <strong>{site.stats?.totalConsents || 0}</strong>
                    </span>
                  </div>
                  <div className="text-stone-400">|</div>
                  <div className="text-stone-600">
                    {t.sites.lastConsent}: {' '}
                    <span className="text-stone-500">
                      {site.stats?.lastConsentAt
                        ? new Date(site.stats.lastConsentAt).toLocaleDateString(language)
                        : t.sites.never
                      }
                    </span>
                  </div>
                </div>

                {/* Expanded integration section */}
                {expandedSite === site.id && (
                  <div className="px-6 py-4 border-t border-stone-200 bg-stone-50">
                    {/* API Key */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {t.sites.apiKey}
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono text-stone-600">
                          {site.apiKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(site.apiKey, `key-${site.id}`)}
                          className="p-2 text-stone-500 hover:bg-white border border-stone-200 rounded-lg transition-colors"
                          title={t.sites.copyApiKey}
                        >
                          {copiedKey === `key-${site.id}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                        <button
                          onClick={() => regenerateApiKey(site)}
                          className="p-2 text-stone-500 hover:bg-white border border-stone-200 rounded-lg transition-colors"
                          title={t.sites.regenerateKey}
                        >
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">{t.sites.apiKeyHelp}</p>
                    </div>

                    {/* Integration code */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {t.sites.integrationCode}
                      </label>
                      <div className="flex items-start gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono text-stone-600 break-all">
                          {getIntegrationCode(site)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(getIntegrationCode(site), `code-${site.id}`)}
                          className="p-2 text-stone-500 hover:bg-white border border-stone-200 rounded-lg transition-colors"
                          title={t.sites.copyApiKey}
                        >
                          {copiedKey === `code-${site.id}` ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <h2 className="text-lg font-semibold text-stone-800">
                  {editingSite ? t.sites.editSite : t.sites.createSite}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.sites.name}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.sites.namePlaceholder}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.sites.domains}
                  </label>
                  <input
                    type="text"
                    value={formData.domains}
                    onChange={(e) => setFormData({ ...formData, domains: e.target.value })}
                    placeholder={t.sites.domainsPlaceholder}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="mt-1 text-xs text-stone-500">{t.sites.domainsHelp}</p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {saving ? t.common.loading : t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
