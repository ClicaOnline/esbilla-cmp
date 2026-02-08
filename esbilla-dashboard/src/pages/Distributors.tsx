import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { DashboardUser, Organization, DistributorAccess, DistributorRole } from '../types';
import { Users, Building2, Plus, Trash2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';

export function DistributorsPage() {
  const { userData, isSuperAdmin } = useAuth();
  const { t } = useI18n();

  // State
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Assign modal state
  const [selectedOrg, setSelectedOrg] = useState('');
  const [selectedRole, setSelectedRole] = useState<DistributorRole>('distributor_manager');
  const [notes, setNotes] = useState('');

  // Load data
  useEffect(() => {
    if (!isSuperAdmin) return;
    loadData();
  }, [isSuperAdmin]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Load all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orgAccess: data.orgAccess || {},
          siteAccess: data.siteAccess || {},
          distributorAccess: data.distributorAccess || {},
          createdAt: data.createdAt?.toDate(),
          lastLogin: data.lastLogin?.toDate(),
        } as DashboardUser;
      });
      setUsers(usersData);

      // Load all organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'));
      const orgsData = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Organization[];
      setOrganizations(orgsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  // Filter users that are distributors
  const distributors = users.filter(u =>
    u.distributorAccess && Object.keys(u.distributorAccess).length > 0
  );

  // Filter for search
  const filteredDistributors = distributors.filter(u =>
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get organization name
  function getOrgName(orgId: string): string {
    return organizations.find(o => o.id === orgId)?.name || orgId;
  }

  // Assign distributor to organization
  async function assignDistributor() {
    if (!selectedUser || !selectedOrg || !selectedRole) {
      setError('Completa todos los campos');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', selectedUser.id);

      const newAccess: DistributorAccess = {
        organizationId: selectedOrg,
        organizationName: getOrgName(selectedOrg),
        role: selectedRole,
        addedAt: new Date(),
        addedBy: userData!.id,
        notes: notes || undefined,
      };

      await updateDoc(userRef, {
        [`distributorAccess.${selectedOrg}`]: newAccess,
        updatedAt: serverTimestamp(),
      });

      setSuccess(`Distribuidor asignado a ${getOrgName(selectedOrg)}`);
      setShowAssignModal(false);
      setSelectedOrg('');
      setSelectedRole('distributor_manager');
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Error assigning distributor:', err);
      setError('Error al asignar distribuidor');
    } finally {
      setSaving(false);
    }
  }

  // Remove distributor from organization
  async function removeDistributor(user: DashboardUser, orgId: string) {
    if (!confirm(`¿Eliminar acceso de distribuidor a ${getOrgName(orgId)}?`)) return;

    setSaving(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        [`distributorAccess.${orgId}`]: deleteField(),
        updatedAt: serverTimestamp(),
      });

      setSuccess('Acceso de distribuidor eliminado');
      loadData();
    } catch (err) {
      console.error('Error removing distributor:', err);
      setError('Error al eliminar distribuidor');
    } finally {
      setSaving(false);
    }
  }

  // Open assign modal
  function openAssignModal(user: DashboardUser) {
    setSelectedUser(user);
    setShowAssignModal(true);
    setSelectedOrg('');
    setSelectedRole('distributor_manager');
    setNotes('');
  }

  // Close modals
  function closeModals() {
    setShowAssignModal(false);
    setSelectedUser(null);
    setSelectedOrg('');
    setNotes('');
  }

  // Auto-hide success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-xl text-stone-600">Acceso no autorizado</p>
            <p className="text-stone-500 mt-2">Solo superadmins pueden acceder a esta página</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Distribuidores</h1>
            <p className="text-stone-600 mt-2">
              Gestiona qué usuarios son distribuidores y qué organizaciones gestionan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="text-amber-600" size={24} />
            <span className="text-2xl font-bold text-stone-800">{distributors.length}</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Distributors List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-stone-600">Cargando...</div>
          </div>
        ) : filteredDistributors.length === 0 ? (
          <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
            <Users className="mx-auto h-12 w-12 text-stone-400 mb-4" />
            <p className="text-lg text-stone-600">No hay distribuidores</p>
            <p className="text-stone-500 mt-2">Asigna roles de distribuidor desde la página de Usuarios</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDistributors.map(user => (
              <div key={user.id} className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-stone-800">{user.displayName}</h3>
                      <p className="text-stone-600">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openAssignModal(user)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Asignar Organización
                  </button>
                </div>

                {/* Organizations */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-stone-700 mb-2">
                    Organizaciones gestionadas ({Object.keys(user.distributorAccess || {}).length})
                  </h4>
                  {Object.entries(user.distributorAccess || {}).map(([orgId, access]) => (
                    <div
                      key={orgId}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="text-amber-600" size={18} />
                        <div>
                          <p className="font-medium text-stone-800">{access.organizationName || orgId}</p>
                          <p className="text-sm text-stone-600">
                            Rol: {access.role === 'distributor_admin' ? 'Admin' :
                                 access.role === 'distributor_manager' ? 'Gestor' : 'Viewer'}
                          </p>
                          {access.notes && (
                            <p className="text-sm text-stone-500 mt-1">📝 {access.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeDistributor(user, orgId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar acceso"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-stone-800">Asignar Distribuidor</h2>
                <button onClick={closeModals} className="text-stone-400 hover:text-stone-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="p-3 bg-stone-50 rounded-lg">
                  <p className="text-sm text-stone-600">Usuario</p>
                  <p className="font-medium text-stone-800">{selectedUser.displayName}</p>
                  <p className="text-sm text-stone-600">{selectedUser.email}</p>
                </div>

                {/* Organization Select */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Organización
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar organización...</option>
                    {organizations
                      .filter(org => !(selectedUser.distributorAccess?.[org.id]))
                      .map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Rol de Distribuidor
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as DistributorRole)}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="distributor_admin">Admin - Acceso total incluyendo billing</option>
                    <option value="distributor_manager">Gestor - Gestión sin billing</option>
                    <option value="distributor_viewer">Viewer - Solo lectura</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Cliente de la agencia XYZ, contrato anual..."
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeModals}
                    className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={assignDistributor}
                    disabled={saving || !selectedOrg}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-stone-300"
                  >
                    {saving ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
