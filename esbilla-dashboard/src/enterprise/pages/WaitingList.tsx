import { useState, useMemo } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { WaitingListEntry } from '../types';
import { Navigate } from 'react-router-dom';
import { Download, Search, Filter, Mail, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usePagination } from '../hooks/usePagination';

export function WaitingListPage() {
  const { isSuperAdmin } = useAuth();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'converted' | 'rejected'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'starter' | 'growth' | 'agency'>('all');

  // Solo superadmins pueden acceder
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  // Fetch waiting list data
  const { data: waitingList = [], isLoading, error } = useQuery({
    queryKey: ['waitingList'],
    queryFn: async () => {
      if (!db) throw new Error('Firestore not initialized');
      const q = query(
        collection(db, 'waitingList'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        contactedAt: doc.data().contactedAt?.toDate(),
        convertedAt: doc.data().convertedAt?.toDate(),
      })) as WaitingListEntry[];
    },
  });

  // Filtrar datos
  const filteredData = useMemo(() => {
    let filtered = waitingList;

    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry: WaitingListEntry) =>
          entry.email.toLowerCase().includes(query) ||
          entry.name?.toLowerCase().includes(query) ||
          entry.company?.toLowerCase().includes(query)
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((entry: WaitingListEntry) => entry.status === statusFilter);
    }

    // Filtro de plan
    if (planFilter !== 'all') {
      filtered = filtered.filter((entry: WaitingListEntry) => entry.plan === planFilter);
    }

    return filtered;
  }, [waitingList, searchQuery, statusFilter, planFilter]);

  // Paginación
  const {
    pageData,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    pageSize,
    setPageSize,
  } = usePagination<WaitingListEntry>({ data: filteredData, pageSize: 20 });

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: waitingList.length,
      pending: waitingList.filter((e: WaitingListEntry) => e.status === 'pending').length,
      contacted: waitingList.filter((e: WaitingListEntry) => e.status === 'contacted').length,
      converted: waitingList.filter((e: WaitingListEntry) => e.status === 'converted').length,
      rejected: waitingList.filter((e: WaitingListEntry) => e.status === 'rejected').length,
    };
  }, [waitingList]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'Email',
      'Nombre',
      'Empresa',
      'Plan',
      'Estado',
      'Sitio Web',
      'Mensaje',
      'Idioma',
      'Fecha Registro',
      'Fecha Contacto',
      'Fecha Conversión',
    ];

    const rows = filteredData.map((entry: WaitingListEntry) => [
      entry.email,
      entry.name || '',
      entry.company || '',
      entry.plan,
      entry.status,
      entry.website || '',
      entry.message || '',
      entry.locale || '',
      entry.createdAt?.toISOString() || '',
      entry.contactedAt?.toISOString() || '',
      entry.convertedAt?.toISOString() || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esbilla-waiting-list-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Exportar a JSON
  const handleExportJSON = () => {
    const jsonContent = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `esbilla-waiting-list-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-stone-600">{t.common.loading}</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-red-600">Error: {(error as Error).message}</div>
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
            <h1 className="text-3xl font-bold text-stone-900">{t.waitingList.title}</h1>
            <p className="text-stone-600 mt-1">{t.waitingList.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download size={18} />
              Exportar CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download size={18} />
              Exportar JSON
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-stone-100 rounded-lg">
                <Users size={24} className="text-stone-600" />
              </div>
              <div>
                <p className="text-sm text-stone-600">Total</p>
                <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock size={24} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-amber-600">Pendientes</p>
                <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Contactados</p>
                <p className="text-2xl font-bold text-blue-900">{stats.contacted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600">Convertidos</p>
                <p className="text-2xl font-bold text-green-900">{stats.converted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Rechazados</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 border border-stone-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder={t.common.search}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-stone-600" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="contacted">Contactados</option>
                <option value="converted">Convertidos</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-stone-600" />
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as typeof planFilter)}
                className="px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Todos los planes</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="agency">Agency</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-stone-600">
            Mostrando {filteredData.length} de {waitingList.length} registros
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-stone-600 uppercase">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  pageData.map((entry: WaitingListEntry) => (
                    <tr key={entry.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-stone-900">{entry.email}</div>
                        {entry.website && (
                          <div className="text-xs text-stone-500 mt-1">{entry.website}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-700">
                          {entry.name || <span className="text-stone-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            entry.plan === 'free'
                              ? 'bg-stone-100 text-stone-700'
                              : entry.plan === 'starter'
                                ? 'bg-amber-100 text-amber-700'
                                : entry.plan === 'growth'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-stone-900 text-white'
                          }`}
                        >
                          {entry.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            entry.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : entry.status === 'contacted'
                                ? 'bg-blue-100 text-blue-700'
                                : entry.status === 'converted'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {entry.status === 'pending'
                            ? 'Pendiente'
                            : entry.status === 'contacted'
                              ? 'Contactado'
                              : entry.status === 'converted'
                                ? 'Convertido'
                                : 'Rechazado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-700">
                          {entry.company || <span className="text-stone-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-stone-600">
                          {entry.createdAt?.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-stone-500">
                          {entry.createdAt?.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-600">Mostrar:</span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="px-3 py-1 border border-stone-300 rounded-lg text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-stone-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Anterior
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      page =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => (
                      <div key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-stone-400">...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            currentPage === page
                              ? 'bg-amber-500 text-white'
                              : 'border border-stone-300 hover:bg-stone-50'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-stone-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
