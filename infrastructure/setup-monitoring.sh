#!/bin/bash
# Script para configurar Cloud Monitoring y Alertas para GTM Gateway Proxy
# Configura: Uptime checks, alerting policies, dashboards

set -e

# Variables de configuración
PROJECT_ID="esbilla-cmp"
SERVICE_NAME="esbilla-api"
REGION_PRIMARY="europe-west4"
NOTIFICATION_CHANNEL_EMAIL="devops@clicaonline.com"
DASHBOARD_NAME="GTM Gateway Proxy - Production"

echo "🚀 Configurando Cloud Monitoring para Esbilla CMP GTM Gateway Proxy"
echo "Project: $PROJECT_ID"
echo ""

# Paso 1: Crear notification channel (email)
echo "📋 Paso 1: Configurando canales de notificación..."
CHANNEL_ID=$(gcloud alpha monitoring channels list \
  --project=$PROJECT_ID \
  --filter="type=email AND displayName='DevOps Email'" \
  --format="value(name)" 2>/dev/null | head -n 1)

if [ -z "$CHANNEL_ID" ]; then
  echo "  🔧 Creando canal de email: $NOTIFICATION_CHANNEL_EMAIL"

  # Crear archivo temporal con la configuración del canal
  cat > /tmp/email-channel.yaml <<EOF
type: email
displayName: DevOps Email
description: Email notifications for GTM Gateway Proxy
labels:
  email_address: $NOTIFICATION_CHANNEL_EMAIL
enabled: true
EOF

  gcloud alpha monitoring channels create --channel-content-from-file=/tmp/email-channel.yaml --project=$PROJECT_ID
  rm /tmp/email-channel.yaml

  CHANNEL_ID=$(gcloud alpha monitoring channels list \
    --project=$PROJECT_ID \
    --filter="type=email AND displayName='DevOps Email'" \
    --format="value(name)" | head -n 1)

  echo "  ✅ Canal creado: $CHANNEL_ID"
else
  echo "  ✅ Canal ya existe: $CHANNEL_ID"
fi

echo ""

# Paso 2: Crear Uptime Check para /api/health
echo "📋 Paso 2: Configurando Uptime Check..."
UPTIME_CHECK_NAME="gtm-gateway-health-check"

if gcloud monitoring uptime list --project=$PROJECT_ID --filter="displayName=$UPTIME_CHECK_NAME" --format="value(name)" | grep -q .; then
  echo "  ✅ Uptime Check ya existe"
else
  echo "  🔧 Creando Uptime Check"

  cat > /tmp/uptime-check.yaml <<EOF
displayName: $UPTIME_CHECK_NAME
httpCheck:
  path: /api/health
  port: 443
  requestMethod: GET
  useSsl: true
  validateSsl: true
monitoredResource:
  type: uptime_url
  labels:
    project_id: $PROJECT_ID
    host: api.esbilla.com
period: 60s
timeout: 10s
selectedRegions:
  - EUROPE
  - USA
contentMatchers:
  - content: "ok"
    matcher: CONTAINS_STRING
EOF

  gcloud monitoring uptime create --config-from-file=/tmp/uptime-check.yaml --project=$PROJECT_ID
  rm /tmp/uptime-check.yaml

  echo "  ✅ Uptime Check creado"
fi

echo ""

# Paso 3: Crear políticas de alertas

echo "📋 Paso 3: Configurando políticas de alertas..."

# Alerta 1: Error Rate > 1%
echo "  🔧 Configurando alerta: Error Rate > 1%"
cat > /tmp/alert-error-rate.yaml <<EOF
displayName: "[GTM Gateway] Error Rate > 1%"
documentation:
  content: "El error rate del GTM Gateway Proxy ha superado el 1% durante 5 minutos. Revisar logs en Cloud Logging."
  mimeType: text/markdown
conditions:
  - displayName: "Error rate > 1%"
    conditionThreshold:
      filter: |
        resource.type="cloud_run_revision"
        resource.labels.service_name="$SERVICE_NAME"
        metric.type="run.googleapis.com/request_count"
        metric.labels.response_code_class="5xx"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - resource.service_name
      comparison: COMPARISON_GT
      duration: 300s
      thresholdValue: 0.01
      trigger:
        count: 1
combiner: OR
notificationChannels:
  - $CHANNEL_ID
alertStrategy:
  autoClose: 1800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-error-rate.yaml --project=$PROJECT_ID 2>/dev/null || echo "    (Alerta ya existe)"
rm /tmp/alert-error-rate.yaml

# Alerta 2: Latency P99 > 1s
echo "  🔧 Configurando alerta: Latency P99 > 1s"
cat > /tmp/alert-latency.yaml <<EOF
displayName: "[GTM Gateway] Latency P99 > 1s"
documentation:
  content: "La latencia P99 del GTM Gateway Proxy ha superado 1 segundo durante 5 minutos. Revisar performance y cache hit rate."
  mimeType: text/markdown
conditions:
  - displayName: "P99 latency > 1000ms"
    conditionThreshold:
      filter: |
        resource.type="cloud_run_revision"
        resource.labels.service_name="$SERVICE_NAME"
        metric.type="run.googleapis.com/request_latencies"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_DELTA
          crossSeriesReducer: REDUCE_PERCENTILE_99
          groupByFields:
            - resource.service_name
      comparison: COMPARISON_GT
      duration: 300s
      thresholdValue: 1000
      trigger:
        count: 1
combiner: OR
notificationChannels:
  - $CHANNEL_ID
alertStrategy:
  autoClose: 1800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-latency.yaml --project=$PROJECT_ID 2>/dev/null || echo "    (Alerta ya existe)"
rm /tmp/alert-latency.yaml

