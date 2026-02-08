import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { WaitingListEntry } from '../types';
import { usePagination } from '../hooks/usePagination';
import { useSearch } from '../hooks/useSearch';
import { Pagination } from '../components/shared/Pagination';
import { SearchInput } from '../components/shared/SearchInput';
import { PageSizeSelector } from '../components/shared/PageSizeSelector';
import { BadgeEstado } from '../components/BadgeEstado';
import {
  Mail, Calendar, Building2, Globe2, Trash2, Edit2,
  Save, X, Filter, Download
} from 'lucide-react';

export function WaitlistPage() {
  const { user, isSuperAdmin } = useAuth();
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<WaitingListEntry['status'] | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WaitingListEntry>>({});
  const [saving, setSaving] = useState(false);

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (!user || !isSuperAdmin) return;
    loadEntries();
  }, [user, isSuperAdmin, filterStatus]);

  async function loadEntries() {
    if (!db) return;
    setLoading(true);

    try {
      let q = query(collection(db, 'waitingList'), orderBy('createdAt', 'desc'));

      if (filterStatus !== 'all') {
        q = query(collection(db, 'waitingList'), where('status', '==', filterStatus), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const list: WaitingListEntry[] = [];

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          email: data.email,
          name: data.name,
          plan: data.plan,
          company: data.company,
          website: data.website,
          message: data.message,
          status: data.status || 'pending',
          notes: data.notes,
          contactedAt: data.contactedAt?.toDate(),
          contactedBy: data.contactedBy,
          convertedAt: data.convertedAt?.toDate(),
          source: data.source,
          locale: data.locale,
          createdAt: data.createdAt.toDate()
        });
      });

      setEntries(list);
    } catch (error) {
      console.error('Error loading waitingList:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(entryId: string, newStatus: WaitingListEntry['status']) {
    if (!db) return;

    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'contacted' && !entries.find(e => e.id === entryId)?.contactedAt) {
        updateData.contactedAt = new Date();
        updateData.contactedBy = user?.uid;
      }

      if (newStatus === 'converted' && !entries.find(e => e.id === entryId)?.convertedAt) {
        updateData.convertedAt = new Date();
      }

      await updateDoc(doc(db, 'waitingList', entryId), updateData);

      setEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, ...updateData }
          : entry
      ));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  function startEdit(entry: WaitingListEntry) {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name,
      email: entry.email,
      company: entry.company,
      website: entry.website,
      plan: entry.plan,
      message: entry.message,
      notes: entry.notes
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(entryId: string) {
    if (!db) return;
    setSaving(true);

    try {
      await updateDoc(doc(db, 'waitingList', entryId), {
        ...editForm,
        updatedAt: new Date()
      });

      setEntries(prev => prev.map(entry =>
        entry.id === entryId
          ? { ...entry, ...editForm }
          : entry
      ));

      cancelEdit();
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entryId: string) {
    if (!db || !confirm('¿Estás seguro de que quieres eliminar este contacto?')) return;

    try {
      await deleteDoc(doc(db, 'waitingList', entryId));
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  function exportToCSV() {
    const headers = ['Fecha', 'Nombre', 'Email', 'Empresa', 'Web', 'Plan', 'Estado', 'Mensaje', 'Notas'];
    const rows = filteredEntries.map((entry: WaitingListEntry) => [
      entry.createdAt.toLocaleDateString(),
      entry.name || '',
      entry.email,
      entry.company || '',
      entry.website || '',
      entry.plan,
      entry.status,
      entry.message || '',
      entry.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `waitingList_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const { filteredData: filteredEntries } = useSearch({
    data: entries,
    searchKeys: ['email', 'name', 'company', 'website'],
    searchTerm
  });

  const { pageData: currentItems, goToPage, currentPage, totalPages } = usePagination({
    data: filteredEntries,
    pageSize
  });

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-stone-600">No tienes permisos para ver esta página</p>
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
            <h1 className="text-3xl font-artesana text-madera">Lista de Espera</h1>
            <p className="text-stone-600 mt-1">
              {entries.length} contacto{entries.length !== 1 ? 's' : ''} total
              {filteredEntries.length !== entries.length && ` · ${filteredEntries.length} filtrado${filteredEntries.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-stone-500" />
              <span className="text-sm font-medium text-stone-700">Estado:</span>
            </div>

            <div className="flex gap-2">
              {(['all', 'pending', 'contacted', 'converted', 'rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status === 'pending' ? 'Pendientes' : status === 'contacted' ? 'Contactados' : status === 'converted' ? 'Convertidos' : 'Rechazados'}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-4">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por email, nombre, empresa..."
              />
              <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <p className="text-stone-600 mt-4">Cargando lista de espera...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Mail size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-600">
              {searchTerm || filterStatus !== 'all'
                ? 'No se encontraron contactos con los filtros aplicados'
                : 'No hay contactos en la lista de espera'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Empresa/Web
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-stone-200">
                    {currentItems.map((entry: WaitingListEntry) => (
                      <tr key={entry.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-stone-400" />
                            {entry.createdAt.toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {editingId === entry.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.name || ''}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Nombre"
                                className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                              />
                              <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="Email"
                                className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-stone-800">{entry.name || 'Sin nombre'}</p>
                              <p className="text-sm text-stone-500 flex items-center gap-1">
                                <Mail size={12} />
                                {entry.email}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {editingId === entry.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editForm.company || ''}
                                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                placeholder="Empresa"
                                className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                              />
                              <input
                                type="text"
                                value={editForm.website || ''}
                                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                placeholder="Website"
                                className="w-full px-2 py-1 text-sm border border-stone-300 rounded"
                              />
                            </div>
                          ) : (
                            <div className="text-sm">
                              {entry.company && (
                                <p className="flex items-center gap-1 text-stone-700">
                                  <Building2 size={12} />
                                  {entry.company}
                                </p>
                              )}
                              {entry.website && (
                                <p className="flex items-center gap-1 text-stone-500 mt-1">
                                  <Globe2 size={12} />
                                  <a href={entry.website} target="_blank" rel="noopener noreferrer" className="hover:text-amber-600">
                                    {entry.website}
                                  </a>
                                </p>
                              )}
                              {!entry.company && !entry.website && (
                                <span className="text-stone-400 italic">Sin datos</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {editingId === entry.id ? (
                            <select
                              value={editForm.plan || 'free'}
                              onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as any })}
                              className="px-2 py-1 text-sm border border-stone-300 rounded"
                            >
                              <option value="free">Free</option>
                              <option value="starter">Starter</option>
                              <option value="growth">Growth</option>
                              <option value="agency">Agency</option>
                            </select>
                          ) : (
                            <BadgeEstado
                              name={`plan-${entry.plan === 'starter' || entry.plan === 'growth' || entry.plan === 'agency' ? 'pro' : 'free'}` as any}
                              label={entry.plan.toUpperCase()}
                            />
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {editingId === entry.id ? (
                            <span className="text-sm text-stone-500">
                              (el estado se cambia con el selector de la derecha)
                            </span>
                          ) : (
                            <select
                              value={entry.status}
                              onChange={(e) => handleStatusChange(entry.id, e.target.value as WaitingListEntry['status'])}
                              className="px-3 py-1.5 text-xs font-medium border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="contacted">Contactado</option>
                              <option value="converted">Convertido</option>
                              <option value="rejected">Rechazado</option>
                            </select>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {editingId === entry.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEdit(entry.id)}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save size={14} />
                                Guardar
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="flex items-center gap-1 px-3 py-1.5 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 disabled:opacity-50"
                              >
                                <X size={14} />
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEdit(entry)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
          </>
        )}
      </div>
    </Layout>
  );
}
