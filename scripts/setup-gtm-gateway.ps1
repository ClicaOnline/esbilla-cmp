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
Write-Info "   Region: $Region"
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

Write-Info "[PASO] Paso 2: Reservar IP global estatica..."

# Intentar obtener IP existente
$existingIp = gcloud compute addresses describe $IP_NAME --global --format="get(address)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingIp) {
    # IP ya existe
    $GLOBAL_IP = $existingIp
    Write-Warning "[INFO] IP $IP_NAME ya existe: $GLOBAL_IP"
} else {
    # Crear nueva IP
    Write-Info "Creando nueva IP global..."
    gcloud compute addresses create $IP_NAME --global --quiet

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear la IP global"
        exit 1
    }

    Start-Sleep -Seconds 3
    $GLOBAL_IP = gcloud compute addresses describe $IP_NAME --global --format="get(address)"
}

Write-Success "[OK] IP global reservada: $GLOBAL_IP"
Write-Info ""

Write-Info "[INFO] PASO IMPORTANTE - Configurar tu dominio gateway:"
Write-Info ""
Write-Info "1. En tu DNS (Cloudflare/Google Domains), configura:"
Write-Info "   Tipo: A"
Write-Info "   Host: gtm-gateway"
Write-Info "   Valor: $GLOBAL_IP"
Write-Info "   Resultado: gtm-gateway.esbilla.com → $GLOBAL_IP"
Write-Info ""
Write-Info "2. Tus CLIENTES solo necesitaran configurar un CNAME:"
Write-Info "   Tipo: CNAME"
Write-Info "   Host: gtm"
Write-Info "   Valor: gtm-gateway.esbilla.com"
Write-Info "   Ejemplo: gtm.cliente.com → gtm-gateway.esbilla.com"
Write-Info ""
Write-Info "Ventajas:"
Write-Info "  - Clientes no necesitan conocer la IP"
Write-Info "  - Si cambias Load Balancer, solo actualizas tu DNS"
Write-Info "  - Mas profesional y facil para clientes"
Write-Info ""
$gatewayDomain = Read-Host "Ingresa tu dominio gateway (ej: gtm-gateway.esbilla.com)"

if (-not $gatewayDomain) {
    $gatewayDomain = "gtm-gateway.esbilla.com"
    Write-Warning "[INFO] Usando dominio por defecto: $gatewayDomain"
}

Write-Info ""
Write-Info "[INFO] Verifica que $gatewayDomain resuelve a $GLOBAL_IP"
Write-Info "Comando: nslookup $gatewayDomain"
Write-Info ""
Read-Host "Presiona Enter cuando hayas configurado $gatewayDomain"

Write-Info "[PASO] Paso 3: Crear Serverless NEG para Cloud Run..."

# Intentar obtener NEG existente
$existingNeg = gcloud compute network-endpoint-groups describe $NEG_NAME --region=$Region --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingNeg) {
    Write-Warning "[INFO] NEG $NEG_NAME ya existe, saltando..."
} else {
    Write-Info "Creando NEG..."
    gcloud compute network-endpoint-groups create $NEG_NAME `
        --region=$Region `
        --network-endpoint-type=serverless `
        --cloud-run-service=$CloudRunService

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el NEG"
        exit 1
    }

    Write-Success "[OK] NEG creado: $NEG_NAME"
}
Write-Info ""

Write-Info "[PASO]  Paso 4: Crear Backend Service..."

# Intentar obtener Backend Service existente
$existingBackend = gcloud compute backend-services describe $BACKEND_SERVICE_NAME --global --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingBackend) {
    Write-Warning "[INFO] Backend Service $BACKEND_SERVICE_NAME ya existe, saltando..."
} else {
    Write-Info "Creando Backend Service..."
    # NOTA: NO especificar --protocol para Serverless NEG (Cloud Run)
    # El protocol se determina automaticamente sin generar port_name
    gcloud compute backend-services create $BACKEND_SERVICE_NAME `
        --global `
        --load-balancing-scheme=EXTERNAL_MANAGED

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el Backend Service"
        exit 1
    }

    gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME `
        --global `
        --network-endpoint-group=$NEG_NAME `
        --network-endpoint-group-region=$Region

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo anadir backend al servicio"
        exit 1
    }

    Write-Success "[OK] Backend Service creado: $BACKEND_SERVICE_NAME"
}
Write-Info ""

