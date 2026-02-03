import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type {
  Site,
  Organization,
  SiteAccess,
  OrganizationAccess,
  SiteRole,
  OrganizationRole,
  GlobalRole
} from '../types';
import {
  Shield, Eye, Clock, Trash2, Check, X, Crown,
  Globe2, Plus, Building2, ChevronDown
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  globalRole: GlobalRole;
  orgAccess: Record<string, OrganizationAccess>;
  siteAccess: Record<string, SiteAccess>;
  createdAt: Date;
  lastLogin: Date;
}

type AnyRole = GlobalRole | OrganizationRole | SiteRole;

export function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { t, language } = useI18n();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'orgs' | 'sites'>('orgs');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!db) {
      console.error('Firestore not available');
      setLoading(false);
      return;
    }

    try {
      // Load users
      const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQ);

      const userList: UserRecord[] = [];
      usersSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        userList.push({
          id: docSnapshot.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          globalRole: data.globalRole || data.role || 'pending', // Legacy support
          orgAccess: data.orgAccess || {},
          siteAccess: data.siteAccess || {},
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || new Date()
        });
      });

      setUsers(userList);

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
          maxSites: data.maxSites || 3,
          maxConsentsPerMonth: data.maxConsentsPerMonth || 10000,
          billingEmail: data.billingEmail || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          createdBy: data.createdBy,
        });
      });

      setOrganizations(orgList);

      // Load sites
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
          settings: data.settings,
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

  async function updateUserGlobalRole(userId: string, newRole: GlobalRole) {
    if (!isSuperAdmin || !db) return;

    try {
      await updateDoc(doc(db, 'users', userId), { globalRole: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, globalRole: newRole } : u));
    } catch (err) {
      console.error('Error updating global role:', err);
    }
  }

  async function deleteUser(userId: string) {
    if (!isSuperAdmin || userId === currentUser?.uid || !db) return;

    if (!confirm(t.users.confirmDelete)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  }

  function openAccessModal(user: UserRecord) {
    setSelectedUser(user);
    setShowAccessModal(true);
  }

  async function updateOrgAccess(userId: string, orgId: string, role: OrganizationRole | null) {
    if (!isSuperAdmin || !db) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newOrgAccess = { ...user.orgAccess };

    if (role === null) {
      delete newOrgAccess[orgId];
    } else {
      const org = organizations.find(o => o.id === orgId);
      newOrgAccess[orgId] = {
        organizationId: orgId,
        organizationName: org?.name,
        role,
        addedAt: new Date(),
        addedBy: currentUser?.uid || ''
      };
    }

    try {
      await updateDoc(doc(db, 'users', userId), { orgAccess: newOrgAccess });
      setUsers(users.map(u => u.id === userId ? { ...u, orgAccess: newOrgAccess } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, orgAccess: newOrgAccess });
      }
    } catch (err) {
      console.error('Error updating org access:', err);
    }
  }

  async function updateSiteAccess(userId: string, siteId: string, role: SiteRole | null) {
    if (!isSuperAdmin || !db) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const newSiteAccess = { ...user.siteAccess };
    const site = sites.find(s => s.id === siteId);

    if (role === null) {
      delete newSiteAccess[siteId];
    } else {
      newSiteAccess[siteId] = {
        siteId,
        siteName: site?.name,
        organizationId: site?.organizationId || '',
        role,
        addedAt: new Date(),
        addedBy: currentUser?.uid || ''
      };
    }

    try {
      await updateDoc(doc(db, 'users', userId), { siteAccess: newSiteAccess });
      setUsers(users.map(u => u.id === userId ? { ...u, siteAccess: newSiteAccess } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, siteAccess: newSiteAccess });
      }
    } catch (err) {
      console.error('Error updating site access:', err);
    }
  }

  function getAccessSummary(user: UserRecord): string {
    if (user.globalRole === 'superadmin') return 'All';

    const orgCount = Object.keys(user.orgAccess || {}).length;
    const siteCount = Object.keys(user.siteAccess || {}).length;

    if (orgCount === 0 && siteCount === 0) return t.users.noAccess;

    const parts = [];
    if (orgCount > 0) parts.push(`${orgCount} ${t.users.organizations?.toLowerCase() || 'orgs'}`);
    if (siteCount > 0) parts.push(`${siteCount} ${t.users.sites?.toLowerCase() || 'sites'}`);

    return parts.join(', ');
  }

  function getPrimaryRole(user: UserRecord): AnyRole {
    if (user.globalRole === 'superadmin') return 'superadmin';
    if (user.globalRole === 'pending') return 'pending';

    // Find highest org role
    const orgRoles = Object.values(user.orgAccess || {});
    if (orgRoles.some(a => a.role === 'org_owner')) return 'org_owner';
    if (orgRoles.some(a => a.role === 'org_admin')) return 'org_admin';
    if (orgRoles.some(a => a.role === 'org_viewer')) return 'org_viewer';

    // Find highest site role
    const siteRoles = Object.values(user.siteAccess || {});
    if (siteRoles.some(a => a.role === 'site_admin')) return 'site_admin';
    if (siteRoles.some(a => a.role === 'site_viewer')) return 'site_viewer';

    return 'pending';
  }

  const pendingUsers = users.filter(u => u.globalRole === 'pending' &&
    Object.keys(u.orgAccess || {}).length === 0 &&
    Object.keys(u.siteAccess || {}).length === 0
  );
  const activeUsers = users.filter(u =>
    u.globalRole === 'superadmin' ||
    Object.keys(u.orgAccess || {}).length > 0 ||
    Object.keys(u.siteAccess || {}).length > 0
  );

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
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t.users.title}</h1>
          <p className="text-stone-500">{t.users.subtitle}</p>
        </div>

        {/* Pending approvals */}
        {pendingUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-amber-600" />
              <h2 className="text-lg font-semibold text-amber-800">
                {t.users.pendingApproval} ({pendingUsers.length})
              </h2>
            </div>

            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-white p-4 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {user.photoURL && (
                      <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium text-stone-800">{user.displayName}</p>
                      <p className="text-sm text-stone-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAccessModal(user)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check size={16} />
                      <span>{t.users.approve}</span>
                    </button>
                    {isSuperAdmin && (
                      <button
                        onClick={() => updateUserGlobalRole(user.id, 'superadmin')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Crown size={16} />
                        <span>{t.users.roles.superadmin}</span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X size={16} />
                      <span>{t.users.reject}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active users */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-stone-800">
              {t.users.activeUsers} ({activeUsers.length})
            </h2>
          </div>

          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  {t.users.user}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  {t.users.role}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  {t.users.accessLevel}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase">
                  {t.users.lastAccess}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-stone-500 uppercase">
                  {t.users.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {activeUsers.map((user) => (
                <tr key={user.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL && (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium text-stone-800">{user.displayName}</p>
                        <p className="text-sm text-stone-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={getPrimaryRole(user)} labels={t.users.roles} />
                  </td>
                  <td className="px-6 py-4">
                    {user.globalRole === 'superadmin' ? (
                      <span className="text-xs text-stone-400">{t.users.allSites}</span>
                    ) : (
                      <button
                        onClick={() => openAccessModal(user)}
                        className="flex items-center gap-1 text-sm text-stone-600 hover:text-amber-600 transition-colors"
                      >
                        <Globe2 size={14} />
                        <span>{getAccessSummary(user)}</span>
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {user.lastLogin.toLocaleDateString(language, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser?.uid && isSuperAdmin && (
                      <div className="flex items-center justify-end gap-2">
                        {user.globalRole !== 'superadmin' && (
                          <button
                            onClick={() => updateUserGlobalRole(user.id, 'superadmin')}
                            className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                            title={t.users.roles.superadmin}
                          >
                            <Crown size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    {user.id === currentUser?.uid && (
                      <span className="text-sm text-stone-400">{t.common.you}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Access Management Modal */}
        {showAccessModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <div>
                  <h2 className="text-lg font-semibold text-stone-800">
                    {t.users.accessLevel}
                  </h2>
                  <p className="text-sm text-stone-500">{selectedUser.displayName} ({selectedUser.email})</p>
                </div>
                <button
                  onClick={() => setShowAccessModal(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-stone-200">
                <button
                  onClick={() => setActiveTab('orgs')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'orgs'
                      ? 'text-amber-600 border-b-2 border-amber-600'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Building2 size={16} className="inline mr-2" />
                  {t.users.organizations} ({Object.keys(selectedUser.orgAccess || {}).length})
                </button>
                <button
                  onClick={() => setActiveTab('sites')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'sites'
                      ? 'text-amber-600 border-b-2 border-amber-600'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Globe2 size={16} className="inline mr-2" />
                  {t.users.sites} ({Object.keys(selectedUser.siteAccess || {}).length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'orgs' ? (
                  // Organizations tab
                  organizations.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">{t.organizations?.noOrgs || 'No organizations'}</p>
                  ) : (
                    <div className="space-y-3">
                      {organizations.map((org) => {
                        const access = selectedUser.orgAccess?.[org.id];
                        const hasAccess = !!access;

                        return (
                          <div
                            key={org.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              hasAccess ? 'border-amber-200 bg-amber-50' : 'border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                hasAccess ? 'bg-amber-200' : 'bg-stone-100'
                              }`}>
                                <Building2 size={20} className={hasAccess ? 'text-amber-700' : 'text-stone-400'} />
                              </div>
                              <div>
                                <p className="font-medium text-stone-800">{org.name}</p>
                                <p className="text-xs text-stone-500">
                                  {sites.filter(s => s.organizationId === org.id).length} {t.organizations?.sitesCount || 'sites'}
                                  {' • '}
                                  {org.plan}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasAccess ? (
                                <>
                                  <select
                                    value={access.role}
                                    onChange={(e) => updateOrgAccess(selectedUser.id, org.id, e.target.value as OrganizationRole)}
                                    className="text-sm border border-stone-200 rounded-lg px-2 py-1"
                                  >
                                    <option value="org_viewer">{t.users.roles.org_viewer}</option>
                                    <option value="org_admin">{t.users.roles.org_admin}</option>
                                    <option value="org_owner">{t.users.roles.org_owner}</option>
                                  </select>
                                  <button
                                    onClick={() => updateOrgAccess(selectedUser.id, org.id, null)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => updateOrgAccess(selectedUser.id, org.id, 'org_viewer')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                                >
                                  <Plus size={14} />
                                  <span>{t.users.addToOrg}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  // Sites tab (for direct site access, bypassing org)
                  sites.length === 0 ? (
                    <p className="text-center text-stone-500 py-8">{t.sites?.noSites || 'No sites'}</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-stone-500 mb-4">
                        {/* Help text explaining site-level access */}
                        Direct site access is useful for freelancers or agencies who need access to specific sites without organization-level permissions.
                      </p>
                      {sites.map((site) => {
                        const access = selectedUser.siteAccess?.[site.id];
                        const hasAccess = !!access;
                        // Check if user already has access via org
                        const hasOrgAccess = site.organizationId && selectedUser.orgAccess?.[site.organizationId];

                        return (
                          <div
                            key={site.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              hasAccess ? 'border-blue-200 bg-blue-50' :
                              hasOrgAccess ? 'border-green-200 bg-green-50' :
                              'border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                hasAccess ? 'bg-blue-200' :
                                hasOrgAccess ? 'bg-green-200' :
                                'bg-stone-100'
                              }`}>
                                <Globe2 size={20} className={
                                  hasAccess ? 'text-blue-700' :
                                  hasOrgAccess ? 'text-green-700' :
                                  'text-stone-400'
                                } />
                              </div>
                              <div>
                                <p className="font-medium text-stone-800">{site.name}</p>
                                <p className="text-xs text-stone-500">{site.domains.join(', ')}</p>
                                {hasOrgAccess && (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ Has access via organization ({selectedUser.orgAccess[site.organizationId!].role})
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasAccess ? (
                                <>
                                  <select
                                    value={access.role}
                                    onChange={(e) => updateSiteAccess(selectedUser.id, site.id, e.target.value as SiteRole)}
                                    className="text-sm border border-stone-200 rounded-lg px-2 py-1"
                                  >
                                    <option value="site_viewer">{t.users.roles.site_viewer}</option>
                                    <option value="site_admin">{t.users.roles.site_admin}</option>
                                  </select>
                                  <button
                                    onClick={() => updateSiteAccess(selectedUser.id, site.id, null)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : !hasOrgAccess ? (
                                <button
                                  onClick={() => updateSiteAccess(selectedUser.id, site.id, 'site_viewer')}
                                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  <Plus size={14} />
                                  <span>{t.users.addToSite}</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              <div className="px-6 py-4 border-t border-stone-200">
                <button
                  onClick={() => setShowAccessModal(false)}
                  className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function RoleBadge({ role, labels }: { role: AnyRole; labels: Record<string, string> }) {
  const styles: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    pending: 'bg-amber-100 text-amber-700',
    org_owner: 'bg-indigo-100 text-indigo-700',
    org_admin: 'bg-blue-100 text-blue-700',
    org_viewer: 'bg-teal-100 text-teal-700',
    site_admin: 'bg-emerald-100 text-emerald-700',
    site_viewer: 'bg-green-100 text-green-700',
  };

  const icons: Record<string, React.ReactNode> = {
    superadmin: <Crown size={14} />,
    pending: <Clock size={14} />,
    org_owner: <Crown size={14} />,
    org_admin: <Shield size={14} />,
    org_viewer: <Eye size={14} />,
    site_admin: <Shield size={14} />,
    site_viewer: <Eye size={14} />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[role] || 'bg-stone-100 text-stone-700'}`}>
      {icons[role]}
      {labels[role] || role}
    </span>
  );
}
