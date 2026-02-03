// esbilla-cmp/esbilla-dashboard/src/pages/UrlStats.tsx
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site } from '../types';
import {
  Link2, Download, ArrowUpDown, Calendar, Globe2, RefreshCw, AlertCircle,
  ChevronUp, ChevronDown
} from 'lucide-react';

// Date range presets
type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

interface UrlStatsRow {
  url: string;
  total: number;
  acceptAll: number;
  rejectAll: number;
  customize: number;
  update: number;
  lastEvent: Date;
}

type SortField = 'url' | 'total' | 'acceptAll' | 'rejectAll' | 'customize' | 'lastEvent';
type SortDirection = 'asc' | 'desc';

function getDateRangeFromPreset(preset: DateRangePreset): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (preset) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

export function UrlStatsPage() {
  const { t, language } = useI18n();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlStats, setUrlStats] = useState<UrlStatsRow[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  // Date range state
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // i18n fallback for urlStats
  const urlStatsT = (t as Record<string, unknown>).urlStats as Record<string, string> | undefined;

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadUrlStats();
  }, [selectedSiteId, datePreset, customStartDate, customEndDate]);

  async function loadSites() {
    if (!db || !isAdmin) return;

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
    } catch (err) {
      console.error('Error loading sites:', err);
    }
  }

  async function loadUrlStats() {
    if (!db) {
      setError('Firestore no disponible');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const consentsRef = collection(db, 'consents');

      // Calculate date range
      let startDate: Date;
      let endDate: Date = new Date();
      endDate.setHours(23, 59, 59, 999);

      if (datePreset === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const range = getDateRangeFromPreset(datePreset);
        startDate = range.start;
        endDate = range.end;
      }

      // Build query
      let q;
      try {
        if (selectedSiteId && selectedSiteId !== 'all') {
          q = query(
            consentsRef,
            where('siteId', '==', selectedSiteId),
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<=', Timestamp.fromDate(endDate)),
            orderBy('createdAt', 'desc'),
            limit(5000)
          );
        } else {
          q = query(
            consentsRef,
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<=', Timestamp.fromDate(endDate)),
            orderBy('createdAt', 'desc'),
            limit(5000)
          );
        }
      } catch (queryErr) {
        console.warn('Using fallback query:', queryErr);
        q = query(
          consentsRef,
          orderBy('createdAt', 'desc'),
          limit(1000)
        );
      }

      const snapshot = await getDocs(q);

      // Aggregate by URL
      const urlMap = new Map<string, UrlStatsRow>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const pageUrl = data.metadata?.pageUrl || data.metadata?.domain || 'unknown';
        const action = data.action || 'unknown';
        const createdAt = data.createdAt?.toDate?.() || new Date(data.timestamp);

        const existing = urlMap.get(pageUrl) || {
          url: pageUrl,
          total: 0,
          acceptAll: 0,
          rejectAll: 0,
          customize: 0,
          update: 0,
          lastEvent: new Date(0)
        };

        existing.total++;
        if (action === 'accept_all') existing.acceptAll++;
        else if (action === 'reject_all') existing.rejectAll++;
        else if (action === 'customize') existing.customize++;
        else if (action === 'update') existing.update++;

        if (createdAt > existing.lastEvent) {
          existing.lastEvent = createdAt;
        }

        urlMap.set(pageUrl, existing);
      });

      setUrlStats(Array.from(urlMap.values()));
    } catch (err: unknown) {
      console.error('Error cargando estadísticas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';

      if (errorMessage.includes('index') || (err as { code?: number })?.code === 9) {
        setError('Se requiere crear un índice en Firestore. Revisa la consola para más detalles.');
      } else {
        setError(`Error al cargar datos: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // Sort data
  const sortedData = [...urlStats].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'url':
        comparison = a.url.localeCompare(b.url);
        break;
      case 'total':
        comparison = a.total - b.total;
        break;
      case 'acceptAll':
        comparison = a.acceptAll - b.acceptAll;
        break;
      case 'rejectAll':
        comparison = a.rejectAll - b.rejectAll;
        break;
      case 'customize':
        comparison = a.customize - b.customize;
        break;
      case 'lastEvent':
        comparison = a.lastEvent.getTime() - b.lastEvent.getTime();
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  function exportCsv() {
    const headers = ['URL', 'Total', 'Aceptar Todo', 'Rechazar Todo', 'Personalizar', 'Actualizar', 'Último Evento'];
    const rows = sortedData.map(row => [
      `"${row.url.replace(/"/g, '""')}"`,
      row.total,
      row.acceptAll,
      row.rejectAll,
      row.customize,
      row.update,
      row.lastEvent.toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `esbilla-url-stats-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-stone-300" />;
    }
    return sortDirection === 'asc'
      ? <ChevronUp size={14} className="text-amber-600" />
      : <ChevronDown size={14} className="text-amber-600" />;
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
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">
              {urlStatsT?.title || 'Estadísticas por URL'}
            </h1>
            <p className="text-stone-500">
              {urlStatsT?.subtitle || 'Consentimientos agrupados por página'}
            </p>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range selector */}
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-1">
              <Calendar size={16} className="text-stone-400 ml-2" />
              {(['7d', '30d', '90d', 'custom'] as DateRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    datePreset === preset
                      ? 'bg-amber-500 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {preset === 'custom' ? 'Personalizado' : preset.replace('d', ' días')}
                </button>
              ))}
            </div>

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-stone-400">→</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Site selector */}
            {isAdmin && sites.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe2 size={18} className="text-stone-400" />
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">{t.sites?.title || 'Todos los sitios'}</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Refresh button */}
            <button
              onClick={() => loadUrlStats()}
              disabled={loading}
              className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
              title="Actualizar datos"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error al cargar datos</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Stats summary & Export button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-stone-600">
              <Link2 size={18} />
              <span className="font-medium">{sortedData.length}</span>
              <span>{urlStatsT?.uniqueUrls || 'URLs únicas'}</span>
            </div>
            <div className="text-stone-400">|</div>
            <div className="text-stone-600">
              <span className="font-medium">{sortedData.reduce((sum, row) => sum + row.total, 0).toLocaleString()}</span>
              <span className="ml-1">{urlStatsT?.totalEvents || 'eventos totales'}</span>
            </div>
          </div>

          <button
            onClick={exportCsv}
            disabled={sortedData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {urlStatsT?.exportCsv || 'Exportar CSV'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th
                    onClick={() => handleSort('url')}
                    className="text-left px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center gap-2">
                      URL
                      <SortIcon field="url" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('total')}
                    className="text-right px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center justify-end gap-2">
                      Total
                      <SortIcon field="total" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('acceptAll')}
                    className="text-right px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-green-600">{urlStatsT?.acceptAll || 'Aceptar'}</span>
                      <SortIcon field="acceptAll" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('rejectAll')}
                    className="text-right px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-red-600">{urlStatsT?.rejectAll || 'Rechazar'}</span>
                      <SortIcon field="rejectAll" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customize')}
                    className="text-right px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-amber-600">{urlStatsT?.customize || 'Personalizar'}</span>
                      <SortIcon field="customize" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('lastEvent')}
                    className="text-right px-4 py-3 text-sm font-semibold text-stone-700 cursor-pointer hover:bg-stone-100"
                  >
                    <div className="flex items-center justify-end gap-2">
                      {urlStatsT?.lastEvent || 'Último evento'}
                      <SortIcon field="lastEvent" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-stone-500">
                      <Link2 size={40} className="mx-auto mb-3 text-stone-300" />
                      <p className="font-medium">{urlStatsT?.noData || 'Sin datos'}</p>
                      <p className="text-sm">{urlStatsT?.noDataMessage || 'No hay eventos de consentimiento en este período'}</p>
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row, idx) => (
                    <tr
                      key={row.url}
                      className={`border-b border-stone-100 hover:bg-stone-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/30'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-md truncate text-sm text-stone-700" title={row.url}>
                          {row.url}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-stone-800">
                        {row.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600">
                        {row.acceptAll.toLocaleString()}
                        {row.total > 0 && (
                          <span className="text-stone-400 ml-1">
                            ({((row.acceptAll / row.total) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-red-600">
                        {row.rejectAll.toLocaleString()}
                        {row.total > 0 && (
                          <span className="text-stone-400 ml-1">
                            ({((row.rejectAll / row.total) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-amber-600">
                        {(row.customize + row.update).toLocaleString()}
                        {row.total > 0 && (
                          <span className="text-stone-400 ml-1">
                            ({(((row.customize + row.update) / row.total) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-stone-500">
                        {row.lastEvent.toLocaleDateString(language, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        {sortedData.length > 0 && (
          <p className="text-sm text-stone-400 text-center">
            {urlStatsT?.showing || 'Mostrando'} {sortedData.length} {urlStatsT?.uniqueUrls || 'URLs únicas'}
          </p>
        )}
      </div>
    </Layout>
  );
}
