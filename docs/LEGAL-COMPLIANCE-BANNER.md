# Cumplimiento Legal del Banner de Cookies - GDPR/ePrivacy

---

## ⚖️ DESCARGO DE RESPONSABILIDAD LEGAL

> **AVISO IMPORTANTE**: Este documento proporciona orientación técnica sobre implementación de
> consentimientos, pero **NO constituye asesoramiento legal**.
>
> **El cumplimiento legal con GDPR, ePrivacy y otras regulaciones es RESPONSABILIDAD EXCLUSIVA
> de cada organización que implemente este software.**
>
> Clica Online Soluciones S.L. y los colaboradores NO garantizan que el uso de este software
> resulte en cumplimiento legal. Cada organización debe:
> - Consultar con profesionales legales cualificados
> - Adaptar la implementación a su jurisdicción específica
> - Mantener textos legales actualizados
> - Asumir toda responsabilidad por el cumplimiento normativo
>
> Ver [LICENSE](../LICENSE) para términos completos.

---

## 📋 Requisitos Legales según GDPR y ePrivacy Directive

### Información Obligatoria en el Banner (Art. 13 GDPR)

El banner de consentimiento **DEBE** informar sobre:

1. **Identidad del Responsable** (Art. 13.1.a)
   - Nombre de la empresa/organización
   - Datos de contacto
   - CIF/NIF (opcional pero recomendado)

2. **Datos de Contacto del DPO** - si aplica (Art. 13.1.b)
   - Email del Delegado de Protección de Datos
   - Solo obligatorio si hay DPO designado

3. **Finalidades del Tratamiento** (Art. 13.1.c)
   - Analytics: "Análisis estadístico del uso del sitio"
   - Marketing: "Publicidad personalizada y remarketing"
   - Functional: "Funcionalidades avanzadas (chat, soporte)"

4. **Base Legal** (Art. 13.1.c)
   - Para cookies no esenciales: **Consentimiento (Art. 6.1.a)**
   - Para cookies esenciales: **Interés legítimo (Art. 6.1.f)**

5. **Destinatarios de los Datos** (Art. 13.1.e)
   - Lista de terceros: Google, Facebook, etc.
   - Transferencias internacionales (ej: "Datos transferidos a EEUU")

6. **Plazo de Conservación** (Art. 13.2.a)
   - Duración de las cookies (sesión, 30 días, 1 año, etc.)
   - Plazo de conservación de logs de consentimiento (3 años)

7. **Derechos del Usuario** (Art. 13.2.b)
   - Acceso, rectificación, supresión
   - Portabilidad, oposición
   - **Derecho a retirar el consentimiento** (importante para cookies)

8. **Derecho a Reclamar** (Art. 13.2.d)
   - Ante la Autoridad de Control (AEPD en España)

9. **Enlace a Política de Privacidad Completa** (Art. 13.2.a)
   - URL a documento legal detallado

---

## 🌐 Caso Especial: Cross-Domain Consent

### Requisito Legal

Cuando el consentimiento se comparte entre múltiples dominios del mismo responsable:

**DEBE informarse explícitamente:**
- Qué dominios comparten el consentimiento
- Que al dar consentimiento en un dominio, aplica a todos

### Ejemplo de Texto Legal Cross-Domain

```
Tu consentimiento se aplicará a los siguientes dominios propiedad de [Nombre Empresa]:
- www.ejemplo.com
- shop.ejemplo.com
- blog.ejemplo.com

Al aceptar, das tu consentimiento para el uso de cookies en todos estos sitios.
```

### Referencia Legal

- **EDPB Guidelines 05/2020** sobre consentimiento: El consentimiento debe ser "informado", lo que incluye informar sobre el alcance del consentimiento
- **CNIL (Francia)**: Multas por no informar sobre compartición cross-domain

---

## 🎯 Estado Actual de Esbilla CMP

### ✅ Lo que Ya Funciona

1. **Settings.tsx** - Sección "Legal Notice"
   - Campo: `legal.title` (ej: "Aviso Legal", "Privacy Policy")
   - Campo: `legal.content` (texto libre, markdown soportado)
   - Preview modal del contenido legal

2. **Almacenamiento en Firestore**
   - Ruta: `sites/{siteId}/settings.banner.legal`
   - Estructura:
     ```json
     {
       "title": "Política de Privacidad",
       "content": "Nosotros, [Empresa], utilizamos cookies..."
     }
     ```

