# Setup GTM Gateway Infrastructure (Windows PowerShell)
#
# Este script configura la infraestructura de Google Cloud para el GTM Gateway:
# 1. Cloud Load Balancer
# 2. Certificate Manager
# 3. Serverless NEG (Network Endpoint Group)
# 4. Backend Service
# 5. URL Map
# 6. Target HTTPS Proxy
# 7. Global Forwarding Rule
# 8. Certificate Map
#
# Requisitos:
# - Google Cloud SDK instalado (gcloud)
# - Proyecto GCP configurado
# - Permisos: Compute Admin, Certificate Manager Admin
# - Cloud Run service "esbilla-api" ya desplegado

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:GCLOUD_PROJECT,

    [Parameter(Mandatory=$false)]
    [string]$Region = "europe-west4",

    [Parameter(Mandatory=$false)]
    [string]$CloudRunService = "esbilla-api"
)

# Colores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "[SETUP] Configurando GTM Gateway Infrastructure..."
Write-Info ""

# Verificar que gcloud está instalado
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Error: Google Cloud SDK no está instalado"
    Write-Info "Descarga e instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Verificar proyecto
if (-not $ProjectId) {
    Write-Error "❌ Error: No se especificó PROJECT_ID"
    Write-Info "Uso: .\setup-gtm-gateway.ps1 -ProjectId tu-proyecto-id"
    exit 1
}

Write-Info "[CONFIG] Configuración:"
Write-Info "   Proyecto: $ProjectId"
Write-Info "   Región: $Region"
Write-Info "   Cloud Run Service: $CloudRunService"
Write-Info ""

# Configurar proyecto activo
gcloud config set project $ProjectId

# Variables
$LB_NAME = "gtm-gateway-lb"
$BACKEND_SERVICE_NAME = "gtm-gateway-backend"
$NEG_NAME = "gtm-gateway-neg"
$URL_MAP_NAME = "gtm-gateway-url-map"
$HTTPS_PROXY_NAME = "gtm-gateway-https-proxy"
$FORWARDING_RULE_NAME = "gtm-gateway-forwarding-rule"
$CERT_MAP_NAME = "gtm-gateway-cert-map"
$IP_NAME = "gtm-gateway-ip"

Write-Info "[PASO] Paso 1: Habilitar APIs necesarias..."
gcloud services enable compute.googleapis.com
gcloud services enable certificatemanager.googleapis.com
gcloud services enable run.googleapis.com
Write-Success "✅ APIs habilitadas"
Write-Info ""

Write-Info "[PASO] Paso 2: Reservar IP global estática..."
try {
    $existingIp = gcloud compute addresses describe $IP_NAME --global --format="get(address)" 2>$null
    if ($existingIp) {
        Write-Warning "⚠️  IP $IP_NAME ya existe: $existingIp"
    }
} catch {
    gcloud compute addresses create $IP_NAME --global
    Start-Sleep -Seconds 2
}

$GLOBAL_IP = gcloud compute addresses describe $IP_NAME --global --format="get(address)"
Write-Success "✅ IP global reservada: $GLOBAL_IP"
Write-Info ""

Write-Info "[INFO] IMPORTANTE: Configura este registro DNS para cada dominio de cliente:"
Write-Info "   Tipo: A"
Write-Info "   Host: gtm (o el subdominio que elijas)"
Write-Info "   Valor: $GLOBAL_IP"
Write-Info "   Ejemplo: gtm.clicaonline.com → $GLOBAL_IP"
Write-Info ""
Read-Host "Presiona Enter cuando hayas configurado al menos un dominio DNS"

