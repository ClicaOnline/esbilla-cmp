# Add Client Domain to GTM Gateway (Windows PowerShell)
#
# Este script añade un nuevo dominio de cliente al GTM Gateway:
# 1. Crea un certificado SSL automático (ACME)
# 2. Crea una entrada en el Certificate Map
# 3. Espera a que el certificado se provisione
#
# Requisitos:
# - Infraestructura GTM Gateway ya configurada (setup-gtm-gateway.ps1)
# - Registro DNS A apuntando a la IP del Load Balancer
# - Permisos: Certificate Manager Admin

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,

    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:GCLOUD_PROJECT,

    [Parameter(Mandatory=$false)]
    [string]$CertMapName = "gtm-gateway-cert-map"
)

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "[SETUP] Añadiendo dominio al GTM Gateway: $Domain"
Write-Info ""

# Verificar gcloud
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Error: Google Cloud SDK no está instalado"
    exit 1
}

# Verificar proyecto
if (-not $ProjectId) {
    Write-Error "❌ Error: No se especificó PROJECT_ID"
    Write-Info "Uso: .\add-client-domain.ps1 -Domain gtm.cliente.com -ProjectId tu-proyecto-id"
    exit 1
}

gcloud config set project $ProjectId

# Normalizar domain (quitar protocolo, trailing slash, etc.)
$Domain = $Domain -replace '^https?://', '' -replace '/$', ''

# Validar formato de dominio
if ($Domain -notmatch '^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$') {
    Write-Error "❌ Error: Formato de dominio inválido: $Domain"
    Write-Info "Ejemplo válido: gtm.clicaonline.com"
    exit 1
}

Write-Info "[CONFIG] Configuración:"
Write-Info "   Proyecto: $ProjectId"
Write-Info "   Dominio: $Domain"
Write-Info "   Certificate Map: $CertMapName"
Write-Info ""

# Nombres de recursos (normalizar para GCP)
$SAFE_DOMAIN = $Domain -replace '\.', '-'
$CERT_NAME = "cert-$SAFE_DOMAIN"
$MAP_ENTRY_NAME = "entry-$SAFE_DOMAIN"

Write-Info "[PASO] Paso 1: Verificar registro DNS..."

# Resolver DNS (usando nslookup en Windows)
try {
    $dnsResult = nslookup $Domain 2>&1 | Select-String "Address"
    if ($dnsResult) {
        $resolvedIp = ($dnsResult -split '\s+')[-1]
        Write-Success "✅ DNS resuelve a: $resolvedIp"
    } else {
        Write-Warning "⚠️  No se pudo resolver DNS para $Domain"
        Write-Warning "   Asegúrate de configurar el registro A apuntando a la IP del Load Balancer"

        $continue = Read-Host "¿Continuar de todas formas? (s/N)"
        if ($continue -ne 's' -and $continue -ne 'S') {
            Write-Info "Abortado por el usuario"
            exit 0
        }
    }
} catch {
    Write-Warning "⚠️  Error verificando DNS: $_"
}
Write-Info ""

Write-Info "[PASO] Paso 2: Crear certificado SSL (ACME - Let's Encrypt)..."

# Verificar si el certificado ya existe
try {
    $existingCert = gcloud certificate-manager certificates describe $CERT_NAME --format="get(name)" 2>$null
    if ($existingCert) {
        Write-Warning "⚠️  Certificado $CERT_NAME ya existe"
        $recreate = Read-Host "¿Recrear certificado? (s/N)"
        if ($recreate -eq 's' -or $recreate -eq 'S') {
            Write-Info "Eliminando certificado existente..."
            gcloud certificate-manager certificates delete $CERT_NAME --quiet
            Start-Sleep -Seconds 2
        } else {
            Write-Info "Usando certificado existente"
            $CERT_EXISTS = $true
        }
    }
} catch {
    # El certificado no existe, continuar
}