3. **SDK lee configuración legal**
   - Línea 984: `config.legal = bannerSettings.legal`
   - Disponible para usar en templates

### ❌ Lo que Falta Implementar

1. **El banner NO muestra el enlace legal**
   - Los templates (`maiz.html`, `modal.html`, `bottom-bar.html`) no tienen enlace
   - No hay botón "Más información" o "Leer política"

2. **Falta información obligatoria GDPR**
   - No se muestra identidad del responsable
   - No se listan los destinatarios de datos (Google, Facebook, etc.)
   - No se mencionan los derechos del usuario

3. **No hay soporte para cross-domain notice**
   - No se puede configurar lista de dominios relacionados
   - No hay texto específico para caso multi-dominio

4. **Falta estructura de datos para cumplimiento completo**
   - No hay campos para: empresa, CIF, email contacto, DPO
   - No hay lista de cookies/scripts con finalidades
   - No hay configuración de plazos de conservación

---

## 🏗️ Propuesta de Implementación

### FASE 1: Enlace a Política de Privacidad (Rápido - 1-2h)

**Objetivo:** Añadir enlace "Más información" en el banner que abra modal con texto legal

#### 1.1. Actualizar Templates

**Archivo:** `esbilla-api/public/templates/maiz.html`

```html
<div id="esbilla-banner" class="esbilla-banner">
  <div id="esbilla-banner-inner" class="esbilla-inner">
    <div id="esbilla-banner-icon" class="esbilla-icon">{{icon}}</div>
    <div id="esbilla-banner-title" class="esbilla-title">{{title}}</div>
    <p id="esbilla-banner-description" class="esbilla-text">
      {{description}}
      <!-- NUEVO: Enlace a política de privacidad -->
      <a href="#" id="esbilla-legal-link" class="esbilla-legal-link">{{legalLinkText}}</a>
    </p>
    <div id="esbilla-banner-actions" class="esbilla-actions">
      <button id="esbilla-btn-accept" class="esbilla-btn esbilla-btn-primary">{{accept}}</button>
      <button id="esbilla-btn-settings" class="esbilla-btn esbilla-btn-secondary">{{settings}}</button>
      <button id="esbilla-btn-reject" class="esbilla-btn esbilla-btn-link">{{reject}}</button>
    </div>
  </div>
</div>

<!-- NUEVO: Modal de política de privacidad -->
<div id="esbilla-legal-modal" class="esbilla-legal-modal hidden">
  <div class="esbilla-legal-modal-content">
    <button id="esbilla-legal-close" class="esbilla-legal-close">×</button>
    <h2 id="esbilla-legal-title">{{legalTitle}}</h2>
    <div id="esbilla-legal-content" class="esbilla-legal-text">{{legalContent}}</div>
  </div>
</div>
```

#### 1.2. Actualizar SDK (pegoyu.js)

Añadir lógica para abrir/cerrar modal legal:

```javascript
// En la función de inicialización del banner
function initLegalModal() {
  const legalLink = document.getElementById('esbilla-legal-link');
  const legalModal = document.getElementById('esbilla-legal-modal');
  const legalClose = document.getElementById('esbilla-legal-close');

  if (legalLink && legalModal) {
    legalLink.addEventListener('click', (e) => {
      e.preventDefault();
      legalModal.classList.remove('hidden');
    });

    legalClose?.addEventListener('click', () => {
      legalModal.classList.add('hidden');
    });

    // Cerrar al hacer clic fuera del modal
    legalModal.addEventListener('click', (e) => {
      if (e.target === legalModal) {
        legalModal.classList.add('hidden');
      }
    });
  }
}
```

#### 1.3. Añadir Traducciones

**Archivo:** `esbilla-api/public/i18n/config.json`

```json
{
  "es": {
    "legalLinkText": "Más información",
    "legalTitle": "Política de Privacidad"
  },
  "en": {
    "legalLinkText": "Learn more",
    "legalTitle": "Privacy Policy"
  },
  "ast": {
    "legalLinkText": "Más información",
    "legalTitle": "Política de Privacidá"
  }
}
```

---

### FASE 2: Información Completa GDPR (Media - 4-6h)

**Objetivo:** Campos estructurados para cumplimiento GDPR completo

#### 2.1. Actualizar Type Definitions

**Archivo:** `esbilla-dashboard/src/types/index.ts`