Write-Info "[PASO] Paso 3: Crear Serverless NEG para Cloud Run..."
try {
    gcloud compute network-endpoint-groups describe $NEG_NAME --region=$Region --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  NEG $NEG_NAME ya existe, saltando..."
} catch {
    gcloud compute network-endpoint-groups create $NEG_NAME `
        --region=$Region `
        --network-endpoint-type=serverless `
        --cloud-run-service=$CloudRunService
    Write-Success "✅ NEG creado"
}
Write-Info ""

Write-Info "[PASO]  Paso 4: Crear Backend Service..."
try {
    gcloud compute backend-services describe $BACKEND_SERVICE_NAME --global --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  Backend Service $BACKEND_SERVICE_NAME ya existe, saltando..."
} catch {
    gcloud compute backend-services create $BACKEND_SERVICE_NAME `
        --global `
        --load-balancing-scheme=EXTERNAL_MANAGED `
        --protocol=HTTPS

    gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME `
        --global `
        --network-endpoint-group=$NEG_NAME `
        --network-endpoint-group-region=$Region

    Write-Success "✅ Backend Service creado"
}
Write-Info ""

Write-Info "[PASO]  Paso 5: Crear URL Map..."
try {
    gcloud compute url-maps describe $URL_MAP_NAME --global --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  URL Map $URL_MAP_NAME ya existe, actualizando..."
} catch {
    gcloud compute url-maps create $URL_MAP_NAME `
        --default-service=$BACKEND_SERVICE_NAME `
        --global
    Write-Success "✅ URL Map creado"
}
Write-Info ""

Write-Info "[PASO] Paso 6: Crear Certificate Map..."
try {
    gcloud certificate-manager maps describe $CERT_MAP_NAME --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  Certificate Map $CERT_MAP_NAME ya existe"
} catch {
    gcloud certificate-manager maps create $CERT_MAP_NAME `
        --description="Certificate map for GTM Gateway multi-domain SSL"
    Write-Success "✅ Certificate Map creado"
}
Write-Info ""

Write-Info "[PASO] Paso 7: Crear Target HTTPS Proxy..."
try {
    gcloud compute target-https-proxies describe $HTTPS_PROXY_NAME --global --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  HTTPS Proxy $HTTPS_PROXY_NAME ya existe, saltando..."
} catch {
    gcloud compute target-https-proxies create $HTTPS_PROXY_NAME `
        --url-map=$URL_MAP_NAME `
        --certificate-map="//certificatemanager.googleapis.com/projects/$ProjectId/locations/global/certificateMaps/$CERT_MAP_NAME" `
        --global
    Write-Success "✅ Target HTTPS Proxy creado"
}
Write-Info ""

Write-Info "[PASO] Paso 8: Crear Global Forwarding Rule..."
try {
    gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME --global --format="get(name)" 2>$null | Out-Null
    Write-Warning "⚠️  Forwarding Rule $FORWARDING_RULE_NAME ya existe, saltando..."
} catch {
    gcloud compute forwarding-rules create $FORWARDING_RULE_NAME `
        --global `
        --load-balancing-scheme=EXTERNAL_MANAGED `
        --network-tier=PREMIUM `
        --address=$IP_NAME `
        --target-https-proxy=$HTTPS_PROXY_NAME `
        --ports=443
    Write-Success "✅ Forwarding Rule creado"
}
Write-Info ""

Write-Info ""
Write-Success "✅ Infraestructura GTM Gateway configurada correctamente!"
Write-Info ""
Write-Info "[CONFIG] Resumen:"
Write-Info "   IP Global: $GLOBAL_IP"
Write-Info "   Load Balancer: $LB_NAME"
Write-Info "   Backend: Cloud Run service '$CloudRunService'"
Write-Info "   Certificate Map: $CERT_MAP_NAME"
Write-Info ""
Write-Info "[SETUP] Próximos pasos:"
Write-Info "   1. Añadir dominios de clientes con: .\add-client-domain.ps1 -Domain gtm.cliente.com"
Write-Info "   2. Configurar gtmGatewayDomain en Dashboard para cada site"
Write-Info "   3. Los certificados SSL se provisionarán automáticamente (15-30 min)"
Write-Info ""
Write-Info "[INFO] Verificar estado:"
Write-Info "   gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME --global"
Write-Info "   gcloud certificate-manager maps entries list --map=$CERT_MAP_NAME"
Write-Info ""
Write-Info "Costos estimados para 100 clientes:"
Write-Info "   - Load Balancer: USD 18/mes"
Write-Info "   - Forwarding Rule: USD 18/mes"
Write-Info "   - Egress 5GB por cliente: USD 50/mes"
Write-Info "   - Certificados SSL: Gratis - Let's Encrypt via Google"
Write-Info "   TOTAL: Aprox USD 86/mes base + USD 0.50/GB egress adicional"
Write-Info ""
Write-Success "Listo!"
