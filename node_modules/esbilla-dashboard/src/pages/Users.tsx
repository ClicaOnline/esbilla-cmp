import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, setDoc, serverTimestamp } from 'firebase/firestore';
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
import { usePagination } from '../hooks/usePagination';
import { useSearch } from '../hooks/useSearch';
import { Pagination } from '../components/shared/Pagination';
import { SearchInput } from '../components/shared/SearchInput';
import { PageSizeSelector } from '../components/shared/PageSizeSelector';
import {
  Shield, Eye, Clock, Trash2, Check, X, Crown,
  Globe2, Plus, Building2, ChevronDown, UserPlus, Mail, Save
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
  const [modalOrgSearch, setModalOrgSearch] = useState('');
  const [modalSiteSearch, setModalSiteSearch] = useState('');

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserGlobalRole, setNewUserGlobalRole] = useState<GlobalRole>('pending');
  const [newUserOrgAccess, setNewUserOrgAccess] = useState<Record<string, OrganizationRole>>({});
  const [newUserSiteAccess, setNewUserSiteAccess] = useState<Record<string, SiteRole>>({});
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Invite user modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrganization, setInviteOrganization] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationRole>('org_viewer');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Role change confirmation modal state
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [roleChangeUserId, setRoleChangeUserId] = useState<string | null>(null);
  const [roleChangeNewRole, setRoleChangeNewRole] = useState<GlobalRole | null>(null);
  const [roleChangeIsLastSuperadmin, setRoleChangeIsLastSuperadmin] = useState(false);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(25);

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

  // Count superadmins in the system
  function countSuperadmins(): number {
    return users.filter(u => u.globalRole === 'superadmin').length;
  }

  // Initiate role change with validation
  function initiateRoleChange(userId: string, newRole: GlobalRole) {
    if (!isSuperAdmin) return;

    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Check if downgrading the last superadmin
    const superadminCount = countSuperadmins();
    const isLastSuperadmin = user.globalRole === 'superadmin' &&
                             newRole !== 'superadmin' &&
                             superadminCount === 1;

    if (isLastSuperadmin) {
      // Show warning modal - cannot proceed
      setRoleChangeUserId(userId);
      setRoleChangeNewRole(newRole);
      setRoleChangeIsLastSuperadmin(true);
      setShowRoleChangeModal(true);
      return;
    }

    // If changing from/to superadmin, show confirmation modal
    if (user.globalRole === 'superadmin' || newRole === 'superadmin') {
      setRoleChangeUserId(userId);
      setRoleChangeNewRole(newRole);
      setRoleChangeIsLastSuperadmin(false);
      setShowRoleChangeModal(true);
    } else {
      // For non-critical changes, update directly
      confirmRoleChange(userId, newRole);
    }
  }

  async function confirmRoleChange(userId: string, newRole: GlobalRole) {
    if (!isSuperAdmin || !db) return;

    try {
      await updateDoc(doc(db, 'users', userId), { globalRole: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, globalRole: newRole } : u));
      setShowRoleChangeModal(false);
      setRoleChangeUserId(null);
      setRoleChangeNewRole(null);
      setRoleChangeIsLastSuperadmin(false);
    } catch (err) {
      console.error('Error updating global role:', err);
      alert('Error al actualizar el rol. Por favor, intenta de nuevo.');
    }
  }

  function cancelRoleChange() {
    setShowRoleChangeModal(false);
    setRoleChangeUserId(null);
    setRoleChangeNewRole(null);
    setRoleChangeIsLastSuperadmin(false);
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

  function openCreateModal() {
    setNewUserEmail('');
    setNewUserName('');
    setNewUserGlobalRole('pending');
    setNewUserOrgAccess({});
    setNewUserSiteAccess({});
    setCreateError(null);
    setShowCreateModal(true);
  }

  async function createUser() {
    if (!isSuperAdmin || !db) return;
    if (!newUserEmail || !newUserEmail.includes('@')) {
      setCreateError('Email inválido');
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === newUserEmail.toLowerCase());
    if (existingUser) {
      setCreateError('Ya existe un usuario con este email');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      // Generate a unique ID for the invited user (will be replaced when they login)
      const inviteId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Build org access records
      const orgAccessRecords: Record<string, OrganizationAccess> = {};
      Object.entries(newUserOrgAccess).forEach(([orgId, role]) => {
        const org = organizations.find(o => o.id === orgId);
        orgAccessRecords[orgId] = {
          organizationId: orgId,
          organizationName: org?.name,
          role,
          addedAt: new Date(),
          addedBy: currentUser?.uid || ''
        };
      });

      // Build site access records
      const siteAccessRecords: Record<string, SiteAccess> = {};
      Object.entries(newUserSiteAccess).forEach(([siteId, role]) => {
        const site = sites.find(s => s.id === siteId);
        siteAccessRecords[siteId] = {
          siteId,
          siteName: site?.name,
          organizationId: site?.organizationId || '',
          role,
          addedAt: new Date(),
          addedBy: currentUser?.uid || ''
        };
      });

      // Determine global role based on access
      let globalRole: GlobalRole = newUserGlobalRole;
      if (globalRole === 'pending' && (Object.keys(orgAccessRecords).length > 0 || Object.keys(siteAccessRecords).length > 0)) {
        // If has any access, consider them approved but not superadmin
        globalRole = 'pending'; // They'll get access via org/site, not global role
      }

      const newUser = {
        email: newUserEmail.toLowerCase(),
        displayName: newUserName || newUserEmail.split('@')[0],
        photoURL: '',
        globalRole,
        orgAccess: orgAccessRecords,
        siteAccess: siteAccessRecords,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        createdBy: currentUser?.uid || '',
        invitedBy: currentUser?.uid || '',
        isInvited: true, // Flag to indicate this is an invited user waiting for first login
      };

      await setDoc(doc(db, 'users', inviteId), newUser);

      // Add to local state
      setUsers([...users, {
        id: inviteId,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: '',
        globalRole: newUser.globalRole,
        orgAccess: orgAccessRecords,
        siteAccess: siteAccessRecords,
        createdAt: new Date(),
        lastLogin: new Date()
      }]);

      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating user:', err);
      setCreateError('Error al crear el usuario');
    } finally {
      setCreateLoading(false);
    }
  }

  async function sendInvitation() {
    if (!currentUser || !db) return;
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError('Email inválido');
      return;
    }
    if (!inviteOrganization) {
      setInviteError('Selecciona una organización');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/invitations/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          organizationId: inviteOrganization,
          type: 'organization',
          role: inviteRole,
          locale: language,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar la invitación');
      }

      setInviteSuccess(true);
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteOrganization('');
        setInviteRole('org_viewer');
        setInviteSuccess(false);
      }, 2000);

    } catch (err: unknown) {
      console.error('[Users] Error sending invitation:', err);
      if (err instanceof Error) {
        setInviteError(err.message);
      } else {
        setInviteError('Error desconocido');
      }
    } finally {
      setInviteLoading(false);
    }
  }

  function toggleNewUserOrgAccess(orgId: string, role: OrganizationRole | null) {
    setNewUserOrgAccess(prev => {
      const updated = { ...prev };
      if (role === null) {
        delete updated[orgId];
      } else {
        updated[orgId] = role;
      }
      return updated;
    });
  }

  function toggleNewUserSiteAccess(siteId: string, role: SiteRole | null) {
    setNewUserSiteAccess(prev => {
      const updated = { ...prev };
      if (role === null) {
        delete updated[siteId];
      } else {
        updated[siteId] = role;
      }
      return updated;
    });
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

  // Search and pagination for active users
  const { filteredData: filteredActiveUsers } = useSearch({
    data: activeUsers,
    searchKeys: ['email', 'displayName'],
    searchTerm
  });

  const { currentPage, totalPages, pageData: paginatedUsers, goToPage } = usePagination({
    data: filteredActiveUsers,
    pageSize
  });

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
            <h1 className="text-2xl font-bold text-stone-800">{t.users.title}</h1>
            <p className="text-stone-500">{t.users.subtitle}</p>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Mail size={18} />
                <span>Invitar Usuario</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <UserPlus size={18} />
                <span>{t.users.createUser || 'Crear Usuario'}</span>
              </button>
            </div>
          )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-stone-800">
                {t.users.activeUsers} ({filteredActiveUsers.length})
              </h2>
              <PageSizeSelector
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por email o nombre..."
            />
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
              {paginatedUsers.map((user) => (
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
                    {isSuperAdmin && user.id !== currentUser?.uid ? (
                      <select
                        value={user.globalRole}
                        onChange={(e) => initiateRoleChange(user.id, e.target.value as GlobalRole)}
                        className="px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="pending">⏳ {t.users.roles.pending || 'Pendiente'}</option>
                        <option value="superadmin">👑 {t.users.roles.superadmin || 'Superadmin'}</option>
                      </select>
                    ) : (
                      <RoleBadge role={getPrimaryRole(user)} labels={t.users.roles} />
                    )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-stone-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
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
                      <SearchInput
                        value={modalOrgSearch}
                        onChange={setModalOrgSearch}
                        placeholder="Buscar organizaciones..."
                        className="mb-4"
                      />
                      {organizations
                        .filter(org =>
                          modalOrgSearch.trim() === '' ||
                          org.name.toLowerCase().includes(modalOrgSearch.toLowerCase()) ||
                          org.legalName?.toLowerCase().includes(modalOrgSearch.toLowerCase())
                        )
                        .map((org) => {
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
                      <SearchInput
                        value={modalSiteSearch}
                        onChange={setModalSiteSearch}
                        placeholder="Buscar sitios..."
                        className="mb-4"
                      />
                      {sites
                        .filter(site =>
                          modalSiteSearch.trim() === '' ||
                          site.name.toLowerCase().includes(modalSiteSearch.toLowerCase()) ||
                          site.domains.some(d => d.toLowerCase().includes(modalSiteSearch.toLowerCase()))
                        )
                        .map((site) => {
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

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <UserPlus size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-800">
                      {t.users.createUser || 'Crear Usuario'}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {t.users.createUserDesc || 'Invita a un nuevo usuario y asigna permisos'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                    <Mail size={16} />
                    {t.users.basicInfo || 'Información Básica'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="usuario@empresa.com"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {t.users.displayName || 'Nombre'}
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Nombre del usuario"
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Global Role */}
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      {t.users.globalRole || 'Rol Global'}
                    </label>
                    <select
                      value={newUserGlobalRole}
                      onChange={(e) => setNewUserGlobalRole(e.target.value as GlobalRole)}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="pending">{t.users.roles.pending || 'Pendiente'}</option>
                      <option value="superadmin">{t.users.roles.superadmin || 'Superadmin'}</option>
                    </select>
                    <p className="text-xs text-stone-500 mt-1">
                      {newUserGlobalRole === 'superadmin'
                        ? 'Tendrá acceso total a toda la plataforma'
                        : 'Los permisos se definirán por organización/sitio'}
                    </p>
                  </div>
                </div>

                {/* Organization Access */}
                {newUserGlobalRole !== 'superadmin' && organizations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                      <Building2 size={16} />
                      {t.users.orgAccess || 'Acceso a Organizaciones'}
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {organizations.map((org) => {
                        const hasAccess = org.id in newUserOrgAccess;
                        return (
                          <div
                            key={org.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              hasAccess ? 'border-amber-200 bg-amber-50' : 'border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className={hasAccess ? 'text-amber-600' : 'text-stone-400'} />
                              <span className="text-sm text-stone-800">{org.name}</span>
                            </div>
                            {hasAccess ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newUserOrgAccess[org.id]}
                                  onChange={(e) => toggleNewUserOrgAccess(org.id, e.target.value as OrganizationRole)}
                                  className="text-xs border border-stone-200 rounded px-2 py-1"
                                >
                                  <option value="org_viewer">{t.users.roles.org_viewer}</option>
                                  <option value="org_admin">{t.users.roles.org_admin}</option>
                                  <option value="org_owner">{t.users.roles.org_owner}</option>
                                </select>
                                <button
                                  onClick={() => toggleNewUserOrgAccess(org.id, null)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleNewUserOrgAccess(org.id, 'org_viewer')}
                                className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                              >
                                <Plus size={12} className="inline mr-1" />
                                Añadir
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Site Access */}
                {newUserGlobalRole !== 'superadmin' && sites.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-stone-700 flex items-center gap-2">
                      <Globe2 size={16} />
                      {t.users.siteAccess || 'Acceso Directo a Sitios'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      Solo necesario si el usuario no tiene acceso a la organización del sitio
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sites.map((site) => {
                        const hasDirectAccess = site.id in newUserSiteAccess;
                        const hasOrgAccess = site.organizationId && site.organizationId in newUserOrgAccess;
                        return (
                          <div
                            key={site.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              hasDirectAccess ? 'border-blue-200 bg-blue-50' :
                              hasOrgAccess ? 'border-green-200 bg-green-50' :
                              'border-stone-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe2 size={16} className={
                                hasDirectAccess ? 'text-blue-600' :
                                hasOrgAccess ? 'text-green-600' :
                                'text-stone-400'
                              } />
                              <div>
                                <span className="text-sm text-stone-800">{site.name}</span>
                                {hasOrgAccess && (
                                  <span className="text-xs text-green-600 ml-2">
                                    (vía org)
                                  </span>
                                )}
                              </div>
                            </div>
                            {hasDirectAccess ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={newUserSiteAccess[site.id]}
                                  onChange={(e) => toggleNewUserSiteAccess(site.id, e.target.value as SiteRole)}
                                  className="text-xs border border-stone-200 rounded px-2 py-1"
                                >
                                  <option value="site_viewer">{t.users.roles.site_viewer}</option>
                                  <option value="site_admin">{t.users.roles.site_admin}</option>
                                </select>
                                <button
                                  onClick={() => toggleNewUserSiteAccess(site.id, null)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : !hasOrgAccess ? (
                              <button
                                onClick={() => toggleNewUserSiteAccess(site.id, 'site_viewer')}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                <Plus size={12} className="inline mr-1" />
                                Añadir
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {createError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-stone-200 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={createUser}
                  disabled={createLoading || !newUserEmail}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>{t.users.createUser || 'Crear Usuario'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite User Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                  <Mail size={20} className="text-blue-600" />
                  Invitar Usuario
                </h2>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Success message */}
                {inviteSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                    <Check size={18} />
                    <span className="text-sm font-medium">¡Invitación enviada correctamente!</span>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Email del usuario
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteLoading || inviteSuccess}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-blue-400 focus:outline-none transition-colors disabled:bg-stone-50 disabled:cursor-not-allowed"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Organización
                  </label>
                  <select
                    value={inviteOrganization}
                    onChange={(e) => setInviteOrganization(e.target.value)}
                    disabled={inviteLoading || inviteSuccess}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-blue-400 focus:outline-none transition-colors disabled:bg-stone-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona una organización</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as OrganizationRole)}
                    disabled={inviteLoading || inviteSuccess}
                    className="w-full px-4 py-3 border-2 border-stone-200 rounded-lg focus:border-blue-400 focus:outline-none transition-colors disabled:bg-stone-50 disabled:cursor-not-allowed"
                  >
                    <option value="org_owner">{t.users.roles.org_owner}</option>
                    <option value="org_admin">{t.users.roles.org_admin}</option>
                    <option value="org_viewer">{t.users.roles.org_viewer}</option>
                  </select>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Se enviará un email de invitación al usuario. Podrá crear su cuenta o iniciar sesión con Google.
                  </p>
                </div>

                {/* Error message */}
                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {inviteError}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-stone-200 flex gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  {inviteSuccess ? 'Cerrar' : t.common.cancel}
                </button>
                {!inviteSuccess && (
                  <button
                    onClick={sendInvitation}
                    disabled={inviteLoading || !inviteEmail || !inviteOrganization}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inviteLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Mail size={18} />
                        <span>Enviar Invitación</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Role Change Confirmation Modal */}
        {showRoleChangeModal && roleChangeUserId && roleChangeNewRole && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-stone-200">
                <h2 className="text-xl font-semibold text-stone-800 flex items-center gap-2">
                  {roleChangeIsLastSuperadmin ? (
                    <>
                      <X size={20} className="text-red-600" />
                      Cambio no permitido
                    </>
                  ) : (
                    <>
                      <Shield size={20} className="text-amber-600" />
                      Confirmar cambio de rol
                    </>
                  )}
                </h2>
              </div>

              <div className="px-6 py-4 space-y-4">
                {roleChangeIsLastSuperadmin ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">
                        ⚠️ No puedes degradar al último superadmin
                      </p>
                    </div>
                    <p className="text-sm text-stone-600">
                      El sistema debe tener al menos 1 superadmin en todo momento. Antes de cambiar este rol,
                      debes promover a otro usuario a superadmin.
                    </p>
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                      <p className="text-xs text-stone-600">
                        <strong>Superadmins actuales:</strong> {countSuperadmins()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-stone-600">
                      Estás a punto de cambiar el rol global del usuario:
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-stone-800">
                        {users.find(u => u.id === roleChangeUserId)?.displayName}
                      </p>
                      <p className="text-xs text-stone-600">
                        {users.find(u => u.id === roleChangeUserId)?.email}
                      </p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-300">
                        <RoleBadge
                          role={users.find(u => u.id === roleChangeUserId)?.globalRole || 'pending'}
                          labels={t.users.roles}
                        />
                        <span className="text-stone-400">→</span>
                        <RoleBadge role={roleChangeNewRole} labels={t.users.roles} />
                      </div>
                    </div>
                    {roleChangeNewRole === 'superadmin' && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-700">
                          <strong>Superadmin</strong> tiene acceso completo a todas las organizaciones,
                          sitios y configuraciones del sistema.
                        </p>
                      </div>
                    )}
                    {users.find(u => u.id === roleChangeUserId)?.globalRole === 'superadmin' && roleChangeNewRole !== 'superadmin' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700">
                          Al degradar este rol, el usuario perderá acceso administrativo global.
                        </p>
                        <p className="text-xs text-stone-600 mt-1">
                          <strong>Superadmins restantes:</strong> {countSuperadmins() - 1}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-stone-200 flex gap-3">
                <button
                  onClick={cancelRoleChange}
                  className="flex-1 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                >
                  {roleChangeIsLastSuperadmin ? 'Entendido' : t.common.cancel}
                </button>
                {!roleChangeIsLastSuperadmin && (
                  <button
                    onClick={() => confirmRoleChange(roleChangeUserId, roleChangeNewRole)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                  >
                    <Check size={18} />
                    <span>Confirmar cambio</span>
                  </button>
                )}
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
