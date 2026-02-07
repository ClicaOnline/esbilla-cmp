#!/bin/bash
# Script para habilitar Cloud CDN en el Load Balancer
# Requisito: Load Balancer ya configurado (ejecutar setup-load-balancer.sh primero)

set -e

# Variables de configuración
PROJECT_ID="esbilla-cmp"
BACKEND_SERVICE_NAME="esbilla-api-backend"
CACHE_MODE="CACHE_ALL_STATIC"
DEFAULT_TTL="300"    # 5 minutos
MAX_TTL="3600"       # 1 hora
CLIENT_TTL="300"     # 5 minutos

echo "🚀 Configurando Cloud CDN para Esbilla CMP GTM Gateway Proxy"
echo "Project: $PROJECT_ID"
echo "Backend Service: $BACKEND_SERVICE_NAME"
echo ""

# Verificar que el backend service existe
echo "📋 Verificando backend service..."
if ! gcloud compute backend-services describe $BACKEND_SERVICE_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "❌ ERROR: Backend service no encontrado. Ejecuta setup-load-balancer.sh primero."
  exit 1
fi
echo "  ✅ Backend service encontrado"
echo ""

# Verificar si CDN ya está habilitado
echo "📋 Verificando estado actual de CDN..."
CDN_STATUS=$(gcloud compute backend-services describe $BACKEND_SERVICE_NAME \
  --global \
  --project=$PROJECT_ID \
  --format="get(enableCDN)")

if [ "$CDN_STATUS" = "True" ]; then
  echo "  ⚠️  Cloud CDN ya está habilitado"
  echo "  🔧 Actualizando configuración..."
else
  echo "  🔧 Cloud CDN no está habilitado. Habilitando..."
fi

echo ""

# Habilitar CDN con configuración optimizada
echo "📋 Configurando Cloud CDN..."
gcloud compute backend-services update $BACKEND_SERVICE_NAME \
  --global \
  --enable-cdn \
  --cache-mode=$CACHE_MODE \
  --default-ttl=$DEFAULT_TTL \
  --max-ttl=$MAX_TTL \
  --client-ttl=$CLIENT_TTL \
  --negative-caching=false \
  --serve-while-stale=0 \
  --project=$PROJECT_ID

echo "  ✅ Cloud CDN configurado"
echo ""

# Configurar cache key policy para mejorar cache hit rate
echo "📋 Configurando Cache Key Policy..."
gcloud compute backend-services update $BACKEND_SERVICE_NAME \
  --global \
  --cache-key-include-protocol \
  --cache-key-include-host \
  --cache-key-include-query-string \
  --project=$PROJECT_ID

echo "  ✅ Cache Key Policy configurado"
echo ""

# Mostrar configuración final
echo "📊 Configuración de Cloud CDN:"
gcloud compute backend-services describe $BACKEND_SERVICE_NAME \
  --global \
  --project=$PROJECT_ID \
  --format="yaml(enableCDN,cdnPolicy)"

echo ""
echo "✅ Cloud CDN habilitado exitosamente!"
echo ""
echo "📊 Configuración aplicada:"
echo "  - Cache mode: $CACHE_MODE"
echo "  - Default TTL: $DEFAULT_TTL segundos (5 minutos)"
echo "  - Max TTL: $MAX_TTL segundos (1 hora)"
echo "  - Client TTL: $CLIENT_TTL segundos (5 minutos)"
echo "  - Negative caching: Deshabilitado"
echo "  - Cache key: protocol + host + query string"
echo ""
echo "🌍 PoPs de CDN activos en Europa:"
echo "  - Frankfurt (europe-west3)"
echo "  - London (europe-west2)"
echo "  - Paris (europe-west9)"
echo "  - Amsterdam (europe-west4)"
echo "  - Milán (europe-west8)"
echo "  - Madrid (europe-southwest1)"
echo ""
echo "📈 Beneficios esperados:"
echo "  - Cache hit rate: >80% (después de warm-up)"
echo "  - Reducción latencia: 66% (150ms → 50ms para cache hits)"
echo "  - Reducción egress Cloud Run: 80-90%"
echo "  - Ahorro de costos: ~€5/mes por 1M pageviews"
echo ""
echo "🔧 Verificar cache:"
echo "  curl -I https://api.esbilla.com/gtm.js?id=GTM-XXXXX"
echo "  # Buscar header: X-Cache: HIT (o MISS en primera carga)"
echo ""
echo "🧹 Invalidar cache (si es necesario):"
echo "  gcloud compute url-maps invalidate-cdn-cache $BACKEND_SERVICE_NAME \\"
echo "    --path '/gtm.js' \\"
echo "    --global \\"
echo "    --project=$PROJECT_ID"
echo ""