```typescript
interface LegalInfo {
  // Identidad del Responsable (Art. 13.1.a)
  companyName: string;           // "Acme Corp S.L."
  taxId?: string;                 // "B12345678"
  address?: string;               // "C/ Mayor 1, Madrid"
  contactEmail: string;           // "legal@acme.com"

  // DPO - si aplica (Art. 13.1.b)
  dpoName?: string;               // "Juan Pérez"
  dpoEmail?: string;              // "dpo@acme.com"

  // Enlaces externos
  privacyPolicyUrl?: string;      // "https://acme.com/privacidad"
  cookiePolicyUrl?: string;       // "https://acme.com/cookies"

  // Texto personalizado para el banner
  bannerText?: string;            // Texto corto para el banner
  fullPolicyText?: string;        // Texto completo del modal

  // Cross-domain (si aplica)
  crossDomainEnabled: boolean;
  relatedDomains?: string[];      // ["acme.com", "shop.acme.com"]

  // Plazos de conservación
  consentRetentionDays: number;   // 1095 (3 años GDPR)

  // Autoridad de Control
  supervisoryAuthority: string;   // "AEPD" (España), "CNIL" (Francia), etc.
  supervisoryAuthorityUrl?: string; // "https://www.aepd.es"
}

interface BannerSettings {
  // ... campos existentes
  legal: LegalInfo;
}
```

#### 2.2. Actualizar Dashboard - Settings.tsx

Ampliar la sección "Legal Notice" con todos los campos:

```typescript
<section className="bg-white rounded-xl p-6 shadow-sm border border-stone-200">
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-red-100 rounded-lg">
      <FileText className="text-red-600" size={20} />
    </div>
    <div>
      <h2 className="text-lg font-semibold text-stone-800">Información Legal (GDPR)</h2>
      <p className="text-sm text-stone-500">Cumplimiento Art. 13 GDPR - Información obligatoria</p>
    </div>
  </div>

  <div className="space-y-6">
    {/* Responsable del Tratamiento */}
    <div className="border-b border-stone-200 pb-4">
      <h3 className="font-semibold text-stone-800 mb-3">Responsable del Tratamiento</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            value={legal.companyName}
            onChange={(e) => updateLegal('companyName', e.target.value)}
            placeholder="Acme Corp S.L."
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            CIF/NIF
          </label>
          <input
            type="text"
            value={legal.taxId}
            onChange={(e) => updateLegal('taxId', e.target.value)}
            placeholder="B12345678"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Dirección Postal
          </label>
          <input
            type="text"
            value={legal.address}
            onChange={(e) => updateLegal('address', e.target.value)}
            placeholder="C/ Mayor 1, 28001 Madrid"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email de Contacto *
          </label>
          <input
            type="email"
            value={legal.contactEmail}
            onChange={(e) => updateLegal('contactEmail', e.target.value)}
            placeholder="legal@acme.com"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
            required
          />
        </div>
      </div>
    </div>

    {/* DPO - Opcional */}
    <div className="border-b border-stone-200 pb-4">
      <h3 className="font-semibold text-stone-800 mb-3">
        Delegado de Protección de Datos (DPO)
        <span className="ml-2 text-xs text-stone-500 font-normal">Opcional</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Nombre del DPO
          </label>
          <input
            type="text"
            value={legal.dpoName}
            onChange={(e) => updateLegal('dpoName', e.target.value)}
            placeholder="Juan Pérez"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email del DPO
          </label>
          <input
            type="email"
            value={legal.dpoEmail}
            onChange={(e) => updateLegal('dpoEmail', e.target.value)}
            placeholder="dpo@acme.com"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg"
          />
        </div>
      </div>
    </div>

    {/* Cross-Domain */}
    <div className="border-b border-stone-200 pb-4">
      <h3 className="font-semibold text-stone-800 mb-3">Consentimiento Multi-Dominio</h3>
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={legal.crossDomainEnabled}
            onChange={(e) => updateLegal('crossDomainEnabled', e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-amber-500"
          />
          <span className="text-sm text-stone-700">
            Compartir consentimiento entre múltiples dominios
          </span>
        </label>

        {legal.crossDomainEnabled && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Dominios Relacionados (uno por línea)
            </label>
            <textarea
              value={legal.relatedDomains?.join('\n')}
              onChange={(e) => updateLegal('relatedDomains', e.target.value.split('\n').filter(Boolean))}
              placeholder="www.acme.com&#10;shop.acme.com&#10;blog.acme.com"
              rows={4}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-stone-500 mt-1">
              ⚠️ Se mostrará un aviso informando que el consentimiento aplica a todos estos dominios
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Texto del Banner */}
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        Texto Corto del Banner
      </label>
      <textarea
        value={legal.bannerText}
        onChange={(e) => updateLegal('bannerText', e.target.value)}
        placeholder="Utilizamos cookies propias y de terceros para mejorar nuestros servicios. Si continúas navegando, consideramos que aceptas su uso."
        rows={3}
        className="w-full px-3 py-2 border border-stone-200 rounded-lg"
      />
    </div>

    {/* Política Completa */}
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        Política de Privacidad Completa
      </label>
      <textarea
        value={legal.fullPolicyText}
        onChange={(e) => updateLegal('fullPolicyText', e.target.value)}
        placeholder="[Texto completo de la política de privacidad que aparecerá en el modal...]"
        rows={12}
        className="w-full px-3 py-2 border border-stone-200 rounded-lg font-mono text-sm"
      />
      <p className="text-xs text-stone-500 mt-1">
        💡 Tip: Puedes usar Markdown para formatear el texto
      </p>
    </div>

    {/* Generador Automático de Texto Legal */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">🤖 Generador Automático</h4>
      <p className="text-sm text-blue-700 mb-3">
        Genera automáticamente un texto legal completo cumpliendo con GDPR Art. 13
      </p>
      <button
        onClick={generateLegalText}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Generar Texto Legal Completo
      </button>
    </div>
  </div>
</section>
```

