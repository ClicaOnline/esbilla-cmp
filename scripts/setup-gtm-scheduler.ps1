# Setup GTM Gateway Certificate Polling (Cloud Scheduler)
#
# Este script configura un Cloud Scheduler que ejecuta polling
# cada minuto para verificar el estado de los certificados SSL.
#
# Requisitos:
# - Infraestructura GTM Gateway ya configurada (setup-gtm-gateway.ps1)
# - API desplegada en Cloud Run con endpoint /api/gtm-gateway/poll-certificates
# - Permisos: Cloud Scheduler Admin

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = $env:GCLOUD_PROJECT,

    [Parameter(Mandatory=$false)]
    [string]$Region = "europe-west4",

    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "https://esbilla-api-xxx.europe-west4.run.app"
)

# Colores
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "[SETUP] Configurando Cloud Scheduler para GTM Gateway polling..."
Write-Info ""

# Verificar gcloud
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Google Cloud SDK no esta instalado"
    exit 1
}

# Verificar proyecto
if (-not $ProjectId) {
    Write-Error "[ERROR] No se especifico PROJECT_ID"
    Write-Info "Uso: .\setup-gtm-scheduler.ps1 -ProjectId tu-proyecto-id -ApiUrl https://tu-api.run.app"
    exit 1
}

gcloud config set project $ProjectId

# Variables
$JOB_NAME = "gtm-gateway-cert-polling"
$SCHEDULE = "*/1 * * * *"  # Cada minuto
$ENDPOINT = "$ApiUrl/api/gtm-gateway/poll-certificates"

Write-Info "[CONFIG] Configuracion:"
Write-Info "   Proyecto: $ProjectId"
Write-Info "   Region: $Region"
Write-Info "   Job: $JOB_NAME"
Write-Info "   Schedule: $SCHEDULE (cada minuto)"
Write-Info "   Endpoint: $ENDPOINT"
Write-Info ""

Write-Info "[PASO] Paso 1: Habilitar API de Cloud Scheduler..."
gcloud services enable cloudscheduler.googleapis.com

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] No se pudo habilitar Cloud Scheduler API"
    exit 1
}

Write-Success "[OK] API habilitada"
Write-Info ""

Write-Info "[PASO] Paso 2: Crear Cloud Scheduler Job..."

# Verificar si el job ya existe
$existingJob = gcloud scheduler jobs describe $JOB_NAME --location=$Region --format="get(name)" 2>$null

if ($LASTEXITCODE -eq 0 -and $existingJob) {
    Write-Warning "[WARN] Job $JOB_NAME ya existe"
    $recreate = Read-Host "Recrear job? (s/N)"
    if ($recreate -eq 's' -or $recreate -eq 'S') {
        Write-Info "Eliminando job existente..."
        gcloud scheduler jobs delete $JOB_NAME --location=$Region --quiet
        Start-Sleep -Seconds 2
    } else {
        Write-Info "Usando job existente"
        Write-Success "Listo!"
        exit 0
    }
}

# Crear job de Cloud Scheduler
Write-Info "Creando Cloud Scheduler job..."
gcloud scheduler jobs create http $JOB_NAME `
    --location=$Region `
    --schedule="$SCHEDULE" `
    --uri="$ENDPOINT" `
    --http-method=POST `
    --headers="X-CloudScheduler=true" `
    --description="Poll GTM Gateway certificate status every minute" `
    --attempt-deadline=60s `
    --max-retry-attempts=3

if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] No se pudo crear el Cloud Scheduler job"
    exit 1
}

Write-Success "[OK] Cloud Scheduler job creado: $JOB_NAME"
Write-Info ""

Write-Info "[PASO] Paso 3: Ejecutar job manualmente para probar..."
gcloud scheduler jobs run $JOB_NAME --location=$Region

if ($LASTEXITCODE -ne 0) {
    Write-Warning "[WARN] No se pudo ejecutar el job manualmente (puede ser normal si no hay certificados pendientes)"
} else {
    Write-Success "[OK] Job ejecutado manualmente"
}

Write-Info ""
Write-Success "[OK] Cloud Scheduler configurado correctamente!"
Write-Info ""
Write-Info "[CONFIG] Resumen:"
Write-Info "   Job: $JOB_NAME"
Write-Info "   Frecuencia: Cada minuto"
Write-Info "   Endpoint: $ENDPOINT"
Write-Info ""
Write-Info "[VERIFY] Verificar estado:"
Write-Info "   gcloud scheduler jobs describe $JOB_NAME --location=$Region"
Write-Info "   gcloud scheduler jobs list --location=$Region"
Write-Info ""
Write-Info "[LOGS] Ver logs de ejecucion:"
Write-Info "   gcloud logging read 'resource.type=cloud_scheduler_job AND resource.labels.job_id=$JOB_NAME' --limit=50"
Write-Info ""
Write-Info "[PAUSE] Pausar job (si es necesario):"
Write-Info "   gcloud scheduler jobs pause $JOB_NAME --location=$Region"
Write-Info ""
Write-Info "[RESUME] Reanudar job:"
Write-Info "   gcloud scheduler jobs resume $JOB_NAME --location=$Region"
Write-Info ""
Write-Success "Listo! Esbilla CMP"
