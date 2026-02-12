# Enable Cloud CDN for GTM Gateway (Windows PowerShell)
#
# Este script habilita Google Cloud CDN en el Backend Service del GTM Gateway
# para reducir egress y mejorar latencia global.
#
# Beneficios:
# - Reduce egress de Cloud Run en ~95% (cache en 200+ PoPs globales)
# - Reduce latencia para usuarios fuera de europa-west4
# - Ahorro de costos: $0.08/GB (CDN) vs. $0.12/GB (egress directo) = 33% ahorro
#
# Requisitos:
# - Infraestructura GTM Gateway ya configurada (setup-gtm-gateway.ps1)
# - Permisos: Compute Admin

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:GCLOUD_PROJECT,

    [Parameter(Mandatory=$false)]
    [string]$BackendServiceName = "gtm-gateway-backend"
)

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "[CDN] Habilitando Cloud CDN para GTM Gateway..."
Write-Info ""

# Verificar gcloud
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Google Cloud SDK no esta instalado"
    exit 1
}

# Verificar proyecto
if (-not $ProjectId) {
    Write-Error "[ERROR] No se especifico PROJECT_ID"
    Write-Info "Uso: .\enable-cdn-gtm-gateway.ps1 -ProjectId tu-proyecto-id"
    exit 1
}

gcloud config set project $ProjectId

Write-Info "[CONFIG] Configuracion:"
Write-Info "   Proyecto: $ProjectId"
Write-Info "   Backend Service: $BackendServiceName"
Write-Info ""

# Verificar que el Backend Service existe
$existingBackend = gcloud compute backend-services describe $BackendServiceName --global --format="get(name)" 2>$null

if ($LASTEXITCODE -ne 0 -or -not $existingBackend) {
    Write-Error "[ERROR] Backend Service $BackendServiceName no existe"
    Write-Info "Ejecuta primero: .\setup-gtm-gateway.ps1"
    exit 1
}

Write-Success "[OK] Backend Service encontrado: $BackendServiceName"
Write-Info ""

Write-Info "[PASO] Paso 1: Habilitar Cloud CDN en Backend Service..."

# Habilitar Cloud CDN con configuracion optimizada para gtm.js
gcloud compute backend-services update $BackendServiceName `
    --enable-cdn `
    --cache-mode=CACHE_ALL_STATIC `
    --default-ttl=3600 `
    --max-ttl=86400 `
    --client-ttl=3600 `
    --global

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] No se pudo habilitar Cloud CDN"
    exit 1
}

Write-Success "[OK] Cloud CDN habilitado!"
Write-Info ""

Write-Info "[PASO] Paso 2: Verificar configuracion..."

# Obtener estado de CDN
$cdnEnabled = gcloud compute backend-services describe $BackendServiceName --global --format="get(enableCDN)"
$cacheMode = gcloud compute backend-services describe $BackendServiceName --global --format="get(cdnPolicy.cacheMode)"

if ($cdnEnabled -eq "True") {
    Write-Success "[OK] CDN Status: ENABLED"
    Write-Info "   Cache Mode: $cacheMode"
    Write-Info "   Default TTL: 3600s (1 hora)"
    Write-Info "   Max TTL: 31536000s (1 ano)"
    Write-Info "   Client TTL: 31536000s (1 ano)"
} else {
    Write-Warning "[WARN] CDN no esta habilitado correctamente"
}

Write-Info ""
Write-Success "[OK] Cloud CDN configurado correctamente!"
Write-Info ""
Write-Info "[INFO] Proximos pasos:"
Write-Info "   1. Esperar 5-10 minutos para que CDN se propague globalmente"
Write-Info "   2. Probar con: curl -I https://gtm.cliente.com/gtm.js?id=GTM-XXX"
Write-Info "   3. Verificar header X-Cache: HIT (desde CDN) o MISS (desde Cloud Run)"
Write-Info ""
Write-Info "[BENEFICIOS] Con Cloud CDN habilitado:"
Write-Info "   - Egress reducido en ~95% (solo cache misses van a Cloud Run)"
Write-Info "   - Latencia global mejorada (200+ PoPs de Google)"
Write-Info "   - Ahorro de costos: ~33% en egress"
Write-Info ""
Write-Info "[COSTOS] Estimados para 100 clientes:"
Write-Info "   ANTES (sin CDN):"
Write-Info "   - Egress 500GB/mes × $0.12/GB = $60/mes"
Write-Info ""
Write-Info "   DESPUES (con CDN, 95% cache hit rate):"
Write-Info "   - Egress 25GB/mes × $0.12/GB = $3/mes (Cloud Run)"
Write-Info "   - CDN cache hit 475GB × $0.08/GB = $38/mes (CDN)"
Write-Info "   - TOTAL: $41/mes (ahorro de $19/mes = 32%)"
Write-Info ""
Write-Info "[MONITORING] Verificar metricas de CDN:"
Write-Info "   gcloud compute backend-services describe $BackendServiceName --global"
Write-Info ""
Write-Info "[LOGS] Ver logs de CDN:"
Write-Info "   gcloud logging read 'resource.type=http_load_balancer' --limit=50"
Write-Info ""
Write-Success "Listo! Esbilla CMP"
