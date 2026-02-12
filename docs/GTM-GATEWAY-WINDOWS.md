# GTM Gateway Setup - Windows (PowerShell)

Guía para configurar el GTM Gateway en Windows usando PowerShell.

## 📋 Requisitos Previos

### 1. Instalar Google Cloud SDK

```powershell
# Descargar instalador desde:
# https://cloud.google.com/sdk/docs/install

# O con Chocolatey:
choco install gcloudsdk
```

**Verificar instalación:**
```powershell
gcloud --version
# Debe mostrar: Google Cloud SDK 400.0.0+
```

### 2. Autenticar con Google Cloud

```powershell
# Login
gcloud auth login

# Configurar proyecto
gcloud config set project esbilla-cmp

# Verificar configuración
gcloud config list
```

### 3. Verificar Permisos

Tu cuenta debe tener estos roles en GCP:
- **Compute Admin** - Para Load Balancer y Forwarding Rules
- **Certificate Manager Admin** - Para certificados SSL
- **Cloud Run Admin** - Para verificar el servicio

```powershell
# Verificar roles
gcloud projects get-iam-policy esbilla-cmp --flatten="bindings[].members" --filter="bindings.members:user:tu-email@ejemplo.com"
```

---

## 🚀 Configuración Inicial (Una vez)

### Paso 1: Ejecutar Script de Setup

```powershell
# Abrir PowerShell como Administrador
# Navegar al directorio del proyecto
cd c:\jlasolis\esbilla-cmp

# Ejecutar script de setup
.\scripts\setup-gtm-gateway.ps1 -ProjectId esbilla-cmp -Region europe-west4
```

**¿Qué hace este script?**
1. ✅ Habilita APIs necesarias (Compute, Certificate Manager, Cloud Run)
2. ✅ Reserva una IP global estática
3. ✅ Crea Serverless NEG (Network Endpoint Group) apuntando a Cloud Run
4. ✅ Crea Backend Service
5. ✅ Crea URL Map
6. ✅ Crea Certificate Map (vacío, se puebla con dominios de clientes)
7. ✅ Crea Target HTTPS Proxy
8. ✅ Crea Global Forwarding Rule (puerto 443)

**Output esperado:**
```
🚀 Configurando GTM Gateway Infrastructure...

📋 Configuración:
   Proyecto: esbilla-cmp
   Región: europe-west4
   Cloud Run Service: esbilla-api

✅ APIs habilitadas
✅ IP global reservada: 34.160.123.45

📝 IMPORTANTE: Configura este registro DNS para cada dominio de cliente:
   Tipo: A
   Host: gtm
   Valor: 34.160.123.45

✅ Infraestructura GTM Gateway configurada correctamente!
```

**Guarda la IP global**, la necesitarás para configurar DNS.

---

## 📝 Añadir Dominio de Cliente

### Paso 2: Configurar DNS del Cliente

Para cada cliente, configura un registro DNS A:

**Ejemplo en Cloudflare:**
1. Panel → DNS → Add Record
2. Type: `A`
3. Name: `gtm`
4. IPv4 address: `34.160.123.45` (la IP del Load Balancer)
5. Proxy status: DNS only (🟠 nube gris)
6. TTL: Auto
7. Save

**Resultado:** `gtm.clicaonline.com` → `34.160.123.45`

**Verificar DNS (PowerShell):**
```powershell
# Método 1: nslookup
nslookup gtm.clicaonline.com

# Método 2: Resolve-DnsName
Resolve-DnsName gtm.clicaonline.com

# Debe mostrar la IP del Load Balancer
```

### Paso 3: Añadir Dominio al GTM Gateway

```powershell
# Añadir dominio
.\scripts\add-client-domain.ps1 -Domain gtm.clicaonline.com -ProjectId esbilla-cmp
```

