# Google Tag Manager Gateway - Guía de Implementación

**Fecha:** 2026-02-07
**Versión Esbilla CMP:** 1.8+

---

## 📖 ¿Qué es GTM Gateway?

**Google Tag Manager Gateway** es una solución que permite cargar los scripts de GTM desde **tu propio dominio** en lugar de desde `googletagmanager.com`. Esto mejora:

- 🚫 **Evita ad blockers** - Los bloqueadores de anuncios no bloquean tu dominio
- 🔒 **Mejor privacidad** - Control total sobre la carga de scripts
- ⚡ **Menor latencia** - CDN más cercano a tus usuarios
- 🍪 **Cookies first-party** - Mejora duración de cookies
- 📊 **Más datos** - Menos pérdida de tracking por bloqueadores

---

## 🆚 GTM Gateway vs GTM Server Side

Ambos son complementarios pero tienen propósitos diferentes:

| Característica | GTM Gateway | GTM Server Side |
|----------------|-------------|-----------------|
| **Qué hace** | Carga el script GTM desde tu dominio | Envía eventos a tu servidor |
| **URL afectada** | Script tag `<script src="...">` | Endpoint de eventos |
| **Configuración** | DNS + Verificación | Servidor propio GTM |
| **Beneficio principal** | Evita ad blockers | Control de datos |
| **Complejidad** | Media | Alta |
| **Costo** | Solo dominio | Servidor + infraestructura |

**Recomendación:** Usar **ambos** para máxima privacidad y control.

---

## 🔧 Configuración en Esbilla CMP

### Paso 1: Crear Subdominio

1. **Elige un subdominio:**
   - Ejemplo: `gtm.tudominio.com` o `analytics.tudominio.com`
   - Debe ser un subdominio de tu dominio principal

2. **Crea registro DNS CNAME:**
   ```
   Tipo: CNAME
   Nombre: gtm (o analytics)
   Valor: googletagmanager.com
   TTL: 3600
   ```

3. **Verifica propagación:**
   ```bash
   # Linux/Mac
   dig gtm.tudominio.com CNAME

   # Windows
   nslookup -type=CNAME gtm.tudominio.com
   ```

### Paso 2: Archivo de Verificación

Google requiere un archivo de verificación en tu servidor:

**Ubicación:** `/.well-known/gateway/gtm-verification.txt`

**Contenido:** Tu Container ID de GTM (ejemplo: `GTM-XXXXX`)

#### Opción A: En Esbilla API (recomendado)

Si usas Esbilla API en tu dominio, añade este endpoint:

```javascript
// esbilla-api/src/app.js
app.get('/.well-known/gateway/gtm-verification.txt', (req, res) => {
  // Obtener el Container ID desde tu configuración
  const containerId = process.env.GTM_CONTAINER_ID || 'GTM-XXXXX';
  res.type('text/plain');
  res.send(containerId);
});
```

#### Opción B: Archivo Estático

Crea el archivo en tu servidor web:

```bash
mkdir -p .well-known/gateway
echo "GTM-XXXXX" > .well-known/gateway/gtm-verification.txt
```

### Paso 3: Configurar en Google Tag Manager

1. Ir a **Admin** → **Container Settings**
2. Buscar sección **"Tagging Settings"**
3. Activar **"Enable custom tagging paths"**
4. Añadir tu subdominio: `https://gtm.tudominio.com`
5. Google verificará automáticamente el archivo

### Paso 4: Configurar en Dashboard Esbilla

