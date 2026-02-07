#!/bin/bash
# Script maestro para deploy completo de infraestructura GTM Gateway Proxy
# Ejecuta todos los pasos en orden correcto

set -e

PROJECT_ID="esbilla-cmp"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Esbilla CMP - Deploy Completo de Infraestructura GTM Gateway Proxy"
echo "======================================================================"
echo "Project: $PROJECT_ID"
echo "Script directory: $SCRIPT_DIR"
echo ""
echo "Este script ejecutará los siguientes pasos:"
echo "  1. Deploy Firestore indexes"
echo "  2. Setup Load Balancer (multi-región UE)"
echo "  3. Setup Cloud CDN (cache global)"
echo "  4. Setup Monitoring y Alertas"
echo ""
read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deploy cancelado"
    exit 1
fi

echo ""
echo "======================================================================"
echo "PASO 1/4: Deploy Firestore Indexes"
echo "======================================================================"
echo ""

# Verificar que firestore.indexes.json existe
if [ ! -f "$SCRIPT_DIR/../firestore.indexes.json" ]; then
    echo "❌ ERROR: firestore.indexes.json no encontrado en raíz del proyecto"
    exit 1
fi

echo "📋 Desplegando índices de Firestore..."
firebase deploy --only firestore:indexes --project=$PROJECT_ID

echo "✅ Índices desplegados"
echo ""
echo "⏳ Los índices pueden tardar varios minutos en construirse."
echo "   Verifica el progreso en: https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
echo ""
read -p "Presiona Enter para continuar con el siguiente paso..."

echo ""
echo "======================================================================"
echo "PASO 2/4: Setup Load Balancer (Multi-región UE)"
echo "======================================================================"
echo ""

if [ ! -f "$SCRIPT_DIR/setup-load-balancer.sh" ]; then
    echo "❌ ERROR: setup-load-balancer.sh no encontrado"
    exit 1
fi

chmod +x "$SCRIPT_DIR/setup-load-balancer.sh"
bash "$SCRIPT_DIR/setup-load-balancer.sh"

echo ""
echo "✅ Load Balancer configurado"
echo ""
echo "⚠️  IMPORTANTE: El certificado SSL puede tardar hasta 15 minutos en aprovisionarse."
echo "   Antes de continuar, verifica que el certificado esté activo:"
echo ""
echo "   gcloud compute ssl-certificates describe esbilla-api-ssl --global --project=$PROJECT_ID"
echo ""
echo "   Busca: status: ACTIVE"
echo ""
read -p "¿El certificado SSL está ACTIVE? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "⏳ Espera a que el certificado se aprovisione y luego ejecuta manualmente:"
    echo "   ./setup-cdn.sh"
    echo "   ./setup-monitoring.sh"
    exit 0
fi

echo ""
echo "======================================================================"
echo "PASO 3/4: Setup Cloud CDN (Cache Global)"
echo "======================================================================"
echo ""

if [ ! -f "$SCRIPT_DIR/setup-cdn.sh" ]; then
    echo "❌ ERROR: setup-cdn.sh no encontrado"
    exit 1
fi

chmod +x "$SCRIPT_DIR/setup-cdn.sh"
bash "$SCRIPT_DIR/setup-cdn.sh"

echo ""
echo "✅ Cloud CDN configurado"
echo ""
read -p "Presiona Enter para continuar con el último paso..."

echo ""
echo "======================================================================"
echo "PASO 4/4: Setup Monitoring y Alertas"
echo "======================================================================"
echo ""

if [ ! -f "$SCRIPT_DIR/setup-monitoring.sh" ]; then
    echo "❌ ERROR: setup-monitoring.sh no encontrado"
    exit 1
fi

chmod +x "$SCRIPT_DIR/setup-monitoring.sh"
bash "$SCRIPT_DIR/setup-monitoring.sh"

echo ""
echo "✅ Monitoring y Alertas configurados"
echo ""

echo ""
echo "======================================================================"
echo "🎉 ¡DEPLOY COMPLETO!"
echo "======================================================================"
echo ""
echo "📊 Resumen de infraestructura desplegada:"
echo ""
echo "  ✅ Firestore Indexes"
echo "     - sites.gtmGatewayDomain (ASC)"
echo ""
echo "  ✅ Load Balancer Multi-región"
echo "     - Backend Service: esbilla-api-backend"
echo "     - Regiones: europe-west4 (70%), europe-west1 (30%), europe-west3 (0% standby)"
echo "     - Health Check: /api/health"
echo "     - SSL Certificate: esbilla-api-ssl"
echo ""
echo "  ✅ Cloud CDN"
echo "     - Cache mode: CACHE_ALL_STATIC"
echo "     - TTL: 5 minutos (default), 1 hora (max)"
echo "     - PoPs: Frankfurt, London, Paris, Amsterdam, Milán, Madrid"
echo ""
echo "  ✅ Monitoring y Alertas"
echo "     - Uptime Check: /api/health (60s desde Europa y USA)"
echo "     - 4 Alertas: Error rate, Latency, Availability, Scaling"
echo "     - Dashboard: GTM Gateway Proxy - Production"
echo ""
echo "🔧 Próximos pasos:"
echo ""
echo "  1. Configurar DNS para clientes:"
echo "     gtm.cliente.com → CNAME → api.esbilla.com"
echo ""
echo "  2. Verificar funcionamiento:"
echo "     curl -I https://api.esbilla.com/api/health"
echo "     curl -I https://api.esbilla.com/gtm.js?id=GTM-XXXXX"
echo ""
echo "  3. Monitorear métricas:"
echo "     https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "  4. Ver logs en tiempo real:"
echo "     gcloud logging tail \"resource.type=cloud_run_revision\" --project=$PROJECT_ID"
echo ""
echo "📖 Documentación completa:"
echo "  - infrastructure/README.md"
echo "  - docs/GTM-GATEWAY-INFRASTRUCTURE.md"
echo "  - docs/GTM-GATEWAY-SETUP.md"
echo ""
echo "🎯 Estado del sistema:"
echo "  - Load Balancer: https://console.cloud.google.com/net-services/loadbalancing?project=$PROJECT_ID"
echo "  - Cloud CDN: https://console.cloud.google.com/net-services/cdn?project=$PROJECT_ID"
echo "  - Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo ""
echo "✅ Infraestructura lista para producción"
echo ""
