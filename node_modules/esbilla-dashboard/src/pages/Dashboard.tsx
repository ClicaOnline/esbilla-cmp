//esbilla-cmp/esbilla-dashboard/src/pages/dashboard.tsx
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
import {
  TrendingUp, TrendingDown, CheckCircle, XCircle, Settings, Eye,
  Globe2, Calendar, RefreshCw, AlertCircle, Languages, Monitor,
  Smartphone, Tablet, MousePointer
} from 'lucide-react';

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

interface BreakdownItem {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

interface SourceAcceptanceItem {
  source: string;
  total: number;
  accepted: number;
  rejected: number;
  customized: number;
  acceptanceRate: number;
}

// Colores para gráficos
const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];
const BROWSER_COLORS: Record<string, string> = {
  'Chrome': '#4285F4',
  'Firefox': '#FF7139',
  'Safari': '#000000',
  'Edge': '#0078D7',
  'Opera': '#FF1B2D',
  'Samsung': '#1428A0',
  'Otros': '#9ca3af'
};
const OS_COLORS: Record<string, string> = {
  'Windows': '#0078D4',
  'macOS': '#555555',
  'iOS': '#000000',
  'Android': '#3DDC84',
  'Linux': '#FCC624',
  'Otros': '#9ca3af'
};
const ACTION_COLORS: Record<string, string> = {
  'accept_all': '#22c55e',
  'reject_all': '#ef4444',
  'customize': '#f59e0b',
  'update': '#3b82f6'
};
const SOURCE_COLORS: Record<string, string> = {
  'google': '#4285F4',
  'facebook': '#1877F2',
  'twitter': '#1DA1F2',
  'instagram': '#E4405F',
  'linkedin': '#0A66C2',
  'tiktok': '#000000',
  'youtube': '#FF0000',
  'bing': '#008373',
  'organic': '#22c55e',
  'direct': '#6b7280',
  'email': '#f59e0b',
  'referral': '#8b5cf6',
  'unknown': '#9ca3af'
};
const LANG_COLORS: Record<string, string> = {
  'es': '#DC2626',
  'en': '#1D4ED8',
  'ast': '#059669',
  'fr': '#2563EB',
  'pt': '#16A34A',
  'de': '#000000',
  'it': '#16A34A',
  'ca': '#DC2626',
  'eu': '#DC2626',
  'gl': '#2563EB'
};