Write-Info "[PASO]  Paso 5: Crear URL Map..."

# Intentar obtener URL Map existente
$existingUrlMap = gcloud compute url-maps describe $URL_MAP_NAME --global --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingUrlMap) {
    Write-Warning "[INFO] URL Map $URL_MAP_NAME ya existe, saltando..."
} else {
    Write-Info "Creando URL Map..."
    gcloud compute url-maps create $URL_MAP_NAME `
        --default-service=$BACKEND_SERVICE_NAME `
        --global

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el URL Map"
        exit 1
    }

    Write-Success "[OK] URL Map creado: $URL_MAP_NAME"
}
Write-Info ""

Write-Info "[PASO] Paso 6: Crear Certificate Map..."

# Intentar obtener Certificate Map existente
$existingCertMap = gcloud certificate-manager maps describe $CERT_MAP_NAME --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingCertMap) {
    # Certificate Map ya existe
    Write-Warning "[INFO] Certificate Map $CERT_MAP_NAME ya existe"
} else {
    # Crear nuevo Certificate Map
    Write-Info "Creando Certificate Map..."
    gcloud certificate-manager maps create $CERT_MAP_NAME `
        --description="Certificate map for GTM Gateway multi-domain SSL"

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el Certificate Map"
        exit 1
    }

    Write-Success "[OK] Certificate Map creado: $CERT_MAP_NAME"
}
Write-Info ""

Write-Info "[PASO] Paso 7: Crear Target HTTPS Proxy..."

# Intentar obtener HTTPS Proxy existente
$existingProxy = gcloud compute target-https-proxies describe $HTTPS_PROXY_NAME --global --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingProxy) {
    Write-Warning "[INFO] HTTPS Proxy $HTTPS_PROXY_NAME ya existe, saltando..."
} else {
    Write-Info "Creando Target HTTPS Proxy..."
    gcloud compute target-https-proxies create $HTTPS_PROXY_NAME `
        --url-map=$URL_MAP_NAME `
        --certificate-map=$CERT_MAP_NAME `
        --global

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el HTTPS Proxy"
        exit 1
    }

    Write-Success "[OK] Target HTTPS Proxy creado: $HTTPS_PROXY_NAME"
}
Write-Info ""

Write-Info "[PASO] Paso 8: Crear Global Forwarding Rule..."

# Intentar obtener Forwarding Rule existente
$existingRule = gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME --global --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingRule) {
    Write-Warning "[INFO] Forwarding Rule $FORWARDING_RULE_NAME ya existe, saltando..."
} else {
    Write-Info "Creando Forwarding Rule..."
    gcloud compute forwarding-rules create $FORWARDING_RULE_NAME `
        --global `
        --load-balancing-scheme=EXTERNAL_MANAGED `
        --network-tier=PREMIUM `
        --address=$IP_NAME `
        --target-https-proxy=$HTTPS_PROXY_NAME `
        --ports=443

    if ($LASTEXITCODE -ne 0) {
        Write-Error "[ERROR] No se pudo crear el Forwarding Rule"
        exit 1
    }

    Write-Success "[OK] Forwarding Rule creado: $FORWARDING_RULE_NAME"
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
Write-Info "[SETUP] Proximos pasos:"
Write-Info "   1. Indicar a tus CLIENTES que configuren CNAME:"
Write-Info "      gtm.cliente.com CNAME → $gatewayDomain"
Write-Info ""
Write-Info "   2. Anadir dominio del cliente con:"
Write-Info "      .\add-client-domain.ps1 -Domain gtm.cliente.com"
Write-Info ""
Write-Info "   3. Configurar gtmGatewayDomain en Dashboard para cada site"
Write-Info ""
Write-Info "   4. Los certificados SSL se provisionaran automaticamente (15-30 min)"
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