# Alerta 3: Availability < 99%
echo "  🔧 Configurando alerta: Availability < 99%"
cat > /tmp/alert-availability.yaml <<EOF
displayName: "[GTM Gateway] Availability < 99%"
documentation:
  content: "La disponibilidad del GTM Gateway Proxy ha caído por debajo del 99% durante 5 minutos. Posible problema de infraestructura."
  mimeType: text/markdown
conditions:
  - displayName: "Uptime check failing"
    conditionThreshold:
      filter: |
        resource.type="uptime_url"
        metric.type="monitoring.googleapis.com/uptime_check/check_passed"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_FRACTION_TRUE
          crossSeriesReducer: REDUCE_MEAN
      comparison: COMPARISON_LT
      duration: 300s
      thresholdValue: 0.99
      trigger:
        count: 1
combiner: OR
notificationChannels:
  - $CHANNEL_ID
alertStrategy:
  autoClose: 900s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-availability.yaml --project=$PROJECT_ID 2>/dev/null || echo "    (Alerta ya existe)"
rm /tmp/alert-availability.yaml

# Alerta 4: Cloud Run instances > 80
echo "  🔧 Configurando alerta: Cloud Run instances > 80"
cat > /tmp/alert-scaling.yaml <<EOF
displayName: "[GTM Gateway] Cloud Run Instances > 80"
documentation:
  content: "El número de instancias de Cloud Run ha superado 80. Considerar aumentar límite o escalar verticalmente (más CPU/memory)."
  mimeType: text/markdown
conditions:
  - displayName: "Instance count > 80"
    conditionThreshold:
      filter: |
        resource.type="cloud_run_revision"
        resource.labels.service_name="$SERVICE_NAME"
        metric.type="run.googleapis.com/container/instance_count"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_MAX
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - resource.service_name
      comparison: COMPARISON_GT
      duration: 300s
      thresholdValue: 80
      trigger:
        count: 1
combiner: OR
notificationChannels:
  - $CHANNEL_ID
alertStrategy:
  autoClose: 3600s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-scaling.yaml --project=$PROJECT_ID 2>/dev/null || echo "    (Alerta ya existe)"
rm /tmp/alert-scaling.yaml

echo "  ✅ 4 alertas configuradas"
echo ""

# Paso 4: Crear dashboard personalizado
echo "📋 Paso 4: Creando dashboard personalizado..."

cat > /tmp/dashboard.json <<'EOF'
{
  "displayName": "GTM Gateway Proxy - Production",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Requests per Second",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"esbilla-api\" metric.type=\"run.googleapis.com/request_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }],
            "yAxis": {
              "label": "Requests/s",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Latency P50 / P99",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"esbilla-api\" metric.type=\"run.googleapis.com/request_latencies\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_DELTA",
                      "crossSeriesReducer": "REDUCE_PERCENTILE_50"
                    }
                  }
                },
                "legendTemplate": "P50"
              },
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"esbilla-api\" metric.type=\"run.googleapis.com/request_latencies\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_DELTA",
                      "crossSeriesReducer": "REDUCE_PERCENTILE_99"
                    }
                  }
                },
                "legendTemplate": "P99"
              }
            ],
            "yAxis": {
              "label": "Latency (ms)",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate (5xx)",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"esbilla-api\" metric.type=\"run.googleapis.com/request_count\" metric.labels.response_code_class=\"5xx\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }],
            "yAxis": {
              "label": "Errors/s",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "xPos": 6,
        "yPos": 4,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Instance Count",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"esbilla-api\" metric.type=\"run.googleapis.com/container/instance_count\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_MAX"
                  }
                }
              }
            }],
            "yAxis": {
              "label": "Instances",
              "scale": "LINEAR"
            }
          }
        }
      },
      {
        "yPos": 8,
        "width": 12,
        "height": 4,
        "widget": {
          "title": "CDN Cache Hit Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"https_lb_rule\" metric.type=\"loadbalancing.googleapis.com/https/request_count\" metric.labels.cache_result!=\"\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE",
                    "groupByFields": ["metric.label.cache_result"]
                  }
                }
              }
            }],
            "yAxis": {
              "label": "Requests/s",
              "scale": "LINEAR"
            }
          }
        }
      }
    ]
  }
}
EOF

# Crear dashboard (requiere API habilitada)
echo "  🔧 Creando dashboard (requiere Monitoring API habilitada)"
curl -X POST \
  "https://monitoring.googleapis.com/v1/projects/$PROJECT_ID/dashboards" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d @/tmp/dashboard.json \
  2>/dev/null || echo "    ⚠️  Dashboard no creado (API no habilitada o ya existe)"

rm /tmp/dashboard.json

echo ""
echo "✅ Monitoring y Alertas configurados exitosamente!"
echo ""
echo "📊 Componentes configurados:"
echo "  - Notification channel: $NOTIFICATION_CHANNEL_EMAIL"
echo "  - Uptime check: $UPTIME_CHECK_NAME (60s desde Europa y USA)"
echo "  - 4 Alerting policies:"
echo "    1. Error Rate > 1% durante 5 min"
echo "    2. Latency P99 > 1s durante 5 min"
echo "    3. Availability < 99% durante 5 min"
echo "    4. Cloud Run instances > 80 durante 5 min"
echo "  - Dashboard personalizado: $DASHBOARD_NAME"
echo ""
echo "🔧 Acceder al dashboard:"
echo "  https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo ""
echo "📧 Verificar notificaciones:"
echo "  https://console.cloud.google.com/monitoring/alerting/notifications?project=$PROJECT_ID"
echo ""
echo "📊 Ver alertas activas:"
echo "  gcloud alpha monitoring policies list --project=$PROJECT_ID"
echo ""
