# GTM Gateway - Cloud Load Balancer + Certificate Manager Setup

**Feature Premium del SaaS** - Configuración escalable para miles de dominios personalizados con SSL automático.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Setup Inicial (Una vez)](#setup-inicial)
- [Scripts de Automatización](#scripts-de-automatización)
- [Integración con Dashboard](#integración-con-dashboard)
- [Feature Premium](#feature-premium)
- [Costes](#costes)
- [Monitoring](#monitoring)

---

## 🏗️ Arquitectura

```
Cliente 1: gtm.cliente1.com ────┐
Cliente 2: gtm.cliente2.com ────┤
Cliente 3: gtm.cliente3.com ────┼──> HTTPS Load Balancer (IP global única)
              ...                │    ├─ SNI (Server Name Indication)
Cliente N: gtm.clienteN.com ────┘    └─ Certificate Manager (SSL automático)
                                            ↓
                                   Cloud Run (esbilla-api)
                                            ↓
                                   Firestore (config lookup)
```

### Flujo del Cliente (2 pasos)

1. **Dashboard**: Activa GTM Gateway → Introduce `gtm.cliente.com`
2. **DNS**: Configura CNAME → `gtm-gateway.esbilla.com`
3. **Automático**: Certificate Manager provisiona SSL en 10-15 min

---

## 🚀 Setup Inicial

### Prerequisitos

```bash
# Variables de configuración
export PROJECT_ID="esbilla-cmp"
export REGION="europe-west4"
export SERVICE_NAME="esbilla-api"
export LB_NAME="gtm-gateway"
export DOMAIN_BASE="esbilla.com"
export GATEWAY_SUBDOMAIN="gtm-gateway.esbilla.com"
```

---

### Paso 1: Habilitar APIs

```bash
# Habilitar servicios necesarios
gcloud services enable certificatemanager.googleapis.com \
  compute.googleapis.com \
  run.googleapis.com \
  --project=$PROJECT_ID
```

---

### Paso 2: Certificate Manager

#### 2.1. Crear Certificate Map

```bash
gcloud certificate-manager maps create ${LB_NAME}-cert-map \
  --description="SSL certificates for GTM Gateway SaaS" \
  --project=$PROJECT_ID
```

#### 2.2. Verificar dominio base

```bash
# Crear DNS Authorization
gcloud certificate-manager dns-authorizations create ${DOMAIN_BASE//./-}-dns-auth \
  --domain=$DOMAIN_BASE \
  --project=$PROJECT_ID

# Obtener registro DNS requerido
gcloud certificate-manager dns-authorizations describe ${DOMAIN_BASE//./-}-dns-auth \
  --project=$PROJECT_ID \
  --format="value(dnsResourceRecord.data)"

# Output ejemplo: _acme-challenge.esbilla.com → xxxxx.gcp.acmedns.com
# Añade este registro CNAME en tu DNS provider
```

⏱️ **Esperar 10-15 minutos** para que DNS propague.

#### 2.3. Crear certificado wildcard

```bash
gcloud certificate-manager certificates create ${LB_NAME}-wildcard-cert \
  --domains="*.$DOMAIN_BASE,$DOMAIN_BASE" \
  --dns-authorizations=${DOMAIN_BASE//./-}-dns-auth \
  --project=$PROJECT_ID

# Verificar estado (debe estar ACTIVE)
gcloud certificate-manager certificates describe ${LB_NAME}-wildcard-cert \
  --project=$PROJECT_ID \
  --format="value(state)"
```

#### 2.4. Añadir certificado al mapa

```bash
gcloud certificate-manager maps entries create ${LB_NAME}-wildcard-entry \
  --map="${LB_NAME}-cert-map" \
  --certificates="${LB_NAME}-wildcard-cert" \
  --hostname="*.$DOMAIN_BASE" \
  --project=$PROJECT_ID
```

---

### Paso 3: Network Endpoint Group (NEG)

```bash
gcloud compute network-endpoint-groups create ${SERVICE_NAME}-neg \
  --region=$REGION \
  --network-endpoint-type=SERVERLESS \
  --cloud-run-service=$SERVICE_NAME \
  --project=$PROJECT_ID
```

---

### Paso 4: Backend Service

```bash
# Crear backend service con CDN
gcloud compute backend-services create ${LB_NAME}-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=300 \
  --client-ttl=300 \
  --max-ttl=600 \
  --project=$PROJECT_ID

# Añadir Cloud Run NEG
gcloud compute backend-services add-backend ${LB_NAME}-backend \
  --global \
  --network-endpoint-group=${SERVICE_NAME}-neg \
  --network-endpoint-group-region=$REGION \
  --project=$PROJECT_ID
```

---

### Paso 5: URL Map

```bash
gcloud compute url-maps create ${LB_NAME}-urlmap \
  --default-service=${LB_NAME}-backend \
  --project=$PROJECT_ID
```

---

### Paso 6: HTTPS Proxy

```bash
gcloud compute target-https-proxies create ${LB_NAME}-https-proxy \
  --url-map=${LB_NAME}-urlmap \
  --certificate-map=${LB_NAME}-cert-map \
  --project=$PROJECT_ID
```

---

### Paso 7: IP Estática Global

```bash
# Reservar IP
gcloud compute addresses create ${LB_NAME}-ip \
  --global \
  --ip-version=IPV4 \
  --project=$PROJECT_ID

# Obtener IP
export LB_IP=$(gcloud compute addresses describe ${LB_NAME}-ip \
  --global \
  --project=$PROJECT_ID \
  --format="value(address)")

echo "Load Balancer IP: $LB_IP"
```

---

### Paso 8: Forwarding Rule

```bash
gcloud compute forwarding-rules create ${LB_NAME}-https-rule \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --address=${LB_NAME}-ip \
  --target-https-proxy=${LB_NAME}-https-proxy \
  --ports=443 \
  --project=$PROJECT_ID
```

---

### Paso 9: Configurar DNS Base

Añade en tu DNS provider (Cloudflare, Route53, etc.):

```dns
gtm-gateway.esbilla.com.  A  <LB_IP>
```

---

### Paso 10: Verificar

```bash
# Test health endpoint
curl -I https://gtm-gateway.esbilla.com/api/health

# Debería devolver:
# HTTP/2 200
# content-type: application/json
```

✅ **Setup completo!** Ahora puedes añadir dominios de clientes automáticamente.

---

## 🤖 Scripts de Automatización

### Script 1: Setup Completo (Bash)

**Archivo:** `scripts/setup-gtm-gateway.sh`

```bash
#!/bin/bash
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}GTM Gateway Setup - Load Balancer${NC}"
echo -e "${GREEN}==================================${NC}\n"

# Variables
PROJECT_ID="esbilla-cmp"
REGION="europe-west4"
SERVICE_NAME="esbilla-api"
LB_NAME="gtm-gateway"
DOMAIN_BASE="esbilla.com"

echo -e "${YELLOW}Configuración:${NC}"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "  Domain: $DOMAIN_BASE"
echo ""

read -p "¿Continuar? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Abortado."
    exit 1
fi

# 1. Habilitar APIs
echo -e "\n${YELLOW}[1/10] Habilitando APIs...${NC}"
gcloud services enable certificatemanager.googleapis.com compute.googleapis.com \
  --project=$PROJECT_ID

# 2. Crear Certificate Map
echo -e "\n${YELLOW}[2/10] Creando Certificate Map...${NC}"
gcloud certificate-manager maps create ${LB_NAME}-cert-map \
  --description="SSL certificates for GTM Gateway SaaS" \
  --project=$PROJECT_ID || echo "Ya existe"

# 3. DNS Authorization
echo -e "\n${YELLOW}[3/10] Configurando DNS Authorization...${NC}"
gcloud certificate-manager dns-authorizations create ${DOMAIN_BASE//./-}-dns-auth \
  --domain=$DOMAIN_BASE \
  --project=$PROJECT_ID || echo "Ya existe"

DNS_RECORD=$(gcloud certificate-manager dns-authorizations describe ${DOMAIN_BASE//./-}-dns-auth \
  --project=$PROJECT_ID \
  --format="value(dnsResourceRecord.data)")

echo -e "\n${RED}IMPORTANTE: Añade este registro CNAME en tu DNS:${NC}"
echo "  Nombre: _acme-challenge.$DOMAIN_BASE"
echo "  Valor: $DNS_RECORD"
echo ""
read -p "Presiona Enter cuando hayas añadido el registro DNS..."

# 4. Crear certificado wildcard
echo -e "\n${YELLOW}[4/10] Creando certificado wildcard...${NC}"
gcloud certificate-manager certificates create ${LB_NAME}-wildcard-cert \
  --domains="*.$DOMAIN_BASE,$DOMAIN_BASE" \
  --dns-authorizations=${DOMAIN_BASE//./-}-dns-auth \
  --project=$PROJECT_ID || echo "Ya existe"

# 5. Añadir certificado al mapa
echo -e "\n${YELLOW}[5/10] Añadiendo certificado al mapa...${NC}"
gcloud certificate-manager maps entries create ${LB_NAME}-wildcard-entry \
  --map="${LB_NAME}-cert-map" \
  --certificates="${LB_NAME}-wildcard-cert" \
  --hostname="*.$DOMAIN_BASE" \
  --project=$PROJECT_ID || echo "Ya existe"

# 6. Crear NEG
echo -e "\n${YELLOW}[6/10] Creando Network Endpoint Group...${NC}"
gcloud compute network-endpoint-groups create ${SERVICE_NAME}-neg \
  --region=$REGION \
  --network-endpoint-type=SERVERLESS \
  --cloud-run-service=$SERVICE_NAME \
  --project=$PROJECT_ID || echo "Ya existe"

# 7. Crear Backend Service
echo -e "\n${YELLOW}[7/10] Creando Backend Service con CDN...${NC}"
gcloud compute backend-services create ${LB_NAME}-backend \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS \
  --enable-cdn \
  --project=$PROJECT_ID || echo "Ya existe"

gcloud compute backend-services add-backend ${LB_NAME}-backend \
  --global \
  --network-endpoint-group=${SERVICE_NAME}-neg \
  --network-endpoint-group-region=$REGION \
  --project=$PROJECT_ID || echo "Ya añadido"

# 8. URL Map
echo -e "\n${YELLOW}[8/10] Creando URL Map...${NC}"
gcloud compute url-maps create ${LB_NAME}-urlmap \
  --default-service=${LB_NAME}-backend \
  --project=$PROJECT_ID || echo "Ya existe"

# 9. HTTPS Proxy
echo -e "\n${YELLOW}[9/10] Creando HTTPS Proxy...${NC}"
gcloud compute target-https-proxies create ${LB_NAME}-https-proxy \
  --url-map=${LB_NAME}-urlmap \
  --certificate-map=${LB_NAME}-cert-map \
  --project=$PROJECT_ID || echo "Ya existe"

# 10. IP + Forwarding Rule
echo -e "\n${YELLOW}[10/10] Creando IP y Forwarding Rule...${NC}"
gcloud compute addresses create ${LB_NAME}-ip \
  --global \
  --ip-version=IPV4 \
  --project=$PROJECT_ID || echo "Ya existe"

LB_IP=$(gcloud compute addresses describe ${LB_NAME}-ip \
  --global \
  --project=$PROJECT_ID \
  --format="value(address)")

gcloud compute forwarding-rules create ${LB_NAME}-https-rule \
  --global \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --address=${LB_NAME}-ip \
  --target-https-proxy=${LB_NAME}-https-proxy \
  --ports=443 \
  --project=$PROJECT_ID || echo "Ya existe"

echo -e "\n${GREEN}✅ Setup completo!${NC}\n"
echo -e "${RED}IMPORTANTE: Configura el DNS base:${NC}"
echo "  gtm-gateway.esbilla.com.  A  $LB_IP"
echo ""
echo -e "${GREEN}Prueba el endpoint:${NC}"
echo "  curl -I https://gtm-gateway.esbilla.com/api/health"
echo ""
```

Guarda como `scripts/setup-gtm-gateway.sh` y ejecuta:

```bash
chmod +x scripts/setup-gtm-gateway.sh
./scripts/setup-gtm-gateway.sh
```

---

### Script 2: Añadir Dominio de Cliente (Python)

**Archivo:** `scripts/add_client_domain.py`

```python
#!/usr/bin/env python3
"""
Añade un dominio de cliente al Certificate Map de GTM Gateway.
Uso: python add_client_domain.py gtm.cliente.com GTM-XXXXX
"""

import sys
import subprocess
from google.cloud import certificate_manager_v1

PROJECT_ID = "esbilla-cmp"
CERT_MAP_NAME = f"projects/{PROJECT_ID}/locations/global/certificateMaps/gtm-gateway-cert-map"

def add_domain(domain: str, container_id: str):
    """Añade un dominio al Certificate Map"""

    cert_name = domain.replace('.', '-')

    print(f"📝 Añadiendo dominio: {domain}")
    print(f"   Container ID: {container_id}")
    print(f"   Cert name: {cert_name}")

    # 1. Crear certificado para el dominio
    print("\n1️⃣  Creando certificado...")
    cmd = [
        "gcloud", "certificate-manager", "certificates", "create", cert_name,
        f"--domains={domain}",
        f"--project={PROJECT_ID}"
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"   ✅ Certificado {cert_name} creado")
    except subprocess.CalledProcessError as e:
        if "already exists" in e.stderr:
            print(f"   ⚠️  Certificado ya existe")
        else:
            print(f"   ❌ Error: {e.stderr}")
            return False

    # 2. Añadir entry al Certificate Map
    print("\n2️⃣  Añadiendo al Certificate Map...")
    cmd = [
        "gcloud", "certificate-manager", "maps", "entries", "create", f"{cert_name}-entry",
        f"--map=gtm-gateway-cert-map",
        f"--certificates={cert_name}",
        f"--hostname={domain}",
        f"--project={PROJECT_ID}"
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"   ✅ Entry añadido al mapa")
    except subprocess.CalledProcessError as e:
        if "already exists" in e.stderr:
            print(f"   ⚠️  Entry ya existe")
        else:
            print(f"   ❌ Error: {e.stderr}")
            return False

    print(f"\n✅ Dominio {domain} añadido correctamente!")
    print(f"\n📋 Instrucciones para el cliente:")
    print(f"   Añadir registro DNS:")
    print(f"   {domain}.  CNAME  gtm-gateway.esbilla.com.")
    print(f"\n⏱️  El certificado SSL se provisionará en 10-15 minutos.")
    print(f"\n🧪 Probar cuando DNS propague:")
    print(f"   curl -I https://{domain}/gtm.js?id={container_id}")

    return True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python add_client_domain.py <domain> <container-id>")
        print("Ejemplo: python add_client_domain.py gtm.cliente.com GTM-XXXXX")
        sys.exit(1)

    domain = sys.argv[1]
    container_id = sys.argv[2]

    if not (container_id.startswith('GTM-') or container_id.startswith('G-')):
        print(f"❌ Container ID inválido: {container_id}")
        print("   Debe ser GTM-XXXXX o G-XXXXX")
        sys.exit(1)

    success = add_domain(domain, container_id)
    sys.exit(0 if success else 1)
```

Uso:

```bash
python scripts/add_client_domain.py gtm.cliente.com GTM-XXXXX
```

---

## 🎨 Integración con Dashboard

### Mostrar Instrucciones DNS

**En `Sites.tsx`:**

```typescript
{formData.gtmGatewayEnabled && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
      <Globe className="w-5 h-5" />
      Configuración DNS Requerida
    </h4>

    <div className="bg-white border border-blue-300 rounded p-3 font-mono text-sm space-y-2">
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <span className="text-stone-600">Tipo:</span>
        <span className="font-semibold">CNAME</span>

        <span className="text-stone-600">Nombre:</span>
        <span className="font-semibold text-blue-700">
          {formData.gtmGatewayDomain || 'gtm.tudominio.com'}
        </span>

        <span className="text-stone-600">Valor:</span>
        <span className="font-semibold">gtm-gateway.esbilla.com</span>

        <span className="text-stone-600">TTL:</span>
        <span>300 (5 minutos)</span>
      </div>
    </div>

    <div className="flex items-start gap-2 mt-3 text-sm text-blue-700">
      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <p>
        El certificado SSL se provisionará automáticamente en 10-15 minutos
        después de configurar el DNS.
      </p>
    </div>

    <button
      onClick={() => checkDnsAndSsl(formData.gtmGatewayDomain)}
      className="mt-3 text-sm text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
    >
      <CheckCircle className="w-4 h-4" />
      Verificar DNS y SSL →
    </button>
  </div>
)}
```

### Función de Verificación

```typescript
async function checkDnsAndSsl(domain: string) {
  if (!domain) return;

  setChecking(true);

  try {
    // 1. Verificar DNS
    const dnsRes = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
    const dnsData = await dnsRes.json();

    const cname = dnsData.Answer?.find((a: any) => a.type === 5);

    if (!cname || !cname.data.includes('gtm-gateway.esbilla.com')) {
      alert('⚠️ DNS no configurado correctamente.\n\nEl CNAME debe apuntar a: gtm-gateway.esbilla.com');
      return;
    }

    // 2. Verificar SSL
    const sslRes = await fetch(`https://${domain}/api/health`, { mode: 'no-cors' });

    alert('✅ DNS y SSL configurados correctamente.\n\nEl GTM Gateway está operativo.');

  } catch (error) {
    if (error.message.includes('net::ERR_CERT')) {
      alert('⏳ DNS configurado.\n\nEl certificado SSL aún se está provisionando. Espera 10-15 minutos.');
    } else {
      alert('❌ Error al verificar: ' + error.message);
    }
  } finally {
    setChecking(false);
  }
}
```

---

## 🏆 Feature Premium

### Actualizar Plans

**Archivo:** `config/plans.ts`

```typescript
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    maxSites: 1,
    maxConsentsPerMonth: 5000,
    features: {
      gtmGateway: false,  // ❌
      customDomain: false,
      prioritySupport: false,
    }
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: { monthly: 19, yearly: 190 },
    maxSites: 10,
    maxConsentsPerMonth: 100000,
    features: {
      gtmGateway: true,   // ✅
      customDomain: true,
      prioritySupport: false,
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: null, yearly: null },
    maxSites: -1,
    maxConsentsPerMonth: -1,
    features: {
      gtmGateway: true,   // ✅
      customDomain: true,
      prioritySupport: true,
    }
  }
};
```

### Validar en Dashboard

```typescript
const organization = organizations.find(o => o.id === formData.organizationId);
const canUseGtmGateway = organization?.plan === 'pro' || organization?.plan === 'enterprise';

{!canUseGtmGateway && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
      <div>
        <p className="font-semibold text-amber-900 mb-1">
          Feature Premium
        </p>
        <p className="text-sm text-amber-800">
          GTM Gateway requiere un plan Pro o Enterprise.
        </p>
        <a
          href="/plans"
          className="inline-block mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
        >
          Ver planes y precios →
        </a>
      </div>
    </div>
  </div>
)}
```

---

## 💰 Costes

### Cloud Load Balancer

- **Forwarding rules**: $0.025/hora × 730h = **$18.25/mes**
- **Tráfico**: $0.025/GB (Europa)
- **CDN** (opcional): $0.08/GB

### Ejemplo con 100 clientes

| Métrica | Valor | Coste |
|---------|-------|-------|
| Base LB | - | $18/mes |
| Tráfico (10 TB) | 10,000 GB | $250/mes |
| **Total** | - | **$268/mes** |
| **Por cliente** | - | **$2.68/mes** |

### Pricing Sugerido

- **Plan Pro**: $19/mes (incluye GTM Gateway)
- **Margen**: $19 - $2.68 = **$16.32/mes por cliente**
- **Con 100 clientes**: $1,632/mes de margen

---

## 📊 Monitoring

### Ver Certificados Activos

```bash
gcloud certificate-manager certificates list \
  --project=$PROJECT_ID \
  --format="table(name,state,domains)"
```

### Ver Logs del Load Balancer

```bash
gcloud logging read \
  "resource.type=http_load_balancer" \
  --project=$PROJECT_ID \
  --limit=50 \
  --format=json
```

### Métricas de Tráfico

```bash
gcloud monitoring time-series list \
  --filter='metric.type="loadbalancing.googleapis.com/https/request_count"' \
  --project=$PROJECT_ID
```

---

## ✅ Checklist de Setup

- [ ] APIs habilitadas (Certificate Manager, Compute)
- [ ] Certificate Map creado
- [ ] DNS Authorization verificado
- [ ] Certificado wildcard provisionado (ACTIVE)
- [ ] NEG de Cloud Run creado
- [ ] Backend Service con CDN configurado
- [ ] URL Map creado
- [ ] HTTPS Proxy con Certificate Map
- [ ] IP estática reservada
- [ ] Forwarding Rule creada
- [ ] DNS base configurado (gtm-gateway.esbilla.com)
- [ ] Test exitoso: `curl -I https://gtm-gateway.esbilla.com/api/health`

---

## 🎯 Siguiente Paso

Una vez completado este setup, puedes:

1. **Actualizar Dashboard** con instrucciones DNS
2. **Automatizar provisión** de certificados via API
3. **Marcar como premium** en planes
4. **Comunicar a clientes** la nueva feature

---

🌽 **Esbilla CMP** — Scalable GTM Gateway for thousands of domains
