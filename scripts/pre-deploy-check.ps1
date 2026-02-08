# Pre-Deploy Verification Script para Esbilla CMP
# Verifica que todo esta listo antes de desplegar a produccion

$ErrorActionPreference = "Continue"

Write-Host "Esbilla CMP - Pre-Deploy Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ERRORS = 0
$WARNINGS = 0

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    $script:ERRORS++
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
    $script:WARNINGS++
}

Write-Host "1. Verificando archivos de configuracion..."
Write-Host "============================================"

# Check firestore.rules
if (Test-Path "firestore.rules") {
    Write-Success "firestore.rules existe"

    $rulesContent = Get-Content "firestore.rules" -Raw
    if ($rulesContent -match "hasDistributorAccess") {
        Write-Success "hasDistributorAccess encontrada en rules"
    } else {
        Write-Error "hasDistributorAccess NO encontrada en rules"
    }

    if ($rulesContent -match "hasAnyOrgAccess") {
        Write-Success "hasAnyOrgAccess encontrada en rules"
    } else {
        Write-Error "hasAnyOrgAccess NO encontrada en rules"
    }
} else {
    Write-Error "firestore.rules NO existe"
}

# Check firebase.json
if (Test-Path "firebase.json") {
    Write-Success "firebase.json existe"
} else {
    Write-Error "firebase.json NO existe"
}

# Check Dockerfile
if (Test-Path "Dockerfile") {
    Write-Success "Dockerfile existe"
} else {
    Write-Error "Dockerfile NO existe"
}

Write-Host ""
Write-Host "2. Verificando estructura del proyecto..."
Write-Host "========================================"

# Check dashboard
if (Test-Path "esbilla-dashboard\package.json") {
    Write-Success "Dashboard package.json existe"
} else {
    Write-Error "Dashboard package.json NO existe"
}

# Check API
if (Test-Path "esbilla-api\package.json") {
    Write-Success "API package.json existe"
} else {
    Write-Error "API package.json NO existe"
}

# Check node_modules
if (Test-Path "node_modules") {
    Write-Success "node_modules existe (dependencias instaladas)"
} else {
    Write-Warning "node_modules NO existe - ejecuta 'npm install'"
}

Write-Host ""
Write-Host "3. Verificando archivos criticos..."
Write-Host "==================================="

$criticalFiles = @(
    "esbilla-dashboard\src\types\index.ts",
    "esbilla-dashboard\src\context\AuthContext.tsx",
    "esbilla-dashboard\src\pages\Distributors.tsx",
    "esbilla-dashboard\src\pages\Register.tsx",
    "esbilla-dashboard\src\pages\VerifyEmail.tsx",
    "esbilla-dashboard\src\pages\OnboardingSetup.tsx",
    "esbilla-dashboard\src\pages\AcceptInvite.tsx",
    "esbilla-api\src\routes\invitations.js"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Success "$file existe"
    } else {
        Write-Error "$file NO existe"
    }
}

Write-Host ""
Write-Host "4. Verificando tipos TypeScript..."
Write-Host "=================================="

$typesFile = "esbilla-dashboard\src\types\index.ts"
if (Test-Path $typesFile) {
    $typesContent = Get-Content $typesFile -Raw

    if ($typesContent -match "DistributorRole") {
        Write-Success "DistributorRole definido"
    } else {
        Write-Error "DistributorRole NO definido en types/index.ts"
    }

    if ($typesContent -match "DistributorAccess") {
        Write-Success "DistributorAccess definido"
    } else {
        Write-Error "DistributorAccess NO definido en types/index.ts"
    }

    if ($typesContent -match "distributorAccess") {
        Write-Success "distributorAccess aniadido a DashboardUser"
    } else {
        Write-Error "distributorAccess NO aniadido a DashboardUser"
    }
}

Write-Host ""
Write-Host "5. Verificando traducciones i18n..."
Write-Host "==================================="

$i18nFiles = @(
    "esbilla-dashboard\src\i18n\translations\es.ts",
    "esbilla-dashboard\src\i18n\translations\en.ts",
    "esbilla-dashboard\src\i18n\translations\ast.ts"
)

foreach ($file in $i18nFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match "distributors") {
            Write-Success "Traduccion 'distributors' en $(Split-Path $file -Leaf)"
        } else {
            Write-Warning "Traduccion 'distributors' falta en $(Split-Path $file -Leaf)"
        }
    } else {
        Write-Error "$file NO existe"
    }
}

