import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Organization, Site } from '../types';
import { generateOrgId } from '../types';
import {
  Building2, Plus, Edit2, Trash2, X, Copy, Check,
  CreditCard, Globe2, Users, AlertTriangle
} from 'lucide-react';

// Generate a unique tracking ID for the organization
function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ESB-ORG-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface OrganizationFormData {
  name: string;
  legalName: string;
  taxId: string;
  billingEmail: string;
  plan: 'free' | 'pro' | 'enterprise';
}

const PLAN_LIMITS = {
  free: { maxSites: 3, maxConsentsPerMonth: 10000 },
  pro: { maxSites: 10, maxConsentsPerMonth: 100000 },
  enterprise: { maxSites: 100, maxConsentsPerMonth: 10000000 }
};

export function OrganizationsPage() {
  const { user, isSuperAdmin } = useAuth();
  const { t } = useI18n();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    legalName: '',
    taxId: '',
    billingEmail: '',
    plan: 'free'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      // Load organizations
      const orgsQ = query(collection(db, 'organizations'), orderBy('name', 'asc'));
      const orgsSnapshot = await getDocs(orgsQ);

      const orgList: Organization[] = [];
      orgsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        orgList.push({
          id: docSnapshot.id,
          name: data.name,
          legalName: data.legalName,
          taxId: data.taxId,
          plan: data.plan || 'free',
          maxSites: data.maxSites || PLAN_LIMITS.free.maxSites,
          maxConsentsPerMonth: data.maxConsentsPerMonth || PLAN_LIMITS.free.maxConsentsPerMonth,
          billingEmail: data.billingEmail || '',
          billingAddress: data.billingAddress,
          trackingId: data.trackingId,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
          updatedAt: data.updatedAt?.toDate?.(),
        });
      });

      setOrganizations(orgList);

      // Load sites to count per organization
      const sitesQ = query(collection(db, 'sites'), orderBy('name', 'asc'));
      const sitesSnapshot = await getDocs(sitesQ);

      const siteList: Site[] = [];
      sitesSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        siteList.push({
          id: docSnapshot.id,
          name: data.name,
          domains: data.domains || [],
          organizationId: data.organizationId,
          apiKey: data.apiKey,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
        });
      });

      setSites(siteList);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingOrg(null);
    setFormData({
      name: '',
      legalName: '',
      taxId: '',
      billingEmail: '',
      plan: 'free'
    });
    setShowModal(true);
  }

  function openEditModal(org: Organization) {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      legalName: org.legalName || '',
      taxId: org.taxId || '',
      billingEmail: org.billingEmail,
      plan: org.plan
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!db || !user) return;

    try {
      const planLimits = PLAN_LIMITS[formData.plan];

      if (editingOrg) {
        // Update existing organization
        await updateDoc(doc(db, 'organizations', editingOrg.id), {
          name: formData.name,
          legalName: formData.legalName || null,
          taxId: formData.taxId || null,
          billingEmail: formData.billingEmail,
          plan: formData.plan,
          maxSites: planLimits.maxSites,
          maxConsentsPerMonth: planLimits.maxConsentsPerMonth,
          updatedAt: new Date()
        });

        setOrganizations(prev => prev.map(org =>
          org.id === editingOrg.id
            ? {
                ...org,
                ...formData,
                maxSites: planLimits.maxSites,
                maxConsentsPerMonth: planLimits.maxConsentsPerMonth,
                updatedAt: new Date()
              }
            : org
        ));
      } else {
        // Create new organization
        const orgId = generateOrgId();
        const trackingId = generateTrackingId();

        const newOrg: Organization & { trackingId: string } = {
          id: orgId,
          name: formData.name,
          legalName: formData.legalName || undefined,
          taxId: formData.taxId || undefined,
          plan: formData.plan,
          maxSites: planLimits.maxSites,
          maxConsentsPerMonth: planLimits.maxConsentsPerMonth,
          billingEmail: formData.billingEmail,
          trackingId,
          createdAt: new Date(),
          createdBy: user.uid
        };

        await setDoc(doc(db, 'organizations', orgId), newOrg);
        setOrganizations(prev => [...prev, newOrg]);
      }

      setShowModal(false);
    } catch (err) {
      console.error('Error saving organization:', err);
    }
  }

  async function deleteOrganization(orgId: string) {
    if (!db || !isSuperAdmin) return;

    const sitesInOrg = sites.filter(s => s.organizationId === orgId);
    if (sitesInOrg.length > 0) {
      alert(`No se puede eliminar: hay ${sitesInOrg.length} sitio(s) asociados a esta organización.`);
      return;
    }

    if (!confirm(t.organizations?.confirmDelete || '¿Estás seguro de eliminar esta organización?')) return;

    try {
      await deleteDoc(doc(db, 'organizations', orgId));
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
    } catch (err) {
      console.error('Error deleting organization:', err);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getSitesCount(orgId: string): number {
    return sites.filter(s => s.organizationId === orgId).length;
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
            <h1 className="text-2xl font-bold text-stone-800">
              {t.organizations?.title || 'Gestión de Organizaciones'}
            </h1>
            <p className="text-stone-500">
              {t.organizations?.subtitle || 'Administra las entidades fiscales y sus dominios'}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus size={18} />
              <span>{t.organizations?.createOrg || 'Crear Organización'}</span>
            </button>
          )}
        </div>

        {/* Organizations list */}
        {organizations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-stone-200">
            <Building2 size={48} className="mx-auto text-stone-300 mb-4" />
            <h3 className="text-lg font-medium text-stone-700">
              {t.organizations?.noOrgs || 'No hay organizaciones'}
            </h3>
            <p className="text-stone-500 mt-1">
              {t.organizations?.noOrgsMessage || 'Crea la primera organización para empezar'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => {
              const sitesCount = getSitesCount(org.id);
              const isAtLimit = sitesCount >= org.maxSites;

              return (
                <div
                  key={org.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-stone-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Building2 size={24} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-stone-800">{org.name}</h3>
                        {org.legalName && (
                          <p className="text-sm text-stone-500">{org.legalName}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            org.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                            org.plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {org.plan.toUpperCase()}
                          </span>
                          {org.taxId && (
                            <span className="text-xs text-stone-400">
                              {org.taxId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(org)}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={t.organizations?.editOrg || 'Editar'}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteOrganization(org.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t.organizations?.deleteOrg || 'Eliminar'}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
                    {/* Tracking ID */}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Tracking ID</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {(org as Organization & { trackingId?: string }).trackingId || org.id.substring(0, 12)}
                        </code>
                        <button
                          onClick={() => copyToClipboard((org as Organization & { trackingId?: string }).trackingId || org.id, org.id)}
                          className="p-1 text-stone-400 hover:text-indigo-600 transition-colors"
                          title="Copiar"
                        >
                          {copiedId === org.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    {/* Sites count */}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Sitios</p>
                      <div className="flex items-center gap-2">
                        <Globe2 size={16} className="text-stone-400" />
                        <span className={`text-lg font-semibold ${isAtLimit ? 'text-red-600' : 'text-stone-800'}`}>
                          {sitesCount} / {org.maxSites}
                        </span>
                        {isAtLimit && <AlertTriangle size={16} className="text-red-500" />}
                      </div>
                    </div>

                    {/* Consents limit */}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Consentimientos/mes</p>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-stone-400" />
                        <span className="text-lg font-semibold text-stone-800">
                          {org.maxConsentsPerMonth.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Billing */}
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">Facturación</p>
                      <div className="flex items-center gap-2">
                        <CreditCard size={16} className="text-stone-400" />
                        <span className="text-sm text-stone-600 truncate" title={org.billingEmail}>
                          {org.billingEmail || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <h2 className="text-lg font-semibold text-stone-800">
                  {editingOrg
                    ? (t.organizations?.editOrg || 'Editar Organización')
                    : (t.organizations?.createOrg || 'Crear Organización')
                  }
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.organizations?.name || 'Nombre'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder={t.organizations?.namePlaceholder || 'Mi empresa'}
                    required
                  />
                </div>

                {/* Legal Name */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.organizations?.legalName || 'Razón Social'}
                  </label>
                  <input
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Empresa S.L."
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.organizations?.taxId || 'NIF/CIF'}
                  </label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="B12345678"
                  />
                </div>

                {/* Billing Email */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.organizations?.billingEmail || 'Email de facturación'} *
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="billing@empresa.com"
                    required
                  />
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {t.organizations?.plan || 'Plan'}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['free', 'pro', 'enterprise'] as const).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setFormData({ ...formData, plan })}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          formData.plan === plan
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <p className={`font-medium ${
                          formData.plan === plan ? 'text-amber-700' : 'text-stone-700'
                        }`}>
                          {t.organizations?.plans?.[plan] || plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {PLAN_LIMITS[plan].maxSites} sitios
                        </p>
                        <p className="text-xs text-stone-500">
                          {(PLAN_LIMITS[plan].maxConsentsPerMonth / 1000).toFixed(0)}k/mes
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    {t.common.save}
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
