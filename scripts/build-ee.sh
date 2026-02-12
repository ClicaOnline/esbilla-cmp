#!/bin/bash
# Build Enterprise Edition
#
# Este script prepara un build de Enterprise Edition:
# 1. Incluye todas las carpetas /enterprise
# 2. Configura ESBILLA_EDITION=enterprise
# 3. Incluye módulos EE del SDK
# 4. Build completo de dashboard y API

set -e  # Exit on error

echo "🏢 Building Enterprise Edition..."

# Verificar que estamos en el directorio raíz del proyecto
if [ ! -f "package.json" ]; then
  echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
  exit 1
fi

# Crear carpeta de build
BUILD_DIR="build/ee"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

echo "📁 Copiando archivos completos..."

# Copiar estructura completa
rsync -av \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='build' \
  --exclude='dist' \
  --exclude='.env' \
  --exclude='firebase-debug.log' \
  --exclude='.firebase' \
  . "$BUILD_DIR/"

echo "⚙️  Configurando variables de entorno para EE..."

# Crear .env para API (EE)
cat > "$BUILD_DIR/esbilla-api/.env" << 'EOF'
# Enterprise Edition Configuration
ESBILLA_EDITION=enterprise
PORT=3000
GCLOUD_PROJECT=esbilla-cmp
FIRESTORE_DATABASE_ID=esbilla-cmp

# SMTP Configuration (required for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@esbilla.com
SMTP_PASS=your-app-password
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>
FRONTEND_URL=https://app.esbilla.com
EOF

# Crear .env para Dashboard (EE)
cat > "$BUILD_DIR/esbilla-dashboard/.env.example" << 'EOF'
# Enterprise Edition Configuration
VITE_ESBILLA_EDITION=enterprise

# Firebase Configuration (reemplazar con tus valores)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
EOF

echo "📦 Instalando dependencias..."

cd "$BUILD_DIR"

# Instalar dependencias
npm install

echo "🔨 Building Dashboard (EE)..."

cd esbilla-dashboard

# Si existe .env.example, el usuario debe copiar a .env y configurar
if [ ! -f ".env" ]; then
  echo "⚠️  Advertencia: No existe .env en Dashboard. Copia .env.example y configura tus valores de Firebase."
  cp .env.example .env
fi

npm run build

cd ..

echo "🔨 Building API (EE)..."

cd esbilla-api
# API no necesita build (usa Node.js directamente)
# Verificar que los módulos EE existen
if [ ! -d "public/modules/ee" ]; then
  echo "❌ Error: Módulos EE no encontrados en public/modules/ee"
  exit 1
fi

if [ ! -d "src/enterprise" ]; then
  echo "❌ Error: Código enterprise no encontrado en src/enterprise"
  exit 1
fi

echo "✅ Módulos EE verificados:"
ls -la public/modules/ee/
ls -la src/enterprise/

cd ..

echo ""
echo "✅ Enterprise Edition build completado!"
echo ""
echo "📁 Build ubicado en: $BUILD_DIR"
echo ""
echo "📋 Features incluidas:"
echo "   ✓ Multi-tenancy (organizaciones + usuarios)"
echo "   ✓ Sistema de invitaciones por email"
echo "   ✓ Onboarding wizard (3 pasos)"
echo "   ✓ Planes y quotas (Free/Pro/Enterprise)"
echo "   ✓ Waiting list"
echo "   ✓ Email auth + Google SSO"
echo "   ✓ Advanced stats"
echo "   ✓ SDK: Attribution tracking"
echo "   ✓ SDK: Cross-domain sync"
echo "   ✓ SDK: GTM Gateway"
echo "   ✓ SDK: 19 integraciones (CE: 5)"
echo ""
echo "🚀 Para ejecutar localmente:"
echo "   1. cd $BUILD_DIR/esbilla-dashboard && cp .env.example .env"
echo "   2. Configurar Firebase en .env"
echo "   3. cd ../esbilla-api && npm start"
echo ""
