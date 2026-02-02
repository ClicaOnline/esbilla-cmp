import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { Shield, Eye, Clock, Trash2, Check, X, Crown } from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  createdAt: Date;
  lastLogin: Date;
}

export function UsersPage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const { t, language } = useI18n();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const userList: UserRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        userList.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastLogin: data.lastLogin?.toDate?.() || new Date()
        });
      });

      setUsers(userList);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    if (!isAdmin) return;

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error actualizando rol:', err);
    }
  }

  async function deleteUser(userId: string) {
    if (!isAdmin || userId === currentUser?.uid) return;

    if (!confirm(t.users.confirmDelete)) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  }

  const pendingUsers = users.filter(u => u.role === 'pending');
  const activeUsers = users.filter(u => u.role !== 'pending');

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
                      onClick={() => updateUserRole(user.id, 'viewer')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check size={16} />
                      <span>{t.users.approveViewer}</span>
                    </button>
                    <button
                      onClick={() => updateUserRole(user.id, 'admin')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Shield size={16} />
                      <span>{t.users.roles.admin}</span>
                    </button>
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
                    <RoleBadge role={user.role} labels={t.users.roles} />
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
                    {user.id !== currentUser?.uid && (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                          className="text-sm border border-stone-200 rounded-lg px-2 py-1"
                          disabled={user.role === 'superadmin' && !isSuperAdmin}
                        >
                          <option value="viewer">{t.users.roles.viewer}</option>
                          <option value="admin">{t.users.roles.admin}</option>
                          {isSuperAdmin && <option value="superadmin">{t.users.roles.superadmin}</option>}
                        </select>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={user.role === 'superadmin' && !isSuperAdmin}
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
      </div>
    </Layout>
  );
}

function RoleBadge({ role, labels }: { role: UserRole; labels: Record<UserRole, string> }) {
  const styles: Record<UserRole, string> = {
    superadmin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    viewer: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700'
  };

  const icons: Record<UserRole, React.ReactNode> = {
    superadmin: <Crown size={14} />,
    admin: <Shield size={14} />,
    viewer: <Eye size={14} />,
    pending: <Clock size={14} />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[role]}`}>
      {icons[role]}
      {labels[role]}
    </span>
  );
}
