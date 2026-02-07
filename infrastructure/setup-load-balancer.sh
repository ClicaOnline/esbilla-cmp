#!/bin/bash
# Script para configurar Cloud Load Balancer multi-región para GTM Gateway Proxy
# Requiere: gcloud CLI configurado con permisos de administrador

set -e

# Variables de configuración
PROJECT_ID="esbilla-cmp"
REGION_PRIMARY="europe-west4"
REGION_SECONDARY="europe-west1"
REGION_STANDBY="europe-west3"
SERVICE_NAME="esbilla-api"
LB_NAME="esbilla-api-lb"
BACKEND_SERVICE_NAME="esbilla-api-backend"
HEALTH_CHECK_NAME="esbilla-api-health"
SSL_CERT_NAME="esbilla-api-ssl"
IP_NAME="esbilla-api-ip"
DOMAINS="api.esbilla.com"

echo "🚀 Configurando Cloud Load Balancer para Esbilla CMP GTM Gateway Proxy"
echo "Project: $PROJECT_ID"
echo ""

# Paso 1: Verificar que los servicios Cloud Run existen
echo "📋 Paso 1: Verificando servicios Cloud Run..."
for region in $REGION_PRIMARY $REGION_SECONDARY $REGION_STANDBY; do
  if gcloud run services describe $SERVICE_NAME --region=$region --project=$PROJECT_ID &> /dev/null; then
    echo "  ✅ Servicio encontrado en $region"
  else
    echo "  ⚠️  Servicio NO encontrado en $region. Desplegando..."
    gcloud run deploy $SERVICE_NAME \
      --image=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
      --region=$region \
      --platform=managed \
      --allow-unauthenticated \
      --min-instances=1 \
      --max-instances=100 \
      --cpu=1 \
      --memory=512Mi \
      --timeout=60s \
      --concurrency=80 \
      --set-env-vars="GCLOUD_PROJECT=$PROJECT_ID,FIRESTORE_DATABASE_ID=esbilla-cmp" \
      --project=$PROJECT_ID
  fi
done

echo ""

# Paso 2: Crear serverless NEGs (Network Endpoint Groups) para cada región
echo "📋 Paso 2: Creando Network Endpoint Groups..."
for region in $REGION_PRIMARY $REGION_SECONDARY $REGION_STANDBY; do
  NEG_NAME="$SERVICE_NAME-neg-$region"

  if gcloud compute network-endpoint-groups describe $NEG_NAME --region=$region --project=$PROJECT_ID &> /dev/null; then
    echo "  ✅ NEG ya existe: $NEG_NAME"
  else
    echo "  🔧 Creando NEG: $NEG_NAME"
    gcloud compute network-endpoint-groups create $NEG_NAME \
      --region=$region \
      --network-endpoint-type=serverless \
      --cloud-run-service=$SERVICE_NAME \
      --project=$PROJECT_ID
  fi
done

echo ""

# Paso 3: Crear health check
echo "📋 Paso 3: Creando Health Check..."
if gcloud compute health-checks describe $HEALTH_CHECK_NAME --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ Health Check ya existe"
else
  echo "  🔧 Creando Health Check"
  gcloud compute health-checks create https $HEALTH_CHECK_NAME \
    --check-interval=10s \
    --timeout=5s \
    --healthy-threshold=2 \
    --unhealthy-threshold=3 \
    --request-path=/api/health \
    --port=443 \
    --project=$PROJECT_ID
fi

echo ""

# Paso 4: Crear backend service
echo "📋 Paso 4: Creando Backend Service..."
if gcloud compute backend-services describe $BACKEND_SERVICE_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ Backend Service ya existe"
else
  echo "  🔧 Creando Backend Service"
  gcloud compute backend-services create $BACKEND_SERVICE_NAME \
    --global \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --protocol=HTTPS \
    --health-checks=$HEALTH_CHECK_NAME \
    --timeout=30s \
    --project=$PROJECT_ID
fi

echo ""

# Paso 5: Añadir backends (NEGs) al backend service con pesos
echo "📋 Paso 5: Añadiendo backends con distribución de tráfico..."

# Backend primary (70% tráfico)
echo "  🔧 Añadiendo backend primary: $REGION_PRIMARY (70%)"
gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group="$SERVICE_NAME-neg-$REGION_PRIMARY" \
  --network-endpoint-group-region=$REGION_PRIMARY \
  --balancing-mode=UTILIZATION \
  --capacity-scaler=0.7 \
  --max-utilization=0.8 \
  --project=$PROJECT_ID \
  2>/dev/null || echo "    (Backend ya existía)"

# Backend secondary (30% tráfico)
echo "  🔧 Añadiendo backend secondary: $REGION_SECONDARY (30%)"
gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group="$SERVICE_NAME-neg-$REGION_SECONDARY" \
  --network-endpoint-group-region=$REGION_SECONDARY \
  --balancing-mode=UTILIZATION \
  --capacity-scaler=0.3 \
  --max-utilization=0.8 \
  --project=$PROJECT_ID \
  2>/dev/null || echo "    (Backend ya existía)"