---

### FASE 3: Generador Automático de Texto Legal (Alta - 6-8h)

**Objetivo:** Función que genera texto legal completo basado en configuración

#### 3.1. Template de Texto Legal

**Archivo:** `esbilla-dashboard/src/utils/legalTextGenerator.ts`

```typescript
export function generateGDPRCompliantText(
  legal: LegalInfo,
  site: Site,
  scripts: ScriptConfig
): string {
  const sections = [];

  // 1. Responsable del Tratamiento
  sections.push(`
## 1. Responsable del Tratamiento de Datos

**Identidad:** ${legal.companyName}${legal.taxId ? ` (${legal.taxId})` : ''}
${legal.address ? `**Dirección:** ${legal.address}` : ''}
**Contacto:** ${legal.contactEmail}
${legal.dpoName ? `**DPO:** ${legal.dpoName} (${legal.dpoEmail})` : ''}
  `);

  // 2. Finalidades del Tratamiento
  const purposes = [];
  if (scripts.analytics) {
    purposes.push('- **Análisis estadístico:** Para conocer el uso del sitio y mejorar nuestros servicios');
  }
  if (scripts.marketing) {
    purposes.push('- **Marketing:** Para mostrar publicidad personalizada y medir su efectividad');
  }
  if (scripts.functional) {
    purposes.push('- **Funcionalidades avanzadas:** Para ofrecer servicios de soporte y comunicación');
  }

  sections.push(`
## 2. Finalidades del Tratamiento

Utilizamos cookies y tecnologías similares para:

${purposes.join('\n')}

**Base legal:** Tu consentimiento (Art. 6.1.a GDPR)
  `);

  // 3. Destinatarios de Datos (terceros)
  const recipients = extractRecipients(scripts);
  if (recipients.length > 0) {
    sections.push(`
## 3. Destinatarios de los Datos

Compartimos tus datos con los siguientes terceros:

${recipients.map(r => `- **${r.name}:** ${r.purpose} ${r.transfer ? '(Transferencia a ' + r.transfer + ')' : ''}`).join('\n')}

Estos terceros actúan como encargados o responsables del tratamiento según el servicio.
    `);
  }

  // 4. Cross-Domain Warning
  if (legal.crossDomainEnabled && legal.relatedDomains) {
    sections.push(`
## 4. Consentimiento Multi-Dominio

**⚠️ Importante:** Tu consentimiento se aplicará a los siguientes dominios de nuestra propiedad:

${legal.relatedDomains.map(d => `- ${d}`).join('\n')}

Al aceptar cookies en cualquiera de estos dominios, tu elección se sincronizará automáticamente en todos.
    `);
  }

  // 5. Plazos de Conservación
  sections.push(`
## 5. Plazos de Conservación

