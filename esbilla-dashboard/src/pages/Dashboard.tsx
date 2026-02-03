import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Settings, Eye, Globe2, Calendar, RefreshCw, AlertCircle } from 'lucide-react';

// Date range presets
type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

interface Stats {
  total: number;
  accepted: number;
  rejected: number;
  customized: number;
  today: number;
  trend: number;
}

interface DailyData {
  date: string;
  total: number;
  accepted: number;
  rejected: number;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

// Helper to get date range from preset
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

export function DashboardPage() {
  const { t, language } = useI18n();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadStats();
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

  async function loadStats() {
    if (!db) {
      console.error('Firestore not available');
      setError('Firestore no disponible');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const consentsRef = collection(db, 'consents');

      // Calculate date range based on preset or custom dates
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

      // Build query - try simpler query first to avoid index issues
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
        // Fallback: simpler query without compound filters
        console.warn('Using fallback query:', queryErr);
        q = query(
          consentsRef,
          orderBy('createdAt', 'desc'),
          limit(1000)
        );
      }

      const snapshot = await getDocs(q);

      let total = 0;
      let accepted = 0;
      let rejected = 0;
      let customized = 0;
      let today = 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyMap = new Map<string, { total: number; accepted: number; rejected: number }>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;

        const choices = data.choices || {};
        const isAccepted = choices.analytics && choices.marketing;
        const isRejected = !choices.analytics && !choices.marketing;

        if (isAccepted) accepted++;
        else if (isRejected) rejected++;
        else customized++;

        // Contar hoy
        const createdAt = data.createdAt?.toDate?.() || new Date(data.timestamp);
        if (createdAt >= todayStart) today++;

        // Agrupar por día
        const dateKey = createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(dateKey) || { total: 0, accepted: 0, rejected: 0 };
        existing.total++;
        if (isAccepted) existing.accepted++;
        if (isRejected) existing.rejected++;
        dailyMap.set(dateKey, existing);
      });

      // Calcular tendencia (comparar con semana anterior)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      let thisWeek = 0;
      let lastWeek = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(data.timestamp);
        if (createdAt >= weekAgo) thisWeek++;
        else if (createdAt >= twoWeeksAgo) lastWeek++;
      });

      const trend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

      setStats({ total, accepted, rejected, customized, today, trend });

      // Preparar datos diarios para el gráfico
      const dailyArray: DailyData[] = [];
      const sortedDates = Array.from(dailyMap.keys()).sort();
      sortedDates.slice(-14).forEach((date) => {
        const data = dailyMap.get(date)!;
        dailyArray.push({
          date: new Date(date).toLocaleDateString(language, { day: '2-digit', month: 'short' }),
          ...data
        });
      });

      setDailyData(dailyArray);
    } catch (err: unknown) {
      console.error('Error cargando estadísticas:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';

      // Check if it's an index error
      if (errorMessage.includes('index') || (err as { code?: number })?.code === 9) {
        setError('Se requiere crear un índice en Firestore. Revisa la consola para más detalles.');
      } else {
        setError(`Error al cargar datos: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
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

  const pieData = stats ? [
    { name: t.dashboard.accepted, value: stats.accepted },
    { name: t.dashboard.rejected, value: stats.rejected },
    { name: t.dashboard.customized, value: stats.customized }
  ] : [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">{t.dashboard.title}</h1>
            <p className="text-stone-500">{t.dashboard.subtitle}</p>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range selector */}
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-1">
              <Calendar size={16} className="text-stone-400 ml-2" />
              <button
                onClick={() => setDatePreset('7d')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  datePreset === '7d'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setDatePreset('30d')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  datePreset === '30d'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setDatePreset('90d')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  datePreset === '90d'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                90 días
              </button>
              <button
                onClick={() => setDatePreset('custom')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  datePreset === 'custom'
                    ? 'bg-amber-500 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Personalizado
              </button>
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
                  <option value="all">{t.sites?.title || 'All sites'}</option>
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
              onClick={() => loadStats()}
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

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t.dashboard.totalConsents}
            value={stats?.total || 0}
            icon={<Eye className="text-blue-500" />}
            trend={stats?.trend}
            trendLabel={t.dashboard.vsLastWeek}
          />
          <StatCard
            title={t.dashboard.accepted}
            value={stats?.accepted || 0}
            icon={<CheckCircle className="text-green-500" />}
            percentage={stats ? (stats.accepted / stats.total * 100) : 0}
            color="green"
            percentLabel={t.dashboard.ofTotal}
          />
          <StatCard
            title={t.dashboard.rejected}
            value={stats?.rejected || 0}
            icon={<XCircle className="text-red-500" />}
            percentage={stats ? (stats.rejected / stats.total * 100) : 0}
            color="red"
            percentLabel={t.dashboard.ofTotal}
          />
          <StatCard
            title={t.dashboard.customized}
            value={stats?.customized || 0}
            icon={<Settings className="text-amber-500" />}
            percentage={stats ? (stats.customized / stats.total * 100) : 0}
            color="amber"
            percentLabel={t.dashboard.ofTotal}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">{t.dashboard.dailyEvolution}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    fill="#93c5fd"
                    fillOpacity={0.3}
                    name={t.dashboard.total}
                  />
                  <Area
                    type="monotone"
                    dataKey="accepted"
                    stroke="#22c55e"
                    fill="#86efac"
                    fillOpacity={0.3}
                    name={t.dashboard.accepted}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">{t.dashboard.distribution}</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-stone-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's summary */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">{t.dashboard.today}</p>
              <p className="text-4xl font-bold">{stats?.today || 0}</p>
              <p className="text-amber-100 mt-1">{t.dashboard.consentsRegistered}</p>
            </div>
            <div className="text-6xl opacity-20">🌽</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  percentage?: number;
  percentLabel?: string;
  color?: 'green' | 'red' | 'amber' | 'blue';
}

function StatCard({ title, value, icon, trend, trendLabel, percentage, percentLabel, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{title}</p>
          <p className="text-3xl font-bold text-stone-800 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="p-2 bg-stone-50 rounded-lg">{icon}</div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend >= 0 ? (
            <TrendingUp size={16} className="text-green-500" />
          ) : (
            <TrendingDown size={16} className="text-red-500" />
          )}
          <span className={`text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-sm text-stone-400">{trendLabel}</span>
        </div>
      )}

      {percentage !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                color === 'green' ? 'bg-green-500' :
                color === 'red' ? 'bg-red-500' :
                color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1">{percentage.toFixed(1)}% {percentLabel}</p>
        </div>
      )}
    </div>
  );
}