1. Ir a **Sites** → Editar sitio
2. Buscar sección **"Google Tag Manager Gateway"**
3. Marcar checkbox **"Habilitar GTM Gateway"**
4. Introducir:
   - **Gateway Domain:** `gtm.tudominio.com` (sin https://)
   - **Container ID:** `GTM-XXXXX`
5. Guardar

### Paso 5: Verificar Implementación

El SDK de Esbilla cargará automáticamente GTM desde tu dominio:

```html
<!-- Antes (sin Gateway) -->
<script src="https://www.googletagmanager.com/gtm.js?id=GTM-XXXXX"></script>

<!-- Después (con Gateway) -->
<script src="https://gtm.tudominio.com/gtm.js?id=GTM-XXXXX"></script>
```

**Verificar en navegador:**
1. Abrir DevTools → Network
2. Buscar peticiones `gtm.js`
3. Debe cargarse desde `gtm.tudominio.com`

---

## 🔐 Certificado SSL

**Importante:** Tu subdominio DEBE tener certificado SSL válido.

### Con Let's Encrypt (gratis)

```bash
certbot certonly --webroot -w /var/www/html -d gtm.tudominio.com
```

### Con Cloudflare (automático)

Si usas Cloudflare como DNS:
1. El certificado SSL se genera automáticamente
2. Asegúrate que el proxy esté habilitado (naranja)

---

## 📊 Integración con Server Side

Puedes combinar Gateway + Server Side para máxima privacidad:

```typescript
// Configuración en Dashboard
{
  // GTM Gateway - Carga del script
  gtmGatewayEnabled: true,
  gtmGatewayDomain: 'gtm.tudominio.com',
  gtmContainerId: 'GTM-XXXXX',

  // GTM Server Side - Envío de eventos
  gtmServerUrl: 'https://gtm-server.tudominio.com'
}
```

**Flujo completo:**
1. Script cargado desde `gtm.tudominio.com` (Gateway)
2. Usuario acepta cookies en Esbilla CMP
3. GTM se activa y envía eventos a `gtm-server.tudominio.com` (Server Side)
4. Tu servidor procesa y envía a Google Analytics

---

## 🐛 Troubleshooting

### Error: "Failed to load GTM script"

**Causa:** DNS no propagado o certificado SSL inválido

**Solución:**
1. Verificar CNAME: `nslookup gtm.tudominio.com`
2. Verificar SSL: `curl -I https://gtm.tudominio.com`
3. Esperar propagación DNS (hasta 48h)

### Error: "Verification failed"

**Causa:** Archivo de verificación no accesible

**Solución:**
1. Verificar URL: `https://tudominio.com/.well-known/gateway/gtm-verification.txt`
2. Debe devolver solo el Container ID (sin HTML, sin headers extra)
3. Content-Type debe ser `text/plain`

### GTM no se carga desde el subdominio

**Causa:** Configuración incorrecta en GTM Console

**Solución:**
1. Ir a GTM → Admin → Container Settings
2. Verificar que "Enable custom tagging paths" está activado
3. Añadir el dominio completo con https://
4. Esperar 5-10 minutos para que se propague

### Ad blockers siguen bloqueando

**Causa:** Subdominio incluido en listas de bloqueo

**Solución:**
1. **No usar palabras obvias** como:
   - `analytics.tudominio.com` ❌
   - `tracking.tudominio.com` ❌
   - `gtm.tudominio.com` ⚠️ (puede ser bloqueado)
2. **Mejor usar nombres neutros:**
   - `cdn.tudominio.com` ✅
   - `assets.tudominio.com` ✅
   - `api.tudominio.com` ✅

---

## 🎯 Mejores Prácticas

### Seguridad

✅ **Siempre usar HTTPS** - Obligatorio para GTM Gateway
✅ **Validar Certificate Pinning** - Si usas apps móviles
✅ **Renovar certificados SSL** - Configurar auto-renovación
✅ **HSTS header** - `Strict-Transport-Security: max-age=31536000`

### Rendimiento

✅ **CDN delante del subdominio** - Cloudflare, Fastly, etc.
✅ **Cache headers correctos** - GTM scripts son cacheables
✅ **HTTP/2 o HTTP/3** - Mejora latencia
✅ **Preconnect en HTML** - `<link rel="preconnect" href="https://gtm.tudominio.com">`

### Privacidad

✅ **Informar en política de privacidad** - Menciona el uso de tu subdominio
✅ **Respetar DNT (Do Not Track)** - Si el usuario lo activa
✅ **Cookie Consent** - Esbilla CMP maneja esto automáticamente

---

## 📚 Referencias

- [GTM Gateway - Guía oficial de Google](https://developers.google.com/tag-platform/tag-manager/gateway/setup-guide)
- [DNS CNAME Records](https://en.wikipedia.org/wiki/CNAME_record)
- [Let's Encrypt Certbot](https://certbot.eff.org/)
- [Cloudflare SSL/TLS](https://www.cloudflare.com/ssl/)

---

## 🆘 Soporte

**Documentación:** `docs/` folder
**Issues:** GitHub Issues
**Email:** esbilla@clicaonline.com

---

🌽 **Esbilla CMP** — Consent management made in Asturias