// ============================================
// PARSEO DE USER AGENT
// ============================================
function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  if (!ua) return { browser: 'Desconocido', os: 'Desconocido', deviceType: 'desktop' };

  // Detectar navegador
  let browser = 'Otros';
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  // Detectar sistema operativo
  let os = 'Otros';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') && !ua.includes('iPhone') && !ua.includes('iPad')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Linux')) os = 'Linux';

  // Detectar tipo de dispositivo
  let deviceType = 'desktop';
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
    if (ua.includes('iPad') || ua.includes('Tablet')) {
      deviceType = 'tablet';
    } else {
      deviceType = 'mobile';
    }
  }

  return { browser, os, deviceType };
}

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

  // Nuevas estadísticas
  const [languageStats, setLanguageStats] = useState<BreakdownItem[]>([]);
  const [domainStats, setDomainStats] = useState<BreakdownItem[]>([]);
  const [actionStats, setActionStats] = useState<BreakdownItem[]>([]);
  const [browserStats, setBrowserStats] = useState<BreakdownItem[]>([]);
  const [osStats, setOsStats] = useState<BreakdownItem[]>([]);
  const [deviceStats, setDeviceStats] = useState<BreakdownItem[]>([]);
  const [sourceStats, setSourceStats] = useState<BreakdownItem[]>([]);
  const [sourceAcceptance, setSourceAcceptance] = useState<SourceAcceptanceItem[]>([]);

  // Filtros adicionales
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedBrowser, setSelectedBrowser] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Date range state
  const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  useEffect(() => {
    loadSites();
  }, []);

  useEffect(() => {
    loadStats();
  }, [selectedSiteId, datePreset, customStartDate, customEndDate, selectedLanguage, selectedBrowser, selectedSource]);

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

      let total = 0;
      let accepted = 0;
      let rejected = 0;
      let customized = 0;
      let today = 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailyMap = new Map<string, { total: number; accepted: number; rejected: number }>();

      // Mapas para estadísticas adicionales
      const langMap = new Map<string, number>();
      const domainMap = new Map<string, number>();
      const actionMap = new Map<string, number>();
      const browserMap = new Map<string, number>();
      const osMap = new Map<string, number>();
      const deviceMap = new Map<string, number>();
      const sourceMap = new Map<string, number>();
      // Mapa para ratio de aceptación por fuente: source -> {total, accepted, rejected, customized}
      const sourceAcceptanceMap = new Map<string, { total: number; accepted: number; rejected: number; customized: number }>();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Extraer datos para filtrado
        const lang = data.metadata?.language || 'unknown';
        const ua = data.userAgent || '';
        const { browser } = parseUserAgent(ua);
        const attribution = data.attribution;
        const source = attribution?.utm_source || (attribution ? 'paid' : 'organic');

        // Aplicar filtros del cliente (post-query filtering)
        if (selectedLanguage !== 'all' && lang !== selectedLanguage) return;
        if (selectedBrowser !== 'all' && browser !== selectedBrowser) return;
        if (selectedSource !== 'all' && source !== selectedSource) return;

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

        // Estadísticas por idioma
        langMap.set(lang, (langMap.get(lang) || 0) + 1);

        // Estadísticas por dominio
        const domain = data.metadata?.domain || 'unknown';
        domainMap.set(domain, (domainMap.get(domain) || 0) + 1);

        // Estadísticas por acción
        const action = data.action || 'unknown';
        actionMap.set(action, (actionMap.get(action) || 0) + 1);

        // Estadísticas por navegador, SO y dispositivo
        const { os, deviceType } = parseUserAgent(ua);
        browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
        osMap.set(os, (osMap.get(os) || 0) + 1);
        deviceMap.set(deviceType, (deviceMap.get(deviceType) || 0) + 1);

        // Estadísticas por fuente de tráfico
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

        // Ratio de aceptación por fuente
        const sourceData = sourceAcceptanceMap.get(source) || { total: 0, accepted: 0, rejected: 0, customized: 0 };
        sourceData.total++;
        if (isAccepted) sourceData.accepted++;
        else if (isRejected) sourceData.rejected++;
        else sourceData.customized++;
        sourceAcceptanceMap.set(source, sourceData);
      });

      // Calcular tendencia
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

      // Preparar datos diarios
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

      // Convertir mapas a arrays ordenados
      const toBreakdown = (map: Map<string, number>, colorMap?: Record<string, string>): BreakdownItem[] => {
        return Array.from(map.entries())
          .map(([name, value]) => ({
            name,
            value,
            percentage: total > 0 ? (value / total) * 100 : 0,
            color: colorMap?.[name]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10); // Top 10
      };

      setLanguageStats(toBreakdown(langMap, LANG_COLORS));
      setDomainStats(toBreakdown(domainMap));
      setActionStats(toBreakdown(actionMap, ACTION_COLORS));
      setBrowserStats(toBreakdown(browserMap, BROWSER_COLORS));
      setOsStats(toBreakdown(osMap, OS_COLORS));
      setDeviceStats(toBreakdown(deviceMap));
      setSourceStats(toBreakdown(sourceMap, SOURCE_COLORS));

      // Convertir sourceAcceptanceMap a array ordenado por total
      const sourceAcceptanceArray: SourceAcceptanceItem[] = Array.from(sourceAcceptanceMap.entries())
        .map(([source, data]) => ({
          source,
          ...data,
          acceptanceRate: data.total > 0 ? (data.accepted / data.total) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      setSourceAcceptance(sourceAcceptanceArray);

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

            {/* Language filter */}
            {languageStats.length > 0 && (
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
                title="Filtrar por idioma"
              >
                <option value="all">Idioma: Todos</option>
                {languageStats.map((lang) => (
                  <option key={lang.name} value={lang.name}>
                    {lang.name.toUpperCase()}
                  </option>
                ))}
              </select>
            )}

            {/* Browser filter */}
            {browserStats.length > 0 && (
              <select
                value={selectedBrowser}
                onChange={(e) => setSelectedBrowser(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
                title="Filtrar por navegador"
              >
                <option value="all">Navegador: Todos</option>
                {browserStats.map((browser) => (
                  <option key={browser.name} value={browser.name}>
                    {browser.name}
                  </option>
                ))}
              </select>
            )}

            {/* Traffic source filter */}
            {sourceStats.length > 0 && (
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500"
                title="Filtrar por fuente de tráfico"
              >
                <option value="all">Fuente: Todas</option>
                {sourceStats.map((source) => (
                  <option key={source.name} value={source.name}>
                    {source.name}
                  </option>
                ))}
              </select>
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

        {/* Charts Row 1: Area + Pie */}
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

        {/* Charts Row 2: Actions + Languages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acciones */}
          <BreakdownCard
            title="Tipo de Acción"
            icon={<MousePointer size={18} className="text-blue-500" />}
            data={actionStats}
            colorMap={ACTION_COLORS}
            labelMap={{
              'accept_all': 'Aceptar todo',
              'reject_all': 'Rechazar todo',
              'customize': 'Personalizar',
              'update': 'Actualizar'
            }}
          />

          {/* Idiomas */}
          <BreakdownCard
            title="Idiomas"
            icon={<Languages size={18} className="text-purple-500" />}
            data={languageStats}
            colorMap={LANG_COLORS}
            labelMap={{
              'es': 'Español',
              'en': 'English',
              'ast': 'Asturianu',
              'fr': 'Français',
              'pt': 'Português',
              'de': 'Deutsch',
              'it': 'Italiano',
              'unknown': 'Desconocido'
            }}
          />
        </div>

        {/* Charts Row 3: Browser + OS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Navegadores */}
          <BreakdownCard
            title="Navegadores"
            icon={<Monitor size={18} className="text-indigo-500" />}
            data={browserStats}
            colorMap={BROWSER_COLORS}
          />

          {/* Sistemas Operativos */}
          <BreakdownCard
            title="Sistemas Operativos"
            icon={<Monitor size={18} className="text-teal-500" />}
            data={osStats}
            colorMap={OS_COLORS}
          />
        </div>

        {/* Charts Row 4: Devices + Domains */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispositivos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone size={18} className="text-pink-500" />
              <h2 className="text-lg font-semibold text-stone-800">Dispositivos</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {deviceStats.map((device) => {
                const Icon = device.name === 'mobile' ? Smartphone :
                             device.name === 'tablet' ? Tablet : Monitor;
                const label = device.name === 'mobile' ? 'Móvil' :
                              device.name === 'tablet' ? 'Tablet' : 'Escritorio';
                return (
                  <div key={device.name} className="text-center p-4 bg-stone-50 rounded-lg">
                    <Icon size={32} className="mx-auto text-stone-400 mb-2" />
                    <p className="text-2xl font-bold text-stone-800">{device.percentage.toFixed(1)}%</p>
                    <p className="text-sm text-stone-500">{label}</p>
                    <p className="text-xs text-stone-400">{device.value.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dominios */}
          <BreakdownCard
            title="Dominios"
            icon={<Globe2 size={18} className="text-green-500" />}
            data={domainStats}
          />
        </div>

        {/* Charts Row 5: Traffic Sources + Acceptance by Source */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuentes de tráfico */}
          <BreakdownCard
            title="Fuentes de Tráfico"
            icon={<TrendingUp size={18} className="text-purple-500" />}
            data={sourceStats}
            colorMap={SOURCE_COLORS}
            labelMap={{
              'organic': 'Orgánico',
              'paid': 'Pago (sin UTM)',
              'direct': 'Directo',
              'google': 'Google',
              'facebook': 'Facebook',
              'twitter': 'Twitter/X',
              'instagram': 'Instagram',
              'linkedin': 'LinkedIn',
              'tiktok': 'TikTok',
              'email': 'Email',
              'referral': 'Referido',
              'unknown': 'Desconocido'
            }}
          />

          {/* Ratio de aceptación por fuente */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-green-500" />
              <h2 className="text-lg font-semibold text-stone-800">Ratio Aceptación por Fuente</h2>
            </div>
            {sourceAcceptance.length > 0 ? (
              <div className="space-y-4">
                {sourceAcceptance.map((item) => {
                  const acceptedWidth = item.total > 0 ? (item.accepted / item.total) * 100 : 0;
                  const rejectedWidth = item.total > 0 ? (item.rejected / item.total) * 100 : 0;
                  const customizedWidth = 100 - acceptedWidth - rejectedWidth;
                  return (
                    <div key={item.source}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-stone-600 capitalize">
                          {item.source === 'organic' ? 'Orgánico' :
                           item.source === 'paid' ? 'Pago' : item.source}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          {item.acceptanceRate.toFixed(1)}% aceptan
                        </span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-stone-100">
                        <div
                          className="bg-green-500 transition-all"
                          style={{ width: `${acceptedWidth}%` }}
                          title={`Aceptados: ${item.accepted}`}
                        />
                        <div
                          className="bg-amber-500 transition-all"
                          style={{ width: `${customizedWidth}%` }}
                          title={`Personalizados: ${item.customized}`}
                        />
                        <div
                          className="bg-red-500 transition-all"
                          style={{ width: `${rejectedWidth}%` }}
                          title={`Rechazados: ${item.rejected}`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-stone-400 mt-1">
                        <span>{item.total.toLocaleString()} total</span>
                        <div className="flex gap-3">
                          <span className="text-green-600">{item.accepted} ✓</span>
                          <span className="text-amber-600">{item.customized} ⚙</span>
                          <span className="text-red-600">{item.rejected} ✗</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-8">
                Sin datos de atribución. Los datos aparecerán cuando los usuarios lleguen con parámetros UTM.
              </p>
            )}
            <div className="mt-4 pt-4 border-t border-stone-100">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-green-500 rounded" /> Aceptado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-500 rounded" /> Personalizado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-500 rounded" /> Rechazado
                </span>
              </div>
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

// ============================================
// COMPONENTES AUXILIARES
// ============================================

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

interface BreakdownCardProps {
  title: string;
  icon: React.ReactNode;
  data: BreakdownItem[];
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}

function BreakdownCard({ title, icon, data, colorMap, labelMap }: BreakdownCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
      </div>
      <div className="space-y-3">
        {data.map((item) => {
          const displayName = labelMap?.[item.name] || item.name;
          const barColor = colorMap?.[item.name] || item.color || '#9ca3af';
          return (
            <div key={item.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-stone-600 truncate" title={displayName}>
                  {displayName}
                </span>
                <span className="text-sm font-medium text-stone-800 ml-2">
                  {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-stone-400 text-center py-4">Sin datos</p>
        )}
      </div>
    </div>
  );
}