# Backend standby (0% tráfico - solo failover)
echo "  🔧 Añadiendo backend standby: $REGION_STANDBY (0% - failover)"
gcloud compute backend-services add-backend $BACKEND_SERVICE_NAME \
  --global \
  --network-endpoint-group="$SERVICE_NAME-neg-$REGION_STANDBY" \
  --network-endpoint-group-region=$REGION_STANDBY \
  --balancing-mode=UTILIZATION \
  --capacity-scaler=0 \
  --max-utilization=0.8 \
  --project=$PROJECT_ID \
  2>/dev/null || echo "    (Backend ya existía)"

echo ""

# Paso 6: Reservar IP estática global
echo "📋 Paso 6: Reservando IP estática global..."
if gcloud compute addresses describe $IP_NAME --global --project=$PROJECT_ID &> /dev/null; then
  IP_ADDRESS=$(gcloud compute addresses describe $IP_NAME --global --project=$PROJECT_ID --format="get(address)")
  echo "  ✅ IP ya existe: $IP_ADDRESS"
else
  echo "  🔧 Creando IP estática"
  gcloud compute addresses create $IP_NAME \
    --ip-version=IPV4 \
    --global \
    --project=$PROJECT_ID

  IP_ADDRESS=$(gcloud compute addresses describe $IP_NAME --global --project=$PROJECT_ID --format="get(address)")
  echo "  ✅ IP creada: $IP_ADDRESS"
fi

echo ""

# Paso 7: Crear managed SSL certificate
echo "📋 Paso 7: Creando certificado SSL managed..."
if gcloud compute ssl-certificates describe $SSL_CERT_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ Certificado SSL ya existe"
else
  echo "  🔧 Creando certificado SSL para: $DOMAINS"
  gcloud compute ssl-certificates create $SSL_CERT_NAME \
    --domains=$DOMAINS \
    --global \
    --project=$PROJECT_ID

  echo "  ⏳ El certificado puede tardar hasta 15 minutos en aprovisionarse"
fi

echo ""

# Paso 8: Crear URL map
echo "📋 Paso 8: Creando URL Map..."
if gcloud compute url-maps describe $LB_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ URL Map ya existe"
else
  echo "  🔧 Creando URL Map"
  gcloud compute url-maps create $LB_NAME \
    --default-service=$BACKEND_SERVICE_NAME \
    --global \
    --project=$PROJECT_ID
fi

echo ""

# Paso 9: Crear HTTPS proxy
echo "📋 Paso 9: Creando HTTPS Proxy..."
PROXY_NAME="$LB_NAME-proxy"
if gcloud compute target-https-proxies describe $PROXY_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ HTTPS Proxy ya existe"
else
  echo "  🔧 Creando HTTPS Proxy"
  gcloud compute target-https-proxies create $PROXY_NAME \
    --url-map=$LB_NAME \
    --ssl-certificates=$SSL_CERT_NAME \
    --global \
    --project=$PROJECT_ID
fi

echo ""

# Paso 10: Crear forwarding rule (punto de entrada)
echo "📋 Paso 10: Creando Forwarding Rule..."
FORWARDING_RULE_NAME="$LB_NAME-https"
if gcloud compute forwarding-rules describe $FORWARDING_RULE_NAME --global --project=$PROJECT_ID &> /dev/null; then
  echo "  ✅ Forwarding Rule ya existe"
else
  echo "  🔧 Creando Forwarding Rule"
  gcloud compute forwarding-rules create $FORWARDING_RULE_NAME \
    --load-balancing-scheme=EXTERNAL_MANAGED \
    --network-tier=PREMIUM \
    --address=$IP_NAME \
    --target-https-proxy=$PROXY_NAME \
    --ports=443 \
    --global \
    --project=$PROJECT_ID
fi

echo ""
echo "✅ Load Balancer configurado exitosamente!"
echo ""
echo "📊 Resumen de configuración:"
echo "  - IP estática: $IP_ADDRESS"
echo "  - SSL Certificate: $SSL_CERT_NAME (estado: provisioning)"
echo "  - Backend Service: $BACKEND_SERVICE_NAME"
echo "  - Health Check: $HEALTH_CHECK_NAME"
echo "  - URL Map: $LB_NAME"
echo "  - HTTPS Proxy: $PROXY_NAME"
echo "  - Forwarding Rule: $FORWARDING_RULE_NAME"
echo ""
echo "🔧 Próximos pasos:"
echo "  1. Configurar DNS: $DOMAINS → $IP_ADDRESS (A record)"
echo "  2. Esperar ~15 minutos a que el certificado SSL se aprovisione"
echo "  3. Verificar: curl -I https://$DOMAINS/api/health"
echo "  4. Habilitar Cloud CDN con el script setup-cdn.sh"
echo ""
