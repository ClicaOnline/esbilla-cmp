#!/bin/bash
# Build Community Edition
#
# Este script prepara un build de Community Edition:
# 1. Elimina carpetas /enterprise
# 2. Configura ESBILLA_EDITION=community
# 3. Elimina módulos EE del SDK
# 4. Build de dashboard y API

set -e  # Exit on error

echo "🌽 Building Community Edition..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
  exit 1
fi

# Crear carpeta de build
BUILD_DIR="build/ce"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "📁 Copiando archivos base..."

# Copiar estructura completa excepto carpetas enterprise
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='build' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='firebase-debug.log' \
  --exclude='.firebase' \
  --exclude='*/enterprise' \
  . "$BUILD_DIR/"

echo "🗑️  Eliminando código Enterprise Edition..."

# Eliminar carpetas enterprise
find "$BUILD_DIR" -type d -name "enterprise" -exec rm -rf {} + 2>/dev/null || true

# Eliminar módulos EE del SDK
rm -rf "$BUILD_DIR/esbilla-api/public/modules/ee" 2>/dev/null || true

# Eliminar archivos específicos de EE
rm -f "$BUILD_DIR/esbilla-dashboard/src/config/plans.ts" 2>/dev/null || true
rm -f "$BUILD_DIR/esbilla-dashboard/src/utils/featureFlags.ts" 2>/dev/null || true

echo "⚙️  Configurando variables de entorno para CE..."

# Crear .env para API (CE)
cat > "$BUILD_DIR/esbilla-api/.env" << 'EOF'
# Community Edition Configuration
ESBILLA_EDITION=community
PORT=3000
GCLOUD_PROJECT=esbilla-cmp
FIRESTORE_DATABASE_ID=esbilla-cmp

# SMTP no disponible en CE (usar servicio propio)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# FROM_EMAIL=
# FRONTEND_URL=
EOF

# Crear .env para Dashboard (CE)
cat > "$BUILD_DIR/esbilla-dashboard/.env.example" << 'EOF'
# Community Edition Configuration
VITE_ESBILLA_EDITION=community

# Firebase Configuration (reemplazar con tus valores)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
EOF

echo "📝 Actualizando imports en App.tsx..."

# Actualizar imports en App.tsx para eliminar referencias a /enterprise
cd "$BUILD_DIR/esbilla-dashboard/src"

if [ -f "App.tsx" ]; then
  # Comentar importaciones de páginas enterprise
  sed -i.bak "s|import.*from './enterprise/pages/|// [CE] import removed: |g" App.tsx

  # Comentar rutas enterprise
  sed -i.bak "s|<Route.*<RegisterPage|// [CE] <Route path=\"/register\" element={<RegisterPage />} />|g" App.tsx
  sed -i.bak "s|<Route.*<OnboardingSetupPage|// [CE] <Route path=\"/onboarding/setup\" element={<OnboardingSetupPage />} />|g" App.tsx
  sed -i.bak "s|<Route.*<OrganizationsPage|// [CE] <Route path=\"/organizations\" element={<OrganizationsPage />} />|g" App.tsx
  sed -i.bak "s|<Route.*<UsersPage|// [CE] <Route path=\"/users\" element={<UsersPage />} />|g" App.tsx

  rm App.tsx.bak
fi

cd - > /dev/null

echo "📝 Actualizando imports en app.js..."

# Actualizar imports en app.js para eliminar /enterprise/routes
cd "$BUILD_DIR/esbilla-api/src"

if [ -f "app.js" ]; then
  # Comentar importación de invitations
  sed -i.bak "s|const invitationsRouter = require('./enterprise/routes/invitations.js');|// [CE] Invitations not available in Community Edition|g" app.js
  sed -i.bak "s|app.use('/api/invitations', invitationsRouter);|// [CE] app.use('/api/invitations', invitationsRouter);|g" app.js

  rm app.js.bak
fi

cd - > /dev/null

echo "📦 Instalando dependencias..."

cd "$BUILD_DIR"

# Instalar dependencias (solo root, los workspaces se instalan automáticamente)
npm install

echo "🔨 Building Dashboard (CE)..."

cd esbilla-dashboard

# Si existe .env.example, el usuario debe copiar a .env y configurar
if [ ! -f ".env" ]; then
  echo "⚠️  Advertencia: No existe .env en Dashboard. Copia .env.example y configura tus valores de Firebase."
  cp .env.example .env
fi

npm run build

cd ..

echo "🔨 Building API (CE)..."

cd esbilla-api
# API no necesita build (usa Node.js directamente)

cd ..

echo ""
echo "✅ Community Edition build completado!"
echo ""
echo "📁 Build ubicado en: $BUILD_DIR"
echo ""
echo "📋 Siguiente paso:"
echo "   1. cd $BUILD_DIR/esbilla-dashboard"
echo "   2. Copiar .env.example a .env y configurar Firebase"
echo "   3. npm run build"
echo ""
echo "🚀 Para ejecutar localmente:"
echo "   cd $BUILD_DIR/esbilla-api && npm start"
echo ""
