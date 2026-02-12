/**
 * GTM Gateway Configuration Panel
 *
 * Panel para activar/desactivar GTM Gateway en un sitio.
 * Muestra estado en tiempo real del DNS y certificado SSL.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Globe,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface GTMGatewayStatus {
  enabled: boolean;
  status: 'not_configured' | 'dns_pending' | 'dns_configured' | 'cert_provisioning' | 'cert_active' | 'cert_failed' | 'error';
  domain?: string;
  dnsChecks?: {
    lastCheck: string | null;
    resolves: boolean;
    isCNAME: boolean;
    pointsToGateway: boolean;
  };
  certificate?: {
    name: string;
    state: string;
    lastCheck: string | null;
  };
  updatedAt?: string | null;
}

interface GTMGatewayPanelProps {
  siteId: string;
  siteName: string;
  currentDomain?: string;
  onClose?: () => void;
}

const GATEWAY_DOMAIN = 'gtm-gateway.esbilla.com';

export default function GTMGatewayPanel({ siteId, siteName, currentDomain, onClose }: GTMGatewayPanelProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<GTMGatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [customDomain, setCustomDomain] = useState(currentDomain || '');
  const [error, setError] = useState<string | null>(null);
  const [copiedDNS, setCopiedDNS] = useState(false);

  // Polling del estado cada 10 segundos
  useEffect(() => {
    if (!siteId) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll cada 10s

    return () => clearInterval(interval);
  }, [siteId]);

  async function fetchStatus() {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const response = await fetch(`/api/gtm-gateway/status/${siteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Error fetching GTM Gateway status:', err);
    } finally {
      setLoading(false);
    }
  }

  async function enableGTMGateway() {
    if (!customDomain) {
      setError('Por favor introduce un dominio');
      return;
    }

    // Validar formato de dominio
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(customDomain)) {
      setError('Formato de dominio inválido. Ejemplo: gtm.tudominio.com');
      return;
    }

    setEnabling(true);
    setError(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('No autenticado');
        return;
      }

      const response = await fetch('/api/gtm-gateway/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId,
          domain: customDomain
        })
      });

      if (response.ok) {
        await response.json(); // Consumir respuesta
        await fetchStatus(); // Refrescar estado
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error activando GTM Gateway');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setEnabling(false);
    }
  }

  async function disableGTMGateway() {
    if (!confirm('¿Estás seguro de que quieres desactivar GTM Gateway? Se eliminarán el certificado SSL y la configuración.')) {
      return;
    }

    setDisabling(true);
    setError(null);

    try {
      const token = await user?.getIdToken();
      if (!token) {
        setError('No autenticado');
        return;
      }

      const response = await fetch(`/api/gtm-gateway/disable/${siteId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchStatus(); // Refrescar estado
        setCustomDomain('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error desactivando GTM Gateway');
      }
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setDisabling(false);
    }
  }

  function copyDNSConfig() {
    const subdomain = customDomain?.split('.')[0] || 'gtm';
    const dnsConfig = `Tipo: CNAME\nHost: ${subdomain}\nValor: ${GATEWAY_DOMAIN}`;
    navigator.clipboard.writeText(dnsConfig);
    setCopiedDNS(true);
    setTimeout(() => setCopiedDNS(false), 2000);
  }

  function getStatusBadge() {
    if (!status || !status.enabled) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Desactivado</span>;
    }

    switch (status.status) {
      case 'dns_pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Esperando DNS
        </span>;
      case 'dns_configured':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          DNS Configurado
        </span>;
      case 'cert_provisioning':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          Provisionando SSL (15-30 min)
        </span>;
      case 'cert_active':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Activo
        </span>;
      case 'cert_failed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Error
        </span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Desconocido</span>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-[#FFBF00]" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFBF00] rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#3D2B1F]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#3D2B1F]">GTM Gateway</h2>
            <p className="text-sm text-gray-600">{siteName}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Explicación */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">¿Qué es GTM Gateway?</p>
            <p className="text-blue-800">
              Carga Google Tag Manager desde tu propio dominio en lugar de googletagmanager.com.
              Evita ad blockers, mejora la privacidad de tus usuarios y cumple con GDPR.
            </p>
          </div>
        </div>
      </div>

      {/* Estado: No configurado */}
      {!status?.enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dominio personalizado
            </label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="gtm.tudominio.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent"
              disabled={enabling}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: gtm.tudominio.com, track.tudominio.com, analytics.tudominio.com
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={enableGTMGateway}
            disabled={enabling || !customDomain}
            className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-[#3D2B1F] font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {enabling ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Activar GTM Gateway
              </>
            )}
          </button>
        </div>
      )}

      {/* Estado: Configurado */}
      {status?.enabled && (
        <div className="space-y-6">
          {/* Dominio actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dominio configurado
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={status.domain}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <a
                href={`https://${status.domain}/gtm.js?id=GTM-XXXXX`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Estado DNS */}
          {status.dnsChecks && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Estado DNS</h3>
                {status.dnsChecks.resolves ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Resolución DNS</span>
                  <span className={status.dnsChecks.resolves ? 'text-green-600' : 'text-red-600'}>
                    {status.dnsChecks.resolves ? '✓ Resuelve' : '✗ No resuelve'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tipo de registro</span>
                  <span className={status.dnsChecks.isCNAME ? 'text-green-600' : 'text-yellow-600'}>
                    {status.dnsChecks.isCNAME ? 'CNAME (recomendado)' : 'A record'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Apunta a gateway</span>
                  <span className={status.dnsChecks.pointsToGateway ? 'text-green-600' : 'text-red-600'}>
                    {status.dnsChecks.pointsToGateway ? `✓ ${GATEWAY_DOMAIN}` : '✗ Destino incorrecto'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Estado Certificado */}
          {status.certificate && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Certificado SSL</h3>
                {status.certificate.state === 'ACTIVE' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : status.certificate.state === 'FAILED' ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado</span>
                  <span className={
                    status.certificate.state === 'ACTIVE' ? 'text-green-600' :
                    status.certificate.state === 'FAILED' ? 'text-red-600' :
                    'text-blue-600'
                  }>
                    {status.certificate.state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nombre</span>
                  <span className="text-gray-900 font-mono text-xs">{status.certificate.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones DNS */}
          {status.status === 'dns_pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 mb-2">Configura tu DNS</p>
                  <p className="text-sm text-yellow-800 mb-3">
                    Añade este registro CNAME en tu proveedor DNS (Cloudflare, Google Domains, etc.):
                  </p>
                  <div className="bg-white border border-yellow-300 rounded p-3 font-mono text-sm space-y-1">
                    <div><span className="text-gray-600">Tipo:</span> <span className="font-bold">CNAME</span></div>
                    <div><span className="text-gray-600">Host:</span> <span className="font-bold">{status.domain?.split('.')[0]}</span></div>
                    <div><span className="text-gray-600">Valor:</span> <span className="font-bold">{GATEWAY_DOMAIN}</span></div>
                  </div>
                  <button
                    onClick={copyDNSConfig}
                    className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedDNS ? '✓ Copiado' : 'Copiar configuración'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Provisioning en curso */}
          {status.status === 'cert_provisioning' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Provisionando certificado SSL...</p>
                  <p className="text-sm text-blue-800">
                    Google está validando tu dominio y emitiendo el certificado SSL.
                    Esto puede tardar 15-30 minutos. El estado se actualizará automáticamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Certificado activo */}
          {status.status === 'cert_active' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 mb-2">¡GTM Gateway activo!</p>
                  <p className="text-sm text-green-800 mb-3">
                    Ya puedes usar tu dominio personalizado para cargar Google Tag Manager:
                  </p>
                  <div className="bg-white border border-green-300 rounded p-3 font-mono text-xs overflow-x-auto">
                    {`<script src="https://${status.domain}/gtm.js?id=GTM-XXXXX"></script>`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón desactivar */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={disableGTMGateway}
              disabled={disabling}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {disabling ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Desactivando...
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Desactivar GTM Gateway
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      {onClose && (
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
