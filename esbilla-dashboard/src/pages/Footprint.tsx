import { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { Search, Download, CheckCircle, XCircle, Settings, Calendar, Globe, Monitor } from 'lucide-react';

interface ConsentRecord {
  id: string;
  cmpId: string;
  footprintId: string;
  choices: {
    analytics: boolean;
    marketing: boolean;
  };
  timestamp: string;
  userAgent: string;
  lang: string;
  createdAt: Date;
}

export function FootprintPage() {
  const [searchId, setSearchId] = useState('');
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const consentsRef = collection(db, 'consents');

      // Buscar por footprintId exacto o parcial (comienza con)
      const normalizedId = searchId.trim().toUpperCase();

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
        results.push({
          id: doc.id,
          cmpId: data.cmpId,
          footprintId: data.footprintId,
          choices: data.choices,
          timestamp: data.timestamp,
          userAgent: data.userAgent,
          lang: data.lang || 'es',
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
          <h1 className="text-2xl font-bold text-stone-800">Buscar por Footprint</h1>
          <p className="text-stone-500">
            Busca el historial de consentimiento de un usuario por su ID de footprint
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Ej: ESB-A7F3B2C1 o parte del ID..."
              className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>¿Qué es el Footprint ID?</strong><br />
            Es un identificador único generado para cada navegador/dispositivo. Los usuarios pueden
            encontrar su ID en el banner de cookies al hacer clic en "Personalizar". Este ID permite
            ejercer los derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).
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
                    Se encontraron <strong>{records.length}</strong> registros
                  </p>
                  <button
                    onClick={exportToJSON}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
                  >
                    <Download size={16} />
                    Exportar JSON
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
                                {type === 'accepted' && 'Todas aceptadas'}
                                {type === 'rejected' && 'Todas rechazadas'}
                                {type === 'customized' && 'Personalizado'}
                              </p>
                              <p className="text-sm text-stone-500">Sitio: {record.cmpId}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-medium text-stone-800">
                              {record.createdAt.toLocaleDateString('es', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-stone-400">
                              {record.createdAt.toLocaleTimeString('es', {
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
                            <span>Analíticas: {record.choices.analytics ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500">
                            <Calendar size={14} />
                            <span>Marketing: {record.choices.marketing ? '✓' : '✗'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500">
                            <Globe size={14} />
                            <span>Idioma: {record.lang.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-stone-500 truncate">
                            <Monitor size={14} />
                            <span className="truncate" title={record.userAgent}>
                              {parseUserAgent(record.userAgent)}
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
                  No se encontraron registros
                </h3>
                <p className="text-stone-500">
                  No hay consentimientos registrados con ese ID de footprint
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function parseUserAgent(ua: string): string {
  if (!ua || ua === 'unknown') return 'Desconocido';

  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';

  return 'Navegador';
}
