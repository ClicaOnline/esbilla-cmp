import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import type { Site } from '../types';
import { Search, Download, CheckCircle, XCircle, Settings, Calendar, Globe, Monitor, Globe2, Link } from 'lucide-react';

interface ConsentRecord {
  id: string;
  siteId: string;
  siteName?: string;
  footprintId: string;
  choices: {
    analytics: boolean;
    marketing: boolean;
  };
  action?: string;
  metadata?: {
    domain?: string;
    pageUrl?: string;
    language?: string;
    sdkVersion?: string;
  };
  timestamp: string;
  userAgent: string;
  lang: string;
  createdAt: Date;
}

export function FootprintPage() {
  const { t, language } = useI18n();
  const { isAdmin } = useAuth();
  const [searchId, setSearchId] = useState('');
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');

  useEffect(() => {
    loadSites();
  }, []);

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

  function getSiteName(siteId: string): string {
    const site = sites.find(s => s.id === siteId);
    return site?.name || siteId;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setSearched(true);

    if (!db) {
      console.error('Firestore not available');
      setLoading(false);
      return;
    }

    try {
      const consentsRef = collection(db, 'consents');

      // Buscar por footprintId exacto o parcial (comienza con)
      const normalizedId = searchId.trim().toUpperCase();

      // Build query - note: Firestore doesn't support multiple range filters
      // so we filter by site client-side if needed
      const q = query(
        consentsRef,
        where('footprintId', '>=', normalizedId),
        where('footprintId', '<=', normalizedId + '\uf8ff'),
        orderBy('footprintId'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);

      const results: ConsentRecord[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const siteId = data.siteId || data.cmpId;

        // Filter by site if selected
        if (selectedSiteId !== 'all' && siteId !== selectedSiteId) {
          return;
        }

        results.push({
          id: doc.id,
          siteId: siteId,
          siteName: getSiteName(siteId),
          footprintId: data.footprintId,
          choices: data.choices,
          action: data.action,
          metadata: data.metadata,
          timestamp: data.timestamp,
          userAgent: data.metadata?.userAgent || data.userAgent,
          lang: data.metadata?.language || data.lang || 'es',
          createdAt: data.createdAt?.toDate?.() || new Date(data.timestamp)
        });
      });

      // Ordenar por fecha más reciente
      results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setRecords(results);
    } catch (err) {
      console.error('Error buscando:', err);
    } finally {
      setLoading(false);
    }
  }

  function exportToJSON() {
    const data = {
      footprintId: searchId,
      exportDate: new Date().toISOString(),
      totalRecords: records.length,
      records: records.map(r => ({
        timestamp: r.timestamp,
        site: r.cmpId,
        choices: r.choices,
        language: r.lang
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esbilla-consent-${searchId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getConsentType(choices: { analytics: boolean; marketing: boolean }) {
    if (choices.analytics && choices.marketing) return 'accepted';
    if (!choices.analytics && !choices.marketing) return 'rejected';
    return 'customized';
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t.footprint.title}</h1>
          <p className="text-stone-500">
            {t.footprint.subtitle}
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder={t.footprint.searchPlaceholder}
              className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {/* Site filter */}
          {isAdmin && sites.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe2 size={18} className="text-stone-400" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="px-3 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t.common.searching : t.common.search}
          </button>
        </form>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>{t.footprint.whatIsFootprint}</strong><br />
            {t.footprint.footprintExplanation}
          </p>
        </div>

        {/* Results */}
        {searched && (
          <>
            {records.length > 0 ? (
              <div className="space-y-4">
                {/* Results header */}
                <div className="flex items-center justify-between">
                  <p className="text-stone-600">
                    {t.footprint.recordsFound} <strong>{records.length}</strong> {t.footprint.records}
                  </p>
                  <button
                    onClick={exportToJSON}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <Download size={16} />
                    {t.footprint.exportJSON}
                  </button>
                </div>

                {/* Records list */}
                <div className="space-y-3">
                  {records.map((record) => {
                    const type = getConsentType(record.choices);

                    return (
                      <div
                        key={record.id}
                        className="bg-white rounded-xl p-5 shadow-sm border border-stone-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {type === 'accepted' && (
                              <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="text-green-600" size={20} />
                              </div>
                            )}
                            {type === 'rejected' && (
                              <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="text-red-600" size={20} />
                              </div>
                            )}
                            {type === 'customized' && (
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <Settings className="text-amber-600" size={20} />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-stone-800">
                                {type === 'accepted' && t.footprint.allAccepted}
                                {type === 'rejected' && t.footprint.allRejected}
                                {type === 'customized' && t.footprint.customized}
                              </p>
                              <p className="text-sm text-stone-500">{t.footprint.site}: {record.siteName || record.siteId}</p>
                              {record.metadata?.domain && (
                                <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                                  <Link size={10} />
                                  {record.metadata.domain}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium text-stone-800">
                              {record.createdAt.toLocaleDateString(language, {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-stone-400">
                              {record.createdAt.toLocaleTimeString(language, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-stone-500">
                            <Calendar size={14} />
                            <span>{t.footprint.analytics}: {record.choices.analytics ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500">
                            <Calendar size={14} />
                            <span>{t.footprint.marketing}: {record.choices.marketing ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500">
                            <Globe size={14} />
                            <span>{t.footprint.language}: {record.lang.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 truncate">
                            <Monitor size={14} />
                            <span className="truncate" title={record.userAgent}>
                              {parseUserAgent(record.userAgent, t.common.unknown)}
                            </span>
                          </div>
                        </div>

                        {/* Footprint ID */}
                        <div className="mt-3 pt-3 border-t border-stone-100">
                          <code className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600">
                            ID: {record.footprintId}
                          </code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                  {t.footprint.noRecords}
                </h3>
                <p className="text-stone-500">
                  {t.footprint.noRecordsMessage}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function parseUserAgent(ua: string, unknownLabel: string): string {
  if (!ua || ua === 'unknown') return unknownLabel;

  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';

  return 'Browser';
}