Write-Host ""
Write-Host "6. Verificando SDK (Pegoyu)..."
Write-Host "=============================="

$sdkFile = "esbilla-api\public\pegoyu.js"
if (Test-Path $sdkFile) {
    Write-Success "pegoyu.js existe"

    $sdkContent = Get-Content $sdkFile -Raw

    if ($sdkContent -match "generatePanoyaSvg") {
        Write-Success "generatePanoyaSvg implementada"
    } else {
        Write-Error "generatePanoyaSvg NO implementada"
    }

    if ($sdkContent -match "panoyaVariant") {
        Write-Success "panoyaVariant soportado"
    } else {
        Write-Error "panoyaVariant NO soportado"
    }

    if ($sdkContent -match "panoyaColors") {
        Write-Success "panoyaColors soportado"
    } else {
        Write-Error "panoyaColors NO soportado"
    }
} else {
    Write-Error "pegoyu.js NO existe"
}

Write-Host ""
Write-Host "7. Verificando documentacion..."
Write-Host "==============================="

$docs = @(
    "docs\FIREBASE-SETUP.md",
    "docs\PRODUCTION-CHECKLIST.md",
    "docs\MULTI-ORG-PERMISSIONS.md",
    "CLAUDE.md",
    "README.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Write-Success "$doc existe"
    } else {
        Write-Warning "$doc NO existe (recomendado)"
    }
}

Write-Host ""
Write-Host "8. Verificando Git status..."
Write-Host "============================"

if (Test-Path ".git") {
    Write-Success "Repositorio Git encontrado"

    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Warning "Hay cambios sin commitear"
        Write-Host "   Archivos modificados:"
        git status --short | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Success "No hay cambios sin commitear"
    }

    $branch = git branch --show-current
    if ($branch -eq "main") {
        Write-Success "En rama 'main'"
    } else {
        Write-Warning "En rama '$branch' (no 'main')"
    }
} else {
    Write-Error "NO es un repositorio Git"
}

Write-Host ""
Write-Host "9. Verificando Firebase CLI..."
Write-Host "=============================="

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if ($firebaseCmd) {
    Write-Success "Firebase CLI instalado"
    $firebaseVersion = firebase --version
    Write-Host "   Version: $firebaseVersion"
} else {
    Write-Error "Firebase CLI NO instalado - ejecuta 'npm install -g firebase-tools'"
}

Write-Host ""
Write-Host "10. Verificando gcloud CLI..."
Write-Host "============================="

$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
if ($gcloudCmd) {
    Write-Success "gcloud CLI instalado"
    $gcloudVersion = gcloud version --format="value(core.version)" 2>$null
    Write-Host "   Version: $gcloudVersion"

    $project = gcloud config get-value project 2>$null
    if ($project -eq "esbilla-cmp") {
        Write-Success "Proyecto activo: esbilla-cmp"
    } else {
        Write-Warning "Proyecto activo: $project (esperado: esbilla-cmp)"
    }
} else {
    Write-Warning "gcloud CLI NO instalado (necesario para Cloud Run)"
}

Write-Host ""
Write-Host "============================================"
Write-Host "Resumen del Chequeo"
Write-Host "============================================"
Write-Host ""

if ($ERRORS -eq 0 -and $WARNINGS -eq 0) {
    Write-Host "TODO CORRECTO - Listo para desplegar" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:"
    Write-Host "1. Configurar Firebase Console (ver FIREBASE-SETUP.md)"
    Write-Host "2. Configurar variables SMTP en Cloud Run"
    Write-Host "3. Deploy: git push origin main"
    Write-Host "4. Ejecutar tests E2E (ver PRODUCTION-CHECKLIST.md)"
    exit 0
}
elseif ($ERRORS -eq 0) {
    Write-Host "HAY $WARNINGS ADVERTENCIAS - Revisar antes de desplegar" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Las advertencias no son bloqueantes pero es recomendable resolverlas."
    exit 0
}
else {
    Write-Host "HAY $ERRORS ERRORES - NO desplegar hasta resolver" -ForegroundColor Red
    Write-Host ""
    Write-Host "Errores encontrados: $ERRORS"
    Write-Host "Advertencias: $WARNINGS"
    Write-Host ""
    Write-Host "Resuelve los errores antes de continuar con el despliegue."
    exit 1
}
