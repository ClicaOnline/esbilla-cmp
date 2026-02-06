import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site, DashboardUser, Organization } from '../types';
import { DEFAULT_BANNER_SETTINGS, generateApiKey, generateSiteId } from '../types';
import { usePagination } from '../hooks/usePagination';
import { useSearch } from '../hooks/useSearch';
import { Pagination } from '../components/shared/Pagination';
import { SearchInput } from '../components/shared/SearchInput';
import { PageSizeSelector } from '../components/shared/PageSizeSelector';
import { UserSearchSelector } from '../components/shared/UserSearchSelector';
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
  Code,
  Users,
  Building2
} from 'lucide-react';

interface SiteFormData {
  name: string;
  domains: string;
  organizationId?: string;
  // SDK v1.6: Dynamic Script Loading (Modo Simplified)
  gtmServerUrl?: string;
  googleAnalytics?: string;
  hotjar?: string;
  facebookPixel?: string;
  linkedinInsight?: string;
  tiktokPixel?: string;
}

export function SitesPage() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    domains: '',
    gtmServerUrl: '',
    googleAnalytics: '',
    hotjar: '',
    facebookPixel: '',
    linkedinInsight: '',
    tiktokPixel: ''
  });
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState<string | null>(null);

  // New state for search, pagination, and users management
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'site_admin' | 'site_viewer'>('site_viewer');

  useEffect(() => {
    loadSites();
    loadUsers();
    loadOrganizations();
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

  async function loadUsers() {
    if (!db) return;

    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const userList: DashboardUser[] = [];
      snapshot.forEach((docSnapshot) => {
        userList.push({ id: docSnapshot.id, ...docSnapshot.data() } as DashboardUser);
      });
      setUsers(userList);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  async function loadOrganizations() {
    if (!db) return;

    try {
      const snapshot = await getDocs(collection(db, 'organizations'));
      const orgList: Organization[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        orgList.push({
          id: docSnapshot.id,
          name: data.name,
          legalName: data.legalName,
          taxId: data.taxId,
          plan: data.plan || 'free',
          maxSites: data.maxSites || 5,
          maxConsentsPerMonth: data.maxConsentsPerMonth || 10000,
          billingEmail: data.billingEmail,
          billingAddress: data.billingAddress,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
          updatedAt: data.updatedAt?.toDate?.(),
        });
      });
      setOrganizations(orgList);
    } catch (err) {
      console.error('Error loading organizations:', err);
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
      domains: site.domains.join(', '),
      organizationId: site.organizationId || '',
      gtmServerUrl: site.scriptConfig?.gtm?.serverUrl || '',
      googleAnalytics: site.scriptConfig?.analytics?.googleAnalytics || '',
      hotjar: site.scriptConfig?.analytics?.hotjar || '',
      facebookPixel: site.scriptConfig?.marketing?.facebookPixel || '',
      linkedinInsight: site.scriptConfig?.marketing?.linkedinInsight || '',
      tiktokPixel: site.scriptConfig?.marketing?.tiktokPixel || ''
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

      // Build scriptConfig from form data
      const scriptConfig: Record<string, Record<string, string>> = {};
      if (formData.gtmServerUrl) {
        scriptConfig.gtm = {
          serverUrl: formData.gtmServerUrl
        };
      }
      if (formData.googleAnalytics || formData.hotjar) {
        scriptConfig.analytics = {};
        if (formData.googleAnalytics) scriptConfig.analytics.googleAnalytics = formData.googleAnalytics;
        if (formData.hotjar) scriptConfig.analytics.hotjar = formData.hotjar;
      }
      if (formData.facebookPixel || formData.linkedinInsight || formData.tiktokPixel) {
        scriptConfig.marketing = {};
        if (formData.facebookPixel) scriptConfig.marketing.facebookPixel = formData.facebookPixel;
        if (formData.linkedinInsight) scriptConfig.marketing.linkedinInsight = formData.linkedinInsight;
        if (formData.tiktokPixel) scriptConfig.marketing.tiktokPixel = formData.tiktokPixel;
      }

      if (editingSite) {
        // Update existing site
        const updateData: {
          name: string;
          domains: string[];
          organizationId: string | null;
          updatedAt: Date;
          scriptConfig?: typeof scriptConfig;
        } = {
          name: formData.name,
          domains,
          organizationId: formData.organizationId || null,
          updatedAt: new Date()
        };

        // Only include scriptConfig if it has values
        if (Object.keys(scriptConfig).length > 0) {
          updateData.scriptConfig = scriptConfig;
        }

        await updateDoc(doc(db, 'sites', editingSite.id), updateData);

        setSites(sites.map(s =>
          s.id === editingSite.id
            ? {
                ...s,
                name: formData.name,
                domains,
                organizationId: formData.organizationId || undefined,
                scriptConfig: Object.keys(scriptConfig).length > 0 ? scriptConfig : undefined,
                updatedAt: new Date()
              }
            : s
        ));
      } else {
        // Create new site
        const siteId = generateSiteId();
        const newSite: Site = {
          id: siteId,
          name: formData.name,
          domains,
          organizationId: formData.organizationId || undefined,
          settings: { banner: DEFAULT_BANNER_SETTINGS },
          apiKey: generateApiKey(),
          createdAt: new Date(),
          createdBy: user.uid,
        };

        // Add scriptConfig if it has values
        if (Object.keys(scriptConfig).length > 0) {
          newSite.scriptConfig = scriptConfig;
        }

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

  async function recalculateStats(site: Site) {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.esbilla.com';

    setRecalculating(site.id);

    try {
      const response = await fetch(`${apiUrl}/api/sites/${site.id}/recalculate-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al recalcular');
      }

      const data = await response.json();

      // Actualizar el sitio en el estado local
      setSites(sites.map(s =>
        s.id === site.id
          ? {
              ...s,
              stats: {
                totalConsents: data.totalConsents,
                lastConsentAt: data.lastConsentAt ? new Date(data.lastConsentAt) : undefined
              }
            }
          : s
      ));

      alert(`✅ ${data.message || `Recalculado: ${data.totalConsents} consentimientos`}`);

    } catch (err) {
      console.error('Error recalculando stats:', err);
      alert(`❌ Error al recalcular estadísticas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setRecalculating(null);
    }
  }

  function copyToClipboard(text: string, siteId: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(siteId);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function getIntegrationCode(site: Site): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://esbilla-api-xxxxxxxx-ew.a.run.app';
    // Pegoyu v2.0+: Seguridad basada en validación de dominio + rate limiting (sin API key pública)
    return `<script src="${apiUrl}/pegoyu.js" data-id="${site.id}"></script>`;
  }

  // Search and pagination hooks
  const { filteredData: filteredSites } = useSearch({
    data: sites,
    searchKeys: ['name', 'domains'],
    searchTerm
  });

  const { currentPage, totalPages, pageData: paginatedSites, goToPage } = usePagination({
    data: filteredSites,
    pageSize
  });

  // User management functions
  function getUsersWithSiteAccess(siteId: string): number {
    const site = sites.find(s => s.id === siteId);
    return users.filter(u => {
      if (u.globalRole === 'superadmin') return true;
      if (siteId in (u.siteAccess || {})) return true;
      if (site?.organizationId && site.organizationId in (u.orgAccess || {})) return true;
      return false;
    }).length;
  }

  function openUsersModal(siteId: string) {
    setSelectedSiteId(siteId);
    setShowUsersModal(true);
  }

  async function handleAddUserToSite(userId: string) {
    if (!selectedSiteId || !db || !user) return;

    const site = sites.find(s => s.id === selectedSiteId);
    if (!site) return;

    try {
      const siteAccess = {
        siteId: selectedSiteId,
        siteName: site.name,
        organizationId: site.organizationId || '',
        role: selectedUserRole,
        addedAt: new Date(),
        addedBy: user.uid
      };

      await updateDoc(doc(db, 'users', userId), {
        [`siteAccess.${selectedSiteId}`]: siteAccess
      });

      // Update local state
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, siteAccess: { ...u.siteAccess, [selectedSiteId]: siteAccess } }
          : u
      ));
    } catch (err) {
      console.error('Error adding user to site:', err);
      alert('Error al añadir usuario al sitio');
    }
  }

  async function handleRemoveUserFromSite(userId: string, siteId: string) {
    if (!db) return;

    if (!confirm('¿Quitar acceso a este sitio?')) return;

    try {
      const userDoc = await getDocs(query(collection(db, 'users')));
      const userData = userDoc.docs.find(d => d.id === userId)?.data();

      if (!userData) return;

      const updatedSiteAccess = { ...(userData.siteAccess || {}) };
      delete updatedSiteAccess[siteId];

      await updateDoc(doc(db, 'users', userId), {
        siteAccess: updatedSiteAccess
      });

      // Update local state
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, siteAccess: updatedSiteAccess }
          : u
      ));
    } catch (err) {
      console.error('Error removing user from site:', err);
      alert('Error al remover usuario del sitio');
    }
  }

  async function handleChangeUserRole(userId: string, siteId: string, newRole: 'site_admin' | 'site_viewer') {
    if (!db) return;

    try {
      await updateDoc(doc(db, 'users', userId), {
        [`siteAccess.${siteId}.role`]: newRole
      });

      // Update local state
      setUsers(users.map(u =>
        u.id === userId && u.siteAccess?.[siteId]
          ? {
              ...u,
              siteAccess: {
                ...u.siteAccess,
                [siteId]: { ...u.siteAccess[siteId], role: newRole }
              }
            }
          : u
      ));
    } catch (err) {
      console.error('Error changing user role:', err);
      alert('Error al cambiar rol del usuario');
    }
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

        {/* Search and pagination controls */}
        {sites.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por nombre o dominio..."
                className="flex-1"
              />
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
            <div className="mt-2 text-sm text-stone-500">
              Mostrando {paginatedSites.length} de {filteredSites.length} sitios
            </div>
          </div>
        )}

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
            {paginatedSites.map((site) => (
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-800">{site.name}</h3>
                          <code className="px-2 py-0.5 bg-stone-100 text-xs text-stone-600 rounded font-mono">
                            {site.id}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {site.organizationId && (
                            <>
                              <span className="text-xs text-stone-500 flex items-center gap-1">
                                <Building2 size={12} />
                                {organizations.find(o => o.id === site.organizationId)?.name || 'Organización'}
                              </span>
                              <span className="text-xs text-stone-400">•</span>
                            </>
                          )}
                          <p className="text-sm text-stone-500">
                            {site.domains.join(', ') || 'No domains configured'}
                          </p>
                        </div>
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
                  <div className="text-stone-400">|</div>
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-stone-400" />
                    <button
                      onClick={() => openUsersModal(site.id)}
                      className="text-stone-600 hover:text-amber-600 transition-colors"
                    >
                      <strong>{getUsersWithSiteAccess(site.id)}</strong> usuarios
                    </button>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => recalculateStats(site)}
                      disabled={recalculating === site.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t.sites.recalculateStats || 'Recalcular estadísticas'}
                    >
                      <RefreshCw size={14} className={recalculating === site.id ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline">
                        {recalculating === site.id ? (t.sites.recalculating || 'Calculando...') : (t.sites.recalculate || 'Recalcular')}
                      </span>
                    </button>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              showFirstLast={true}
            />
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

                {/* Organization Selector */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-2">
                    <Building2 size={16} className="text-amber-500" />
                    Organización
                  </label>
                  <select
                    value={formData.organizationId || ''}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Sin organización</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-stone-500">
                    Asigna este sitio a una organización para control de acceso multi-tenant
                  </p>
                </div>

                {/* GTM Server Side */}
                <div className="border-t border-stone-200 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={16} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-stone-700">
                      Google Tag Manager Server Side
                    </h3>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-600 mb-1">
                      URL del servidor GTM Server Side (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.gtmServerUrl || ''}
                      onChange={(e) => setFormData({ ...formData, gtmServerUrl: e.target.value })}
                      placeholder="https://gtm.tudominio.com"
                      className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <p className="mt-1 text-xs text-stone-500">
                      Si usas GTM Server Side, introduce la URL de tu servidor. El SDK enviará eventos a esta URL en lugar del endpoint estándar de Google.
                    </p>
                  </div>
                </div>

                {/* SDK v1.6: Dynamic Script Loading Configuration */}
                <div className="border-t border-stone-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Code size={16} className="text-amber-500" />
                    <h3 className="text-sm font-semibold text-stone-700">
                      Configuración de Scripts (Modo Simplified)
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 mb-4">
                    El SDK v1.6 puede cargar automáticamente estos scripts según el consentimiento del usuario.
                    Deja vacío para usar modo manual (scripts en HTML con type="text/plain").
                  </p>

                  {/* Analytics Scripts */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-stone-600 mb-2 uppercase tracking-wide">
                      Analytics (Consentimiento Requerido)
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          Google Analytics 4 (Measurement ID)
                        </label>
                        <input
                          type="text"
                          value={formData.googleAnalytics || ''}
                          onChange={(e) => setFormData({ ...formData, googleAnalytics: e.target.value })}
                          placeholder="G-XXXXXXXXXX"
                          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          Hotjar (Site ID)
                        </label>
                        <input
                          type="text"
                          value={formData.hotjar || ''}
                          onChange={(e) => setFormData({ ...formData, hotjar: e.target.value })}
                          placeholder="12345"
                          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Marketing Scripts */}
                  <div>
                    <p className="text-xs font-medium text-stone-600 mb-2 uppercase tracking-wide">
                      Marketing (Consentimiento Requerido)
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          Facebook Pixel (Pixel ID)
                        </label>
                        <input
                          type="text"
                          value={formData.facebookPixel || ''}
                          onChange={(e) => setFormData({ ...formData, facebookPixel: e.target.value })}
                          placeholder="123456789012345"
                          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          LinkedIn Insight (Partner ID)
                        </label>
                        <input
                          type="text"
                          value={formData.linkedinInsight || ''}
                          onChange={(e) => setFormData({ ...formData, linkedinInsight: e.target.value })}
                          placeholder="123456"
                          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 mb-1">
                          TikTok Pixel (Pixel ID)
                        </label>
                        <input
                          type="text"
                          value={formData.tiktokPixel || ''}
                          onChange={(e) => setFormData({ ...formData, tiktokPixel: e.target.value })}
                          placeholder="ABCDEFGHIJK"
                          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
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

        {/* Users Management Modal */}
        {showUsersModal && selectedSiteId && (() => {
          const site = sites.find(s => s.id === selectedSiteId);
          if (!site) return null;

          const usersWithAccess = users.filter(u => {
            if (u.globalRole === 'superadmin') return true;
            if (selectedSiteId in (u.siteAccess || {})) return true;
            if (site.organizationId && site.organizationId in (u.orgAccess || {})) return true;
            return false;
          });

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">
                      Usuarios con acceso al sitio
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">{site.name}</p>
                  </div>
                  <button
                    onClick={() => setShowUsersModal(false)}
                    className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Users list */}
                <div className="p-6 space-y-3">
                  {usersWithAccess.map(u => {
                    const isSuperadmin = u.globalRole === 'superadmin';
                    const hasDirectSiteAccess = selectedSiteId in (u.siteAccess || {});
                    const hasOrgAccess = site.organizationId && site.organizationId in (u.orgAccess || {});
                    const currentRole = hasDirectSiteAccess
                      ? u.siteAccess?.[selectedSiteId]?.role
                      : undefined;

                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 bg-stone-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.email)}`}
                            alt={u.displayName}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-stone-800">
                              {u.displayName || u.email}
                            </p>
                            <p className="text-sm text-stone-500">{u.email}</p>
                            {hasOrgAccess && !hasDirectSiteAccess && (
                              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <Check size={12} />
                                Acceso vía {organizations.find(o => o.id === site.organizationId)?.name} ({u.orgAccess?.[site.organizationId!]?.role})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isSuperadmin ? (
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              Superadmin
                            </span>
                          ) : hasDirectSiteAccess ? (
                            <>
                              <select
                                value={currentRole}
                                onChange={(e) => handleChangeUserRole(u.id, selectedSiteId, e.target.value as 'site_admin' | 'site_viewer')}
                                className="px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              >
                                <option value="site_viewer">Viewer</option>
                                <option value="site_admin">Admin</option>
                              </select>
                              <button
                                onClick={() => handleRemoveUserFromSite(u.id, selectedSiteId)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Quitar acceso"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Vía organización
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add user section */}
                <div className="border-t border-stone-200 p-6 bg-stone-50">
                  <h3 className="text-sm font-medium text-stone-700 mb-3">
                    Añadir usuario al sitio
                  </h3>
                  <div className="space-y-3">
                    <UserSearchSelector
                      users={users}
                      onSelect={(user) => handleAddUserToSite(user.id)}
                      excludeUserIds={usersWithAccess.map(u => u.id)}
                      placeholder="Buscar usuario por email o nombre..."
                    />

                    <div className="flex items-start gap-2">
                      <select
                        value={selectedUserRole}
                        onChange={(e) => setSelectedUserRole(e.target.value as 'site_admin' | 'site_viewer')}
                        className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                      >
                        <option value="site_viewer">Viewer (solo lectura)</option>
                        <option value="site_admin">Admin (gestión completa del sitio)</option>
                      </select>
                    </div>

                    <p className="text-xs text-stone-500 mt-2">
                      💡 <strong>Tip:</strong> Escribe el email o nombre del usuario para buscarlo. El usuario será añadido con el rol seleccionado.
                    </p>

                    <p className="text-xs text-stone-500">
                      <strong>Nota:</strong> Los usuarios con acceso a la organización "{organizations.find(o => o.id === site.organizationId)?.name || 'la organización asociada'}"
                      tienen acceso automático a todos sus sitios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </Layout>
  );
}