if (-not $CERT_EXISTS) {
    # Crear certificado con DNS Authorization (ACME)
    gcloud certificate-manager certificates create $CERT_NAME `
        --domains=$Domain `
        --description="SSL certificate for GTM Gateway - $Domain"

    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Certificado creado: $CERT_NAME"
    } else {
        Write-Error "❌ Error creando certificado"
        exit 1
    }
}
Write-Info ""

Write-Info "[PASO]  Paso 3: Crear entrada en Certificate Map..."

# Verificar si la entrada ya existe
try {
    $existingEntry = gcloud certificate-manager maps entries describe $MAP_ENTRY_NAME --map=$CertMapName --format="get(name)" 2>$null
    if ($existingEntry) {
        Write-Warning "⚠️  Entrada $MAP_ENTRY_NAME ya existe en el Certificate Map"
        Write-Info "Actualizando entrada existente..."

        gcloud certificate-manager maps entries delete $MAP_ENTRY_NAME --map=$CertMapName --quiet
        Start-Sleep -Seconds 2
    }
} catch {
    # La entrada no existe, continuar
}

# Crear entrada en el map
gcloud certificate-manager maps entries create $MAP_ENTRY_NAME `
    --map=$CertMapName `
    --hostname=$Domain `
    --certificates=$CERT_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Entrada creada en Certificate Map"
} else {
    Write-Error "❌ Error creando entrada en Certificate Map"
    exit 1
}
Write-Info ""

Write-Info "[ESPERA] Paso 4: Esperando aprovisionamiento de certificado SSL..."
Write-Info "   Esto puede tardar 15-30 minutos (Google valida dominio y emite certificado)"
Write-Info ""

$attempts = 0
$maxAttempts = 60  # 60 intentos x 30s = 30 minutos

while ($attempts -lt $maxAttempts) {
    $attempts++

    try {
        $certStatus = gcloud certificate-manager certificates describe $CERT_NAME --format="get(managed.state)" 2>$null

        Write-Info "   Intento $attempts/$maxAttempts - Estado: $certStatus"

        if ($certStatus -eq "ACTIVE") {
            Write-Success "✅ Certificado SSL aprovisionado correctamente!"
            break
        } elseif ($certStatus -eq "FAILED") {
            Write-Error "❌ Error: El certificado falló en aprovisionar"
            Write-Info "Verifica que:"
            Write-Info "   1. El registro DNS A apunta a la IP correcta"
            Write-Info "   2. El dominio es accesible públicamente"
            Write-Info "   3. No hay firewalls bloqueando el puerto 80/443"
            exit 1
        }

    } catch {
        Write-Warning "⚠️  Error obteniendo estado del certificado: $_"
    }

    Start-Sleep -Seconds 30
}

if ($attempts -ge $maxAttempts) {
    Write-Warning "⚠️  Timeout esperando certificado SSL"
    Write-Info "El certificado seguirá provisionándose en background"
    Write-Info "Verifica el estado con:"
    Write-Info "   gcloud certificate-manager certificates describe $CERT_NAME"
}

Write-Info ""
Write-Success "✅ Dominio $Domain añadido al GTM Gateway!"
Write-Info ""
Write-Info "[CONFIG] Resumen:"
Write-Info "   Dominio: $Domain"
Write-Info "   Certificado: $CERT_NAME"
Write-Info "   Map Entry: $MAP_ENTRY_NAME"
Write-Info ""
Write-Info "[PASO] Verificar:"
Write-Info "   gcloud certificate-manager certificates describe $CERT_NAME"
Write-Info "   gcloud certificate-manager maps entries describe $MAP_ENTRY_NAME --map=$CertMapName"
Write-Info ""
Write-Info "[TEST] Probar:"
Write-Info "   curl https://$Domain/gtm.js?id=GTM-XXXXX"
Write-Info ""
Write-Info "📝 Siguiente paso:"
Write-Info "   Configurar gtmGatewayDomain='$Domain' en el Dashboard para el site del cliente"
Write-Info ""
Write-Success "¡Listo! Esbilla"