**¿Qué hace este script?**
1. ✅ Verifica que el DNS resuelve correctamente
2. ✅ Crea un certificado SSL automático (Let's Encrypt vía Google)
3. ✅ Crea una entrada en el Certificate Map
4. ✅ Espera a que el certificado se provisione (15-30 min)

**Output esperado:**
```
🔐 Añadiendo dominio al GTM Gateway: gtm.clicaonline.com

✅ DNS resuelve a: 34.160.123.45
✅ Certificado creado: cert-gtm-clicaonline-com
✅ Entrada creada en Certificate Map

⏳ Esperando aprovisionamiento de certificado SSL...
   Intento 1/60 - Estado: PROVISIONING
   Intento 2/60 - Estado: PROVISIONING
   ...
   Intento 15/60 - Estado: ACTIVE

✅ Certificado SSL aprovisionado correctamente!
✅ Dominio gtm.clicaonline.com añadido al GTM Gateway!
```

**Probar:**
```powershell
# Verificar SSL
curl https://gtm.clicaonline.com/gtm.js?id=GTM-TQBDZBR

# O con Invoke-WebRequest
Invoke-WebRequest -Uri "https://gtm.clicaonline.com/gtm.js?id=GTM-TQBDZBR" -UseBasicParsing
```

---

## 🔧 Gestión y Troubleshooting

### Listar Certificados

```powershell
# Listar todos los certificados
gcloud certificate-manager certificates list

# Ver detalles de un certificado
gcloud certificate-manager certificates describe cert-gtm-clicaonline-com
```

**Estados posibles:**
- `PROVISIONING` - Se está emitiendo (15-30 min)
- `ACTIVE` - Funcionando correctamente ✅
- `FAILED` - Error en la emisión ❌

### Listar Entradas del Certificate Map

```powershell
# Listar todas las entradas
gcloud certificate-manager maps entries list --map=gtm-gateway-cert-map

# Ver detalles de una entrada
gcloud certificate-manager maps entries describe entry-gtm-clicaonline-com --map=gtm-gateway-cert-map
```

### Eliminar Dominio

```powershell
# 1. Eliminar entrada del Certificate Map
gcloud certificate-manager maps entries delete entry-gtm-clicaonline-com --map=gtm-gateway-cert-map

# 2. Eliminar certificado
gcloud certificate-manager certificates delete cert-gtm-clicaonline-com

# 3. (Opcional) Eliminar registro DNS en el panel del cliente
```

### Verificar Load Balancer

```powershell
# Estado general
gcloud compute forwarding-rules describe gtm-gateway-forwarding-rule --global

# Backend service
gcloud compute backend-services describe gtm-gateway-backend --global

# URL Map
gcloud compute url-maps describe gtm-gateway-url-map --global
```

---

## 🐛 Troubleshooting

### Problema: DNS no resuelve

**Síntoma:**
```powershell
nslookup gtm.cliente.com
# No se puede encontrar gtm.cliente.com: Non-existent domain
```

**Solución:**
1. Verificar que el registro DNS A está configurado
2. Esperar propagación DNS (hasta 48h, usualmente <1h)
3. Usar DNS público para testing: `nslookup gtm.cliente.com 8.8.8.8`

### Problema: Certificado en FAILED

**Síntoma:**
```powershell
gcloud certificate-manager certificates describe cert-gtm-cliente-com
# state: FAILED
```

**Causas comunes:**
1. ❌ DNS no apunta a la IP correcta
2. ❌ Dominio no accesible públicamente
3. ❌ Firewall bloqueando puerto 80/443

**Solución:**
```powershell
# 1. Verificar DNS
nslookup gtm.cliente.com

# 2. Verificar conectividad
Test-NetConnection -ComputerName gtm.cliente.com -Port 443

# 3. Recrear certificado
gcloud certificate-manager certificates delete cert-gtm-cliente-com
.\scripts\add-client-domain.ps1 -Domain gtm.cliente.com
```

### Problema: Error "Permission Denied"

**Síntoma:**
```
ERROR: (gcloud.certificate-manager.certificates.create) PERMISSION_DENIED
```

**Solución:**
```powershell
# Verificar roles
gcloud projects get-iam-policy esbilla-cmp --filter="bindings.members:user:tu-email@gmail.com"

# Añadir rol (como propietario del proyecto)
gcloud projects add-iam-policy-binding esbilla-cmp `
  --member="user:tu-email@gmail.com" `
  --role="roles/certificatemanager.admin"
```

### Problema: Script bloqueado por Execution Policy

**Síntoma:**
```
.\scripts\setup-gtm-gateway.ps1 : File cannot be loaded because running scripts is disabled
```

**Solución:**
```powershell
# Verificar política actual
Get-ExecutionPolicy

# Cambiar política (solo esta sesión)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# O ejecutar con bypass
powershell -ExecutionPolicy Bypass -File .\scripts\setup-gtm-gateway.ps1
```

---

## 💰 Costos Estimados

Para **100 clientes** con GTM Gateway:

| Recurso | Costo/mes |
|---------|-----------|
| Load Balancer (Forwarding Rules) | $18 |
| Global IP | $0 (mientras esté en uso) |
| Egress Traffic (5GB/cliente = 500GB) | ~$50 |
| Certificados SSL (Let's Encrypt) | $0 |
| **TOTAL** | **~$68/mes** |

**Costo por cliente:** $0.68/mes

Con pricing de $19/mes → **Margen:** $18.32/cliente/mes (96%)

---

## 📊 Monitoreo

### Cloud Console

1. Ir a [Cloud Console](https://console.cloud.google.com)
2. Navegación → Load Balancing
3. Click en `gtm-gateway-lb`
4. Ver métricas:
   - Request count
   - Latency
   - Error rate
   - Backend health

### Logs

```powershell
# Logs de Cloud Run (backend)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=esbilla-api" --limit=50

# Logs de Load Balancer
gcloud logging read "resource.type=http_load_balancer" --limit=50
```

---

## 🔄 Automatización Desde Dashboard

Para integrar en el Dashboard y permitir que los usuarios activen GTM Gateway con 2 clicks:

### Backend API Endpoint (Node.js)

```javascript
// esbilla-api/src/routes/gtm-gateway.js
const { execSync } = require('child_process');

router.post('/api/gtm-gateway/enable', async (req, res) => {
  const { domain, siteId } = req.body;

  // Validar que el usuario es org_owner
  // ...

  try {
    // Ejecutar script PowerShell desde Node.js
    const result = execSync(
      `powershell -ExecutionPolicy Bypass -File ./scripts/add-client-domain.ps1 -Domain ${domain} -ProjectId esbilla-cmp`,
      { encoding: 'utf-8' }
    );

    // Actualizar Firestore
    await db.collection('sites').doc(siteId).update({
      gtmGatewayEnabled: true,
      gtmGatewayDomain: domain,
      gtmGatewayStatus: 'provisioning'
    });

    res.json({
      success: true,
      message: 'GTM Gateway activado. El certificado SSL se provisionará en 15-30 min.'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Dashboard (React)

```typescript
// Dashboard: Sites.tsx
async function enableGTMGateway(siteId: string, domain: string) {
  const response = await fetch('/api/gtm-gateway/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId, domain })
  });

  if (response.ok) {
    toast.success('GTM Gateway activado. Certificado SSL provisionándose...');
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Instalar Google Cloud SDK
- [ ] Autenticar con `gcloud auth login`
- [ ] Verificar permisos (Compute Admin, Certificate Manager Admin)
- [ ] Ejecutar `setup-gtm-gateway.ps1` (una vez)
- [ ] Guardar IP global del Load Balancer
- [ ] Para cada cliente:
  - [ ] Configurar DNS A record → IP del LB
  - [ ] Ejecutar `add-client-domain.ps1 -Domain gtm.cliente.com`
  - [ ] Esperar provisioning del certificado (15-30 min)
  - [ ] Probar con `curl https://gtm.cliente.com/gtm.js?id=GTM-XXX`
  - [ ] Configurar `gtmGatewayDomain` en Dashboard

---

## 📚 Recursos

- [Google Cloud Load Balancing](https://cloud.google.com/load-balancing/docs)
- [Certificate Manager](https://cloud.google.com/certificate-manager/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [PowerShell Docs](https://learn.microsoft.com/en-us/powershell/)

---

**Desarrollado con ❤️ en Asturias 🌽**