- **Cookies:** Según la duración específica de cada cookie (ver tabla detallada)
- **Registro de consentimiento:** ${legal.consentRetentionDays || 1095} días (3 años, según GDPR)
  `);

  // 6. Derechos del Usuario
  sections.push(`
## 6. Tus Derechos

Tienes derecho a:

- **Acceder** a tus datos personales
- **Rectificar** datos inexactos
- **Suprimir** tus datos ("derecho al olvido")
- **Limitar** el tratamiento de tus datos
- **Portar** tus datos a otro responsable
- **Oponerte** al tratamiento de tus datos
- **Retirar tu consentimiento** en cualquier momento

Para ejercer tus derechos, contacta: ${legal.contactEmail}
  `);

  // 7. Derecho a Reclamar
  const authority = legal.supervisoryAuthority || 'tu Autoridad de Control local';
  sections.push(`
## 7. Derecho a Reclamar

Si consideras que el tratamiento de tus datos no cumple con el GDPR, puedes presentar una reclamación ante ${authority}.
${legal.supervisoryAuthorityUrl ? `\n**Web:** ${legal.supervisoryAuthorityUrl}` : ''}
  `);

  // 8. Tabla de Cookies Detallada
  const cookieTable = generateCookieTable(scripts);
  sections.push(`
## 8. Tabla Detallada de Cookies

${cookieTable}
  `);

  return sections.join('\n\n---\n\n');
}

function extractRecipients(scripts: ScriptConfig) {
  const recipients = [];

  if (scripts.analytics?.googleAnalytics) {
    recipients.push({
      name: 'Google Analytics',
      purpose: 'Análisis estadístico del tráfico',
      transfer: 'EEUU (Google LLC)'
    });
  }

  if (scripts.marketing?.facebookPixel) {
    recipients.push({
      name: 'Meta (Facebook)',
      purpose: 'Publicidad personalizada',
      transfer: 'EEUU (Meta Platforms Inc.)'
    });
  }

  // ... añadir más terceros según configuración

  return recipients;
}

function generateCookieTable(scripts: ScriptConfig): string {
  const rows = [];

  rows.push('| Cookie | Finalidad | Duración | Categoría | Tercero |');
  rows.push('|--------|-----------|----------|-----------|---------|');

  // Cookies esenciales (siempre)
  rows.push('| `esbilla_consent` | Almacenar tu elección de cookies | 1 año | Esencial | - |');

  // Añadir según config
  if (scripts.analytics?.googleAnalytics) {
    rows.push('| `_ga` | Identificador único de usuario | 2 años | Analytics | Google |');
    rows.push('| `_ga_*` | Estado de sesión | 2 años | Analytics | Google |');
  }

  if (scripts.marketing?.facebookPixel) {
    rows.push('| `_fbp` | Identificador de navegador | 3 meses | Marketing | Meta |');
  }

  // ... más cookies según configuración

  return rows.join('\n');
}
```

---

## 📊 Prioridad de Implementación

### 🔥 **CRÍTICO - Hacer YA** (1-2 días)

**FASE 1: Enlace a Política de Privacidad**
- Riesgo legal: **ALTO** - Falta de información = multa GDPR
- Impacto: **ALTO** - Afecta a todos los clientes
- Complejidad: **BAJA**

**Tareas:**
1. Actualizar templates HTML con enlace "Más información"
2. Añadir modal para mostrar texto legal
3. Conectar con campo `legal.content` existente en Settings
4. Añadir traducciones

---

### ⚠️ **IMPORTANTE - Próxima Semana** (4-6 días)

**FASE 2: Información Completa GDPR**
- Riesgo legal: **MEDIO** - Información incompleta
- Impacto: **MEDIO** - Mejora compliance
- Complejidad: **MEDIA**

**Tareas:**
1. Ampliar type definitions con campos GDPR
2. Actualizar UI de Settings con formulario completo
3. Migración de datos existentes
4. Validación de campos obligatorios

---

### 💡 **NICE TO HAVE - Cuando Haya Tiempo** (6-8 días)

**FASE 3: Generador Automático**
- Riesgo legal: **BAJO** - Es una ayuda, no requisito
- Impacto: **MEDIO** - Facilita compliance a clientes
- Complejidad: **ALTA**

**Tareas:**
1. Implementar generador de texto legal
2. Templates por categoría de cookies
3. Lógica de detección de terceros
4. UI wizard para guiar al usuario

