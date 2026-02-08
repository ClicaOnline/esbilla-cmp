#!/bin/bash
# Pre-Deploy Verification Script para Esbilla CMP
# Verifica que todo está listo antes de desplegar a producción

set -e  # Exit on error

echo "🌽 Esbilla CMP - Pre-Deploy Verification"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Verificando archivos de configuración..."
echo "============================================"

# Check firestore.rules
if [ -f "firestore.rules" ]; then
    success "firestore.rules existe"

    # Check for distributor functions
    if grep -q "hasDistributorAccess" firestore.rules; then
        success "hasDistributorAccess() encontrada en rules"
    else
        error "hasDistributorAccess() NO encontrada en rules"
    fi

    if grep -q "hasAnyOrgAccess" firestore.rules; then
        success "hasAnyOrgAccess() encontrada en rules"
    else
        error "hasAnyOrgAccess() NO encontrada en rules"
    fi
else
    error "firestore.rules NO existe"
fi

# Check firebase.json
if [ -f "firebase.json" ]; then
    success "firebase.json existe"
else
    error "firebase.json NO existe"
fi

# Check Dockerfile
if [ -f "Dockerfile" ]; then
    success "Dockerfile existe"
else
    error "Dockerfile NO existe"
fi

echo ""
echo "2. Verificando estructura del proyecto..."
echo "========================================"

# Check dashboard build
if [ -f "esbilla-dashboard/package.json" ]; then
    success "Dashboard package.json existe"
else
    error "Dashboard package.json NO existe"
fi

# Check API
if [ -f "esbilla-api/package.json" ]; then
    success "API package.json existe"
else
    error "API package.json NO existe"
fi

# Check if node_modules exist
if [ -d "node_modules" ]; then
    success "node_modules existe (dependencias instaladas)"
else
    warning "node_modules NO existe - ejecuta 'npm install'"
fi

echo ""
echo "3. Verificando archivos críticos..."
echo "==================================="

# Check critical TypeScript files
CRITICAL_FILES=(
    "esbilla-dashboard/src/types/index.ts"
    "esbilla-dashboard/src/context/AuthContext.tsx"
    "esbilla-dashboard/src/pages/Distributors.tsx"
    "esbilla-dashboard/src/pages/Register.tsx"
    "esbilla-dashboard/src/pages/VerifyEmail.tsx"
    "esbilla-dashboard/src/pages/OnboardingSetup.tsx"
    "esbilla-dashboard/src/pages/AcceptInvite.tsx"
    "esbilla-api/src/routes/invitations.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file existe"
    else
        error "$file NO existe"
    fi
done

echo ""
echo "4. Verificando tipos TypeScript..."
echo "=================================="

# Check for distributor types
if grep -q "DistributorRole" esbilla-dashboard/src/types/index.ts 2>/dev/null; then
    success "DistributorRole definido"
else
    error "DistributorRole NO definido en types/index.ts"
fi

if grep -q "DistributorAccess" esbilla-dashboard/src/types/index.ts 2>/dev/null; then
    success "DistributorAccess definido"
else
    error "DistributorAccess NO definido en types/index.ts"
fi

if grep -q "distributorAccess" esbilla-dashboard/src/types/index.ts 2>/dev/null; then
    success "distributorAccess añadido a DashboardUser"
else
    error "distributorAccess NO añadido a DashboardUser"
fi

echo ""
echo "5. Verificando traducciones i18n..."
echo "==================================="

# Check translations
I18N_FILES=(
    "esbilla-dashboard/src/i18n/translations/es.ts"
    "esbilla-dashboard/src/i18n/translations/en.ts"
    "esbilla-dashboard/src/i18n/translations/ast.ts"
)

for file in "${I18N_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "distributors" "$file" 2>/dev/null; then
            success "Traducción 'distributors' en $(basename $file)"
        else
            warning "Traducción 'distributors' falta en $(basename $file)"
        fi
    else
        error "$file NO existe"
    fi
done

echo ""
echo "6. Verificando SDK (Pegoyu)..."
echo "=============================="

if [ -f "esbilla-api/public/pegoyu.js" ]; then
    success "pegoyu.js existe"

    if grep -q "generatePanoyaSvg" esbilla-api/public/pegoyu.js; then
        success "generatePanoyaSvg() implementada"
    else
        error "generatePanoyaSvg() NO implementada"
    fi

    if grep -q "panoyaVariant" esbilla-api/public/pegoyu.js; then
        success "panoyaVariant soportado"
    else
        error "panoyaVariant NO soportado"
    fi

    if grep -q "panoyaColors" esbilla-api/public/pegoyu.js; then
        success "panoyaColors soportado"
    else
        error "panoyaColors NO soportado"
    fi
else
    error "pegoyu.js NO existe"
fi

echo ""
echo "7. Verificando documentación..."
echo "==============================="

DOCS=(
    "docs/FIREBASE-SETUP.md"
    "docs/PRODUCTION-CHECKLIST.md"
    "docs/MULTI-ORG-PERMISSIONS.md"
    "CLAUDE.md"
    "README.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        success "$doc existe"
    else
        warning "$doc NO existe (recomendado)"
    fi
done

echo ""
echo "8. Verificando Git status..."
echo "============================"

# Check if we're in a git repo
if [ -d ".git" ]; then
    success "Repositorio Git encontrado"

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        warning "Hay cambios sin commitear"
        echo "   Archivos modificados:"
        git status --short | head -n 5
    else
        success "No hay cambios sin commitear"
    fi

    # Check current branch
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" = "main" ]; then
        success "En rama 'main'"
    else
        warning "En rama '$BRANCH' (no 'main')"
    fi
else
    error "NO es un repositorio Git"
fi

echo ""
echo "9. Verificando Firebase CLI..."
echo "=============================="

if command -v firebase &> /dev/null; then
    success "Firebase CLI instalado"
    FIREBASE_VERSION=$(firebase --version)
    echo "   Versión: $FIREBASE_VERSION"
else
    error "Firebase CLI NO instalado - ejecuta 'npm install -g firebase-tools'"
fi

echo ""
echo "10. Verificando gcloud CLI..."
echo "============================="

if command -v gcloud &> /dev/null; then
    success "gcloud CLI instalado"
    GCLOUD_VERSION=$(gcloud version --format="value(core.version)")
    echo "   Versión: $GCLOUD_VERSION"

    # Check active project
    PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ "$PROJECT" = "esbilla-cmp" ]; then
        success "Proyecto activo: esbilla-cmp"
    else
        warning "Proyecto activo: $PROJECT (esperado: esbilla-cmp)"
    fi
else
    warning "gcloud CLI NO instalado (necesario para Cloud Run)"
fi

echo ""
echo "============================================"
echo "📊 Resumen del Chequeo"
echo "============================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TODO CORRECTO - Listo para desplegar${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Configurar Firebase Console (ver FIREBASE-SETUP.md)"
    echo "2. Configurar variables SMTP en Cloud Run"
    echo "3. Deploy: git push origin main"
    echo "4. Ejecutar tests E2E (ver PRODUCTION-CHECKLIST.md)"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  HAY $WARNINGS ADVERTENCIAS - Revisar antes de desplegar${NC}"
    echo ""
    echo "Las advertencias no son bloqueantes pero es recomendable resolverlas."
    exit 0
else
    echo -e "${RED}❌ HAY $ERRORS ERRORES - NO desplegar hasta resolver${NC}"
    echo ""
    echo "Errores encontrados: $ERRORS"
    echo "Advertencias: $WARNINGS"
    echo ""
    echo "Resuelve los errores antes de continuar con el despliegue."
    exit 1
fi