---

## 🎯 Caso de Uso: Cross-Domain

### Ejemplo Real

**Empresa:** Acme Corp S.L.
**Dominios:**
- www.acme.com (sitio principal)
- shop.acme.com (tienda online)
- blog.acme.com (blog corporativo)

### Configuración en Dashboard

```json
{
  "legal": {
    "crossDomainEnabled": true,
    "relatedDomains": [
      "www.acme.com",
      "shop.acme.com",
      "blog.acme.com"
    ]
  }
}
```

### Texto que se Muestra al Usuario

En el banner principal:

```
Utilizamos cookies propias y de terceros para mejorar nuestros servicios.

⚠️ Tu consentimiento se aplicará también a: shop.acme.com, blog.acme.com

[Aceptar] [Configurar] [Rechazar]
[Más información]
```

En el modal "Más información":

```
## Consentimiento Multi-Dominio

Tu consentimiento se aplicará automáticamente a los siguientes
dominios de nuestra propiedad:

- www.acme.com (sitio principal)
- shop.acme.com (tienda online)
- blog.acme.com (blog corporativo)

Esto significa que al aceptar cookies en cualquiera de estos sitios,
tu elección se sincronizará en todos ellos, evitando que tengas que
dar tu consentimiento múltiples veces.

Para más información sobre cómo gestionamos tus datos, consulta
nuestra Política de Privacidad completa.
```

---

## 📝 Checklist de Compliance Legal

### Mínimo Legal (FASE 1)

- [ ] Enlace "Más información" visible en el banner
- [ ] Modal con política de privacidad al hacer clic
- [ ] Nombre de la empresa visible
- [ ] Email de contacto disponible
- [ ] Mención a derechos del usuario (acceso, rectificación, supresión)

### Cumplimiento Completo (FASE 2)

- [ ] Identidad del responsable completa (nombre, CIF, dirección)
- [ ] DPO informado (si aplica)
- [ ] Finalidades del tratamiento por categoría
- [ ] Lista de destinatarios de datos (terceros)
- [ ] Plazos de conservación especificados
- [ ] Base legal del tratamiento (consentimiento Art. 6.1.a)
- [ ] Derechos del usuario detallados
- [ ] Información sobre Autoridad de Control
- [ ] **Cross-domain:** Lista de dominios relacionados (si aplica)
- [ ] **Cross-domain:** Aviso explícito sobre sincronización

### Excelencia (FASE 3)

- [ ] Tabla detallada de cookies (nombre, finalidad, duración)
- [ ] Generador automático de texto legal
- [ ] Personalización por idioma
- [ ] Versión PDF descargable de la política
- [ ] Historial de versiones de la política
- [ ] Consentimiento específico por finalidad (granular)

---

## 🔍 Referencias Legales

- **GDPR Art. 13:** Información que deberá facilitarse cuando los datos personales se obtengan del interesado
- **ePrivacy Directive 2002/58/EC Art. 5(3):** Consentimiento para cookies no esenciales
- **EDPB Guidelines 05/2020:** Consentimiento en el RGPD
- **CNIL (Francia):** Guías sobre cookies y trazadores
- **AEPD (España):** Guía sobre el uso de cookies
- **CJEU Case C-673/17 (Planet49):** Consentimiento para cookies debe ser activo e informado

---

## 💬 Notas de Implementación

### Migración de Datos Existentes

Los sitios que ya tienen configuración `legal.title` y `legal.content`
deben migrarse al nuevo esquema:

```typescript
// Migración automática en Settings.tsx
useEffect(() => {
  if (legal.content && !legal.fullPolicyText) {
    // Migrar contenido antiguo al nuevo campo
    setLegal({
      ...legal,
      fullPolicyText: legal.content,
      // Valores por defecto
      companyName: site.name || '',
      contactEmail: '',
      crossDomainEnabled: false,
      consentRetentionDays: 1095
    });
  }
}, [legal, site]);
```

### Backward Compatibility

El SDK debe soportar tanto el formato antiguo como el nuevo:

```javascript
// En pegoyu.js
const legalText = config.legal?.fullPolicyText
  || config.legal?.content  // Fallback al formato antiguo
  || 'No se ha configurado la política de privacidad';
```

---

**Próximo paso:** ¿Implementamos la FASE 1 (enlace + modal) primero para resolver el riesgo legal crítico?
