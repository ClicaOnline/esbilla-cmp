const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const compression = require('compression');

// Inicialización de Firebase Admin
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de la BBDD
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'esbilla-cmp';
// NOTA: Los IDs de bases de datos nombradas NO llevan paréntesis
// Solo '(default)' usa paréntesis para la base de datos por defecto
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'esbilla-cmp';

// Inicializar Firebase solo si nun ta yá inicializáu
let db = null;
if (!admin.apps.length) {
  // En Cloud Run, les credenciales cárguense automáticamente
  // En local, pue usase GOOGLE_APPLICATION_CREDENTIALS o un ficheru JSON
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    admin.initializeApp({ projectId: PROJECT_ID });
    // Usar la BBDD específica si nun ye la default
    db = getFirestore(admin.app(), DATABASE_ID);
    console.log(`🔥 Firestore conectáu: proyecto=${PROJECT_ID}, database=${DATABASE_ID}`);
  } else {
    // Fallback pa desarrollo local sin credenciales
    console.warn('⚠️ Firebase nun ta configuráu. Los logs de consentimientu nun se guardarán.');
  }
} else {
  db = getFirestore(admin.app(), DATABASE_ID);
}

const app = express();

// ============================================
// SECURITY: RATE LIMITING (Anti-spam)
// ============================================
// Límite de peticiones por IP para prevenir spam/DoS
// Funciona en memoria (adecuado para Cloud Run con autoscaling)

const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30; // máx 30 req/min por IP (suficiente para uso normal)

/**
 * Middleware de rate limiting por IP
 * Retorna 429 si se excede el límite
 */
function rateLimitMiddleware(req, res, next) {
  // Obtener IP del cliente (considerando proxies)
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection?.remoteAddress ||
                   req.ip ||
                   'unknown';

  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Obtener o crear registro para esta IP
  let record = rateLimitStore.get(clientIp);
  if (!record || record.windowStart < windowStart) {
    record = { windowStart: now, count: 0 };
  }

  record.count++;
  rateLimitStore.set(clientIp, record);

  // Limpiar registros antiguos periódicamente (cada 100 requests)
  if (rateLimitStore.size > 1000) {
    for (const [ip, r] of rateLimitStore.entries()) {
      if (r.windowStart < windowStart) {
        rateLimitStore.delete(ip);
      }
    }
  }

  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[RateLimit] IP ${clientIp} excedió límite: ${record.count}/${RATE_LIMIT_MAX_REQUESTS} req/min`);
    return res.status(429).json({
      error: 'Demasiadas peticiones',
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Límite de ${RATE_LIMIT_MAX_REQUESTS} peticiones por minuto excedido. Intenta de nuevo en unos segundos.`,
      retryAfter: Math.ceil((record.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  next();
}

// ============================================
// SECURITY: REQUEST VALIDATION (Anti-bot)
// ============================================
// Validaciones básicas para detectar requests no-navegador

/**
 * Middleware para validar que el request parece venir de un navegador real
 */
function validateBrowserRequest(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';

  // Rechazar requests sin User-Agent (bots básicos)
  if (!userAgent || userAgent.length < 10) {
    console.warn('[Security] Request sin User-Agent válido');
    return res.status(400).json({
      error: 'Request inválido',
      code: 'INVALID_REQUEST',
      message: 'Falta información del navegador'
    });
  }

  // Detectar User-Agents sospechosos (curl, wget, scripts)
  const suspiciousPatterns = [
    /^curl\//i,
    /^wget\//i,
    /^python-requests\//i,
    /^axios\//i,
    /^node-fetch/i,
    /^Go-http-client/i,
    /^Java\//i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    console.warn(`[Security] User-Agent sospechoso: ${userAgent.substring(0, 50)}`);
    return res.status(403).json({
      error: 'Acceso denegado',
      code: 'SUSPICIOUS_CLIENT',
      message: 'Este endpoint solo acepta peticiones desde navegadores'
    });
  }

  next();
}

// ============================================
// SECURITY: DOMAIN WHITELIST CACHE & VALIDATION
// ============================================

// Cache de dominios permitidos por siteId (TTL: 5 minutos)
const domainCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

// Dominios siempre permitidos (desarrollo y dashboard)
const ALWAYS_ALLOWED_ORIGINS = [
  'https://esbilla.com',
  'https://api.esbilla.com',
  'https://dashboard.esbilla.com',
  'http://localhost:4321',
  'http://localhost:3000',
  'http://localhost:5173'
];

/**
 * Obtiene los dominios permitidos para un siteId desde Firestore (con caché)
 * @param {string} siteId - ID del sitio
 * @returns {Promise<string[]>} - Array de dominios permitidos
 */
async function getAllowedDomainsForSite(siteId) {
  if (!siteId || !db) return [];

  // Verificar caché
  const cached = domainCache.get(siteId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.domains;
  }

  try {
    const siteDoc = await db.collection('sites').doc(siteId).get();
    if (siteDoc.exists) {
      const siteData = siteDoc.data();
      // Los dominios están en el campo 'domains' del sitio
      const domains = siteData.domains || [];

      // Guardar en caché
      domainCache.set(siteId, {
        domains,
        timestamp: Date.now()
      });

      return domains;
    }
  } catch (err) {
    console.warn(`[Security] Error obteniendo dominios para ${siteId}:`, err.message);
  }

  return [];
}

/**
 * Normaliza un dominio para comparación (elimina protocolo y www)
 * @param {string} domain - Dominio o URL a normalizar
 * @returns {string} - Dominio normalizado
 */
function normalizeDomain(domain) {
  if (!domain) return '';
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')  // Eliminar protocolo
    .replace(/^www\./, '')         // Eliminar www.
    .replace(/:\d+$/, '')          // Eliminar puerto
    .replace(/\/.*$/, '');         // Eliminar path
}

/**
 * Verifica si un dominio está en la lista de permitidos
 * Soporta wildcards (*.ejemplo.com) y subdominios
 * @param {string} requestDomain - Dominio de la petición
 * @param {string[]} allowedDomains - Lista de dominios permitidos
 * @returns {boolean}
 */
function isDomainAllowed(requestDomain, allowedDomains) {
  const normalizedRequest = normalizeDomain(requestDomain);

  for (const allowed of allowedDomains) {
    const normalizedAllowed = normalizeDomain(allowed);

    // Coincidencia exacta
    if (normalizedRequest === normalizedAllowed) {
      return true;
    }

    // Wildcard: *.ejemplo.com permite subdominios
    if (normalizedAllowed.startsWith('*.')) {
      const baseDomain = normalizedAllowed.substring(2);
      if (normalizedRequest === baseDomain || normalizedRequest.endsWith('.' + baseDomain)) {
        return true;
      }
    }

    // También permitir subdominios del dominio registrado
    if (normalizedRequest.endsWith('.' + normalizedAllowed)) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene todos los dominios registrados en todos los sitios (para CORS dinámico)
 * @returns {Promise<string[]>}
 */
async function getAllRegisteredDomains() {
  if (!db) return [];

  // Verificar caché global
  const cached = domainCache.get('__ALL_DOMAINS__');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.domains;
  }

  try {
    const sitesSnapshot = await db.collection('sites').get();
    const allDomains = new Set();

    sitesSnapshot.forEach((doc) => {
      const data = doc.data();
      (data.domains || []).forEach(domain => {
        allDomains.add(normalizeDomain(domain));
        // También añadir con www
        allDomains.add('www.' + normalizeDomain(domain));
      });
    });

    const domains = Array.from(allDomains);

    // Guardar en caché
    domainCache.set('__ALL_DOMAINS__', {
      domains,
      timestamp: Date.now()
    });

    return domains;
  } catch (err) {
    console.warn('[Security] Error obteniendo todos los dominios:', err.message);
    return [];
  }
}

// ============================================
// CORS DINÁMICO CON WHITELIST
// ============================================
const corsOptions = {
  origin: async function (origin, callback) {
    // Permitir peticiones sin origin (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Dominios siempre permitidos (desarrollo y dashboard)
    if (ALWAYS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Comprobar si el origen está registrado en algún sitio
    try {
      const registeredDomains = await getAllRegisteredDomains();
      const normalizedOrigin = normalizeDomain(origin);

      if (registeredDomains.some(domain =>
        normalizedOrigin === domain ||
        normalizedOrigin.endsWith('.' + domain) ||
        domain.endsWith('.' + normalizedOrigin)
      )) {
        return callback(null, true);
      }
    } catch (err) {
      console.warn('[CORS] Error verificando origen:', err.message);
    }

    // Rechazar origen no autorizado
    console.warn(`[CORS] Origen bloqueado: ${origin}`);
    callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Compresión Brotli/Gzip (reduce egress significativamente)
// Crítico para GTM Gateway proxy (reduce 80KB → 20KB)
app.use(compression({
  level: 6,           // Balance entre compresión y CPU
  threshold: 1024,    // Solo comprimir si >1KB
  filter: (req, res) => {
    // Comprimir todo excepto imágenes ya comprimidas
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use((req, res, next) => {
  // Indica a los robots que ni siquiera intenten seguir enlaces en esta página
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

app.use(express.json());

// Servir ficheros estáticos del SDK
app.use('/', express.static(path.join(__dirname, '../public')));

// Servir el Dashboard (SPA)
const dashboardPath = path.join(__dirname, '../public/dashboard');
app.use('/dashboard', express.static(dashboardPath));

// SPA fallback: toles rutas del dashboard devuelven index.html
app.get('/dashboard/{*path}', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

// ============================================
// GDPR-COMPLIANT HASHING FUNCTIONS
// ============================================

// Hash anónimu del IP pa soberanía de datos
function hashIP(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip + 'esbilla-salt').digest('hex').substring(0, 16);
}

// Genera un hash SHA-256 anónimo del usuario basado en footprintId + IP + User-Agent
// Este hash es irreversible y cumple con GDPR (no almacena datos personales)
function generateUserHash(footprintId, ip, userAgent) {
  const data = `${footprintId || 'unknown'}:${ip || 'unknown'}:${userAgent || 'unknown'}`;
  return crypto.createHash('sha256').update(data + 'esbilla-gdpr-salt').digest('hex');
}

// Calcula la fecha de expiración para TTL (3 años = 1095 días)
const CONSENT_RETENTION_DAYS = 1095; // 3 años según GDPR
function calculateExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CONSENT_RETENTION_DAYS);
  return expiresAt;
}

// Cargar configuración por defeutu
const fs = require('fs');
const defaultConfigPath = path.join(__dirname, '../public/config/default.json');
let defaultConfig = {};
try {
  defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
} catch (err) {
  console.warn('⚠️ Non se pudo cargar config/default.json');
}

// ============================================
// RUTA: GTM Gateway Verification File
// ============================================
/**
 * Endpoint para verificación de GTM Gateway
 * Google requiere un archivo /.well-known/gateway/gtm-verification.txt
 * que contenga el Container ID (GTM-XXXXX)
 *
 * NOTA: Este endpoint está en la API de Esbilla como referencia,
 * pero el cliente debe servir este archivo desde SU dominio principal.
 *
 * Uso: /.well-known/gateway/gtm-verification.txt?domain=tudominio.com
 */
app.get('/.well-known/gateway/gtm-verification.txt', async (req, res) => {
  const domain = req.query.domain || req.get('host');

  if (!db) {
    return res.status(503).type('text/plain').send('Service temporarily unavailable');
  }

  try {
    // Buscar sitio por dominio
    const sitesSnapshot = await db.collection('sites')
      .where('domains', 'array-contains', domain)
      .limit(1)
      .get();

    if (sitesSnapshot.empty) {
      return res.status(404).type('text/plain').send('Site not found');
    }

    const siteData = sitesSnapshot.docs[0].data();
    const containerId = siteData.scriptConfig?.gtm?.containerId;

    if (!containerId) {
      return res.status(404).type('text/plain').send('GTM Container ID not configured');
    }

    // Devolver solo el Container ID (formato requerido por Google)
    res.type('text/plain').send(containerId);
  } catch (err) {
    console.error('[GTM Gateway] Error:', err);
    res.status(500).type('text/plain').send('Internal server error');
  }
});

// Ruta: Configuración del sitiu por ID
app.get('/api/config/:id', async (req, res) => {
  const { id } = req.params;

  // Cache control: no cachear la config para que cambios se reflejen inmediatamente
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  // 1. Intentar cargar config personalizada de Firestore
  if (db) {
    try {
      const siteDoc = await db.collection('sites').doc(id).get();
      if (siteDoc.exists) {
        const siteConfig = siteDoc.data();
        return res.json({
          id,
          ...defaultConfig,
          ...siteConfig,
          _source: 'firestore'
        });
      }
    } catch (err) {
      console.warn(`Error cargando config de Firestore pa ${id}:`, err.message);
    }
  }

  // 2. Fallback: devolver config por defeutu
  res.json({
    id,
    ...defaultConfig,
    _source: 'default'
  });
});

// ============================================
// RUTA: REGISTRO DE CONSENTIMIENTO (GDPR-COMPLIANT)
// ============================================
// IMPORTANTE: Siempre crea un nuevo documento (nunca sobrescribe)
// para mantener un registro de auditoría completo según GDPR.
// Los documentos se eliminan automáticamente después de 3 años
// mediante la política TTL de Firestore en el campo 'expiresAt'.
//
// SECURITY: Validación de origen
// - Verifica que el dominio desde el que se envía el hit está en
//   la lista de dominios permitidos del sitio en Firestore.
// - Si no coincide, devuelve 403 Forbidden.
//
// SECURITY: Rate limiting + validación de navegador
// - Límite de 30 req/min por IP
// - Rechaza requests sin User-Agent válido o con clientes sospechosos
// ============================================
app.post('/api/consent/log', rateLimitMiddleware, validateBrowserRequest, async (req, res) => {
  const {
    // Campos nuevos (SDK v1.1+)
    siteId,
    // apiKey eliminado en SDK v1.4 - seguridad basada en dominio + rate limiting
    footprintId,
    choices,
    action,
    metadata,
    timestamp,
    // Atribución de marketing (SDK v1.3+)
    attribution,
    // Campos legacy (retrocompatibilidad)
    cmpId,
    lang,
    userAgent: legacyUserAgent
  } = req.body;

  // Usar siteId o cmpId (retrocompatibilidad)
  const projectId = siteId || cmpId;

  // Validación básica
  if (!projectId || !choices) {
    return res.status(400).json({
      error: 'Falten datos obligatorios (siteId/cmpId, choices)',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // ============================================
  // SECURITY: VALIDACIÓN DE DOMINIO DE ORIGEN
  // ============================================
  // Obtener el dominio desde el que se hace la petición
  const requestOrigin = req.headers.origin || req.headers.referer;
  const requestDomain = metadata?.domain || normalizeDomain(requestOrigin);

  // Verificar dominios permitidos para este sitio
  if (db && requestDomain) {
    try {
      const allowedDomains = await getAllowedDomainsForSite(projectId);

      // Si el sitio tiene dominios configurados, validar
      if (allowedDomains.length > 0) {
        const isAllowed = isDomainAllowed(requestDomain, allowedDomains);

        if (!isAllowed) {
          console.warn(`[Security] Dominio bloqueado: ${requestDomain} para siteId: ${projectId}. Permitidos: ${allowedDomains.join(', ')}`);
          return res.status(403).json({
            error: 'Dominio no autorizado',
            code: 'DOMAIN_NOT_ALLOWED',
            message: `El dominio '${requestDomain}' no está autorizado para el sitio '${projectId}'`
          });
        }
      }
      // Si no hay dominios configurados, permitir (modo desarrollo/legacy)
    } catch (err) {
      console.warn('[Security] Error validando dominio:', err.message);
      // En caso de error, permitir para no bloquear consentimientos legítimos
    }
  }

  // Obtener IP y User-Agent
  const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const clientUserAgent = metadata?.userAgent || legacyUserAgent || req.headers['user-agent'] || 'unknown';

  // Generar hash anónimo del usuario (GDPR-compliant)
  const userHash = generateUserHash(footprintId, clientIP, clientUserAgent);

  // Determinar la versión del banner
  const bannerVersion = metadata?.sdkVersion || metadata?.consentVersion || '1.0';

  // Fecha de expiración para TTL (3 años)
  const expiresAt = calculateExpiresAt();

  // Construir el registro de consentimiento GDPR-compliant
  // NOTA: Siempre creamos un nuevo documento para mantener auditoría
  const consentRecord = {
    // Identificadores del proyecto
    siteId: projectId,
    projectId: projectId, // Alias para queries

    // Versión del banner (para auditoría de cambios de política)
    bannerVersion,

    // Hash anónimo del usuario (SHA-256, irreversible)
    userHash,

    // Footprint ID (identificador del navegador/dispositivo)
    footprintId: footprintId || null,

    // Elecciones del usuario
    choices: {
      analytics: choices.analytics || false,
      marketing: choices.marketing || false,
      ...choices // Categorías personalizadas
    },

    // Tipo de acción para auditoría
    action: action || 'unknown',

    // Metadata enriquecida (sin datos personales identificables)
    metadata: {
      domain: metadata?.domain || null,
      pageUrl: metadata?.pageUrl || null,
      referrer: metadata?.referrer || null,
      language: metadata?.language || lang || 'unknown',
      timezone: metadata?.timezone || null,
      screenWidth: metadata?.screenWidth || null,
      screenHeight: metadata?.screenHeight || null,
      sdkVersion: metadata?.sdkVersion || null,
      consentVersion: metadata?.consentVersion || '1.0'
    },

    // Hash del IP (no el IP real, cumple GDPR)
    ipHash: hashIP(clientIP),

    // User-Agent (para estadísticas de navegadores)
    userAgent: clientUserAgent,

    // Timestamps
    timestamp: timestamp || new Date().toISOString(),
    createdAt: admin.apps.length ? admin.firestore.FieldValue.serverTimestamp() : new Date(),

    // Campo TTL para eliminación automática (36 meses = 3 años)
    // IMPORTANTE: Configurar TTL Policy en Firebase Console usando este campo
    // La política TTL eliminará automáticamente documentos cuando deleteAt < now()
    expiresAt: admin.apps.length ? admin.firestore.Timestamp.fromDate(expiresAt) : expiresAt,
    deleteAt: admin.apps.length ? admin.firestore.Timestamp.fromDate(expiresAt) : expiresAt,

    // Atribución de marketing (SDK v1.3+)
    // Solo presente cuando el usuario acepta marketing y hay datos de UTM/click IDs
    attribution: attribution || null
  };

  // Si Firestore ta disponible, guardar nel hórreu
  if (db) {
    try {
      // SIEMPRE usamos .add() para crear un nuevo documento
      // Esto garantiza el audit trail (nunca sobrescribimos)
      const docRef = await db.collection('consents').add(consentRecord);

      // Actualizar estadísticas pre-agregadas diarias (optimización de costes)
      // Esto permite consultar stats sin leer toda la colección de consents
      updateDailyStats(projectId, choices, action || 'unknown', metadata).catch(err => {
        console.warn('Error actualizando stats diarios:', err.message);
      });

      // Actualizar estadísticas del sitio (legacy, opcional)
      updateSiteStats(projectId).catch(err => {
        console.warn('Error actualizando stats:', err.message);
      });

      return res.status(201).json({
        status: 'esbilláu',
        message: 'Consentimiento registrado correctamente',
        docId: docRef.id,
        expiresAt: expiresAt.toISOString()
      });
    } catch (err) {
      console.error('Error guardando en Firestore:', err);
      return res.status(500).json({
        error: 'Error interno al guardar el consentimiento',
        code: 'FIRESTORE_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  // Fallback si Firestore nun ta configuráu (desarrollo local)
  console.log('📝 Consent log (local):', JSON.stringify(consentRecord, null, 2));
  return res.status(201).json({
    status: 'esbilláu',
    message: 'Log guardáu (modo local - sin Firestore)',
    expiresAt: expiresAt.toISOString()
  });
});

// ============================================
// PRE-AGREGACIÓN: CONTADORES EN TIEMPO REAL
// ============================================
// Optimización de costes: en lugar de consultar la colección completa,
// mantenemos contadores diarios pre-agregados que se incrementan
// con cada consentimiento. Esto reduce las lecturas de N docs a 1 doc.
// Documento: stats/{siteId}_daily_{YYYY-MM-DD}
// ============================================

/**
 * Actualiza las estadísticas diarias pre-agregadas
 * @param {string} siteId - ID del sitio
 * @param {object} choices - Elecciones del usuario {analytics, marketing}
 * @param {string} action - Tipo de acción (accept_all, reject_all, customize, update)
 * @param {object} metadata - Metadata del consentimiento
 */
async function updateDailyStats(siteId, choices, action, metadata) {
  if (!db || !siteId) return;

  // Obtener fecha actual en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const statsDocId = `${siteId}_daily_${today}`;
  const statsRef = db.collection('stats').doc(statsDocId);

  // Preparar los incrementos
  const increments = {
    // Contadores básicos
    total_hits: admin.firestore.FieldValue.increment(1),

    // Contadores por elección de categoría
    accepted_analytics: choices.analytics ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),
    accepted_marketing: choices.marketing ? admin.firestore.FieldValue.increment(1) : admin.firestore.FieldValue.increment(0),

    // Contadores por tipo de acción
    [`action_${action}`]: admin.firestore.FieldValue.increment(1),

    // Contadores por idioma (si está disponible)
    ...(metadata?.language && {
      [`lang_${metadata.language}`]: admin.firestore.FieldValue.increment(1)
    }),

    // Contadores por país (si está disponible)
    ...(metadata?.country && {
      [`country_${metadata.country}`]: admin.firestore.FieldValue.increment(1)
    }),

    // Metadata del documento
    siteId: siteId,
    date: today,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    // Usar set con merge para crear el documento si no existe
    await statsRef.set(increments, { merge: true });
  } catch (err) {
    console.warn('Error actualizando stats diarios:', err.message);
  }
}

/**
 * Actualiza las estadísticas globales del sitio (legacy)
 * @param {string} siteId - ID del sitio
 */
async function updateSiteStats(siteId) {
  if (!db || !siteId) return;

  const siteRef = db.collection('sites').doc(siteId);

  try {
    await siteRef.update({
      'stats.totalConsents': admin.firestore.FieldValue.increment(1),
      'stats.lastConsentAt': admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    // Si el sitio no existe, ignorar silenciosamente
    if (err.code !== 5) { // NOT_FOUND
      throw err;
    }
  }
}

// ============================================
// RUTA: HISTORIAL DE CONSENTIMIENTO (TRANSPARENCIA GDPR)
// ============================================
// Permite al usuario ver TODOS sus registros de consentimiento
// basándose en su Footprint ID. Cumple con Art. 15 GDPR (Derecho de acceso).
// ============================================
app.get('/api/consent/history/:footprintId', async (req, res) => {
  const { footprintId } = req.params;

  // Validación básica
  if (!footprintId || footprintId.length < 8) {
    return res.status(400).json({
      error: 'Footprint ID inválido',
      code: 'INVALID_FOOTPRINT_ID'
    });
  }

  // Si Firestore no está disponible
  if (!db) {
    return res.status(503).json({
      error: 'Servicio no disponible',
      code: 'DB_NOT_AVAILABLE',
      records: []
    });
  }

  try {
    // Buscar registros con este footprintId (de todos los dominios)
    // OPTIMIZACIÓN: Límite de 50 registros para evitar lecturas masivas accidentales
    // Requiere índice compuesto: footprintId (Asc) + createdAt (Desc)
    const consentsRef = db.collection('consents');
    const q = consentsRef
      .where('footprintId', '==', footprintId)
      .orderBy('createdAt', 'desc')
      .limit(50); // Límite optimizado para reducir costes

    const snapshot = await q.get();

    const records = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Solo devolver campos seguros (sin userHash ni datos internos)
      records.push({
        id: doc.id,
        footprintId: data.footprintId,
        siteId: data.siteId,
        choices: data.choices,
        action: data.action,
        metadata: {
          domain: data.metadata?.domain,
          language: data.metadata?.language,
          sdkVersion: data.metadata?.sdkVersion
        },
        ipHash: data.ipHash, // Hash, no IP real
        timestamp: data.timestamp,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.timestamp,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || null,
        bannerVersion: data.bannerVersion
      });
    });

    return res.json({
      footprintId,
      totalRecords: records.length,
      gdprInfo: {
        retentionPeriod: '3 años (1095 días)',
        dataController: 'Esbilla CMP',
        contactEmail: 'esbilla+privacy@clicaonline.com',
        rights: 'Puede ejercer sus derechos GDPR contactando al responsable del tratamiento.'
      },
      records
    });
  } catch (err) {
    console.error('Error obteniendo historial:', err);

    // Si es error de índice, dar instrucciones
    if (err.code === 9) {
      return res.status(500).json({
        error: 'Se requiere crear un índice en Firestore',
        code: 'INDEX_REQUIRED',
        details: 'Ejecutar: gcloud firestore indexes composite create --collection-group=consents --field-config=field-path=footprintId,order=ascending --field-config=field-path=createdAt,order=descending',
        records: []
      });
    }

    return res.status(500).json({
      error: 'Error interno al obtener el historial',
      code: 'INTERNAL_ERROR',
      records: []
    });
  }
});

// ============================================
// RUTA: SINCRONIZACIÓN DE FOOTPRINT (CROSS-DOMAIN)
// ============================================
// Permite sincronizar el footprint entre dominios del mismo tenant.
// Busca si ya existe un consentimiento previo desde cualquier dominio
// del tenant y devuelve el footprint + último consentimiento.
// ============================================
app.post('/api/consent/sync', async (req, res) => {
  const { siteId, footprintId } = req.body;

  // Validación básica
  if (!siteId) {
    return res.status(400).json({
      error: 'siteId requerido',
      code: 'MISSING_SITE_ID'
    });
  }

  if (!db) {
    return res.status(503).json({
      error: 'Servicio no disponible',
      code: 'DB_NOT_AVAILABLE'
    });
  }

  try {
    // 1. Obtener configuración del sitio para ver sus crossDomains
    const siteDoc = await db.collection('sites').doc(siteId).get();
    const siteConfig = siteDoc.exists ? siteDoc.data() : {};
    const tenantId = siteConfig.tenantId || siteId;
    const crossDomains = siteConfig.crossDomains || [];

    // 2. Si hay footprintId, buscar último consentimiento de este footprint
    //    en cualquier dominio del tenant (cross-domain)
    if (footprintId) {
      const consentsRef = db.collection('consents');
      const q = consentsRef
        .where('footprintId', '==', footprintId)
        .orderBy('createdAt', 'desc')
        .limit(1);

      const snapshot = await q.get();

      if (!snapshot.empty) {
        const lastConsent = snapshot.docs[0].data();
        return res.json({
          synced: true,
          footprintId,
          tenantId,
          crossDomains,
          lastConsent: {
            choices: lastConsent.choices,
            language: lastConsent.metadata?.language,
            timestamp: lastConsent.timestamp,
            domain: lastConsent.metadata?.domain
          }
        });
      }
    }

    // 3. No hay consentimiento previo
    return res.json({
      synced: false,
      footprintId: footprintId || null,
      tenantId,
      crossDomains,
      lastConsent: null
    });

  } catch (err) {
    console.error('Error en sincronización:', err);
    return res.status(500).json({
      error: 'Error interno',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ============================================
// RUTA: REGISTRO DE EVENTOS ANALÍTICOS (ANÓNIMOS)
// ============================================
// Endpoint para eventos estadísticos anónimos:
// - "bounce": Usuario vio el banner pero no tomó decisión (timeout 10s)
// - "pages_until_decision": Métricas de navegación antes de decidir
//
// Estos eventos NO incluyen footprintId ni datos personales.
// Se guardan en colección separada "analytics" con TTL de 90 días.
// ============================================
app.post('/api/analytics/event', rateLimitMiddleware, async (req, res) => {
  const {
    type,        // 'bounce' | 'pages_until_decision'
    siteId,
    metadata
  } = req.body;

  // Validación básica
  if (!type || !siteId || !metadata) {
    return res.status(400).json({
      error: 'Datos incompletos',
      code: 'MISSING_FIELDS',
      required: ['type', 'siteId', 'metadata']
    });
  }

  // Validar tipo de evento
  const validTypes = ['bounce', 'pages_until_decision'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: 'Tipo de evento inválido',
      code: 'INVALID_EVENT_TYPE',
      validTypes
    });
  }

  // Validar metadata según tipo
  if (type === 'bounce') {
    if (!metadata.layout || !metadata.timeVisible) {
      return res.status(400).json({
        error: 'Metadata incompleta para bounce',
        code: 'INVALID_BOUNCE_METADATA',
        required: ['layout', 'timeVisible', 'domain', 'url']
      });
    }
  } else if (type === 'pages_until_decision') {
    if (typeof metadata.pagesVisited !== 'number' || typeof metadata.timeUntilDecision !== 'number') {
      return res.status(400).json({
        error: 'Metadata incompleta para pages_until_decision',
        code: 'INVALID_PAGES_METADATA',
        required: ['pagesVisited', 'timeUntilDecision', 'finalAction']
      });
    }
  }

  if (!db) {
    console.log('📊 Analytics event (local):', { type, siteId, metadata });
    return res.status(201).json({
      status: 'ok',
      message: 'Evento registrado (modo local)'
    });
  }

  try {
    // Crear documento de evento analítico
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 días

    const analyticsEvent = {
      type,
      siteId,
      metadata: {
        ...metadata,
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: now.toISOString()
      },
      createdAt: now,
      deleteAt: expiresAt // TTL automático de Firestore
    };

    const docRef = await db.collection('analytics').add(analyticsEvent);

    console.log(`📊 Evento analítico registrado: ${type} (${siteId})`);

    return res.status(201).json({
      status: 'ok',
      message: 'Evento analítico registrado',
      docId: docRef.id
    });
  } catch (err) {
    console.error('Error guardando evento analítico:', err);
    return res.status(500).json({
      error: 'Error interno',
      code: 'FIRESTORE_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============================================
// RUTA: RECALCULAR ESTADÍSTICAS DE UN SITIO
// ============================================
// Recalcula los totales de consentimientos para un sitio específico
// consultando directamente la colección de consents.
// Útil cuando hay desincronización entre stats.totalConsents y los datos reales.
// ============================================
app.post('/api/sites/:siteId/recalculate-stats', async (req, res) => {
  const { siteId } = req.params;

  // Validación básica
  if (!siteId) {
    return res.status(400).json({
      error: 'siteId requerido',
      code: 'MISSING_SITE_ID'
    });
  }

  if (!db) {
    return res.status(503).json({
      error: 'Servicio no disponible',
      code: 'DB_NOT_AVAILABLE'
    });
  }

  try {
    console.log(`🔄 Recalculando stats para sitio: ${siteId}`);

    // Contar todos los consents de este sitio
    const consentsSnapshot = await db.collection('consents')
      .where('siteId', '==', siteId)
      .count()
      .get();

    const totalConsents = consentsSnapshot.data().count;

    // Obtener el último consentimiento
    const lastConsentSnapshot = await db.collection('consents')
      .where('siteId', '==', siteId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    const lastConsentAt = lastConsentSnapshot.empty
      ? null
      : lastConsentSnapshot.docs[0].data().createdAt;

    // Actualizar el sitio con los valores reales
    const siteRef = db.collection('sites').doc(siteId);
    await siteRef.update({
      'stats.totalConsents': totalConsents,
      'stats.lastConsentAt': lastConsentAt,
      'stats.lastRecalculatedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Stats recalculados para ${siteId}: ${totalConsents} consents`);

    res.json({
      success: true,
      siteId,
      totalConsents,
      lastConsentAt: lastConsentAt ? lastConsentAt.toDate() : null,
      message: `Estadísticas recalculadas: ${totalConsents} consentimientos`
    });

  } catch (err) {
    console.error('Error recalculando stats:', err);

    // Si es error de índice, dar instrucciones
    if (err.code === 9) {
      return res.status(500).json({
        error: 'Se requiere crear un índice en Firestore',
        code: 'INDEX_REQUIRED',
        details: 'El índice para siteId + createdAt ya debería existir. Verifica firestore.indexes.json'
      });
    }

    res.status(500).json({
      error: 'Error recalculando estadísticas',
      code: 'RECALCULATION_ERROR',
      details: err.message
    });
  }
});

// ============================================
// RUTA: INVITACIONES (SPRINT 4)
// ============================================
// Gestión de invitaciones por email para onboarding colaborativo
const invitationsRouter = require('./routes/invitations.js');
app.use('/api/invitations', invitationsRouter);

// ============================================
// GTM GATEWAY PROXY (v1.8+)
// ============================================
// Proxy de Google Tag Manager desde dominio de Esbilla
// Permite cargar GTM desde el propio dominio en lugar de googletagmanager.com
// Evita ad blockers y mejora privacidad
// Incluye optimizaciones: cache en memoria (TTL 5 min) + compresión Brotli/Gzip
// ============================================

// Cache en memoria para gtm.js (reduce egress y latencia)
const gtmCache = new Map();
const GTM_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const GTM_CACHE_MAX_SIZE = 100; // Máximo 100 containers en cache

/**
 * Limpia entradas expiradas del cache GTM
 */
function cleanGTMCache() {
  const now = Date.now();
  for (const [key, entry] of gtmCache.entries()) {
    if (now - entry.timestamp > GTM_CACHE_TTL) {
      gtmCache.delete(key);
    }
  }
}

// Limpiar cache cada 5 minutos
setInterval(cleanGTMCache, GTM_CACHE_TTL);

/**
 * Rate limiting específico para proxy GTM
 * Más restrictivo que el rate limit general (10 req/min vs 30 req/min)
 */
const gtmRateLimitStore = new Map();
const GTM_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const GTM_RATE_LIMIT_MAX_REQUESTS = 10; // Máx 10 cargas de GTM por IP/min

function gtmRateLimitMiddleware(req, res, next) {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.ip ||
                   'unknown';

  const now = Date.now();
  const windowStart = now - GTM_RATE_LIMIT_WINDOW_MS;

  let record = gtmRateLimitStore.get(clientIp);
  if (!record || record.windowStart < windowStart) {
    record = { windowStart: now, count: 0 };
  }

  record.count++;
  gtmRateLimitStore.set(clientIp, record);

  // Limpiar registros antiguos
  if (gtmRateLimitStore.size > 500) {
    for (const [ip, r] of gtmRateLimitStore.entries()) {
      if (r.windowStart < windowStart) {
        gtmRateLimitStore.delete(ip);
      }
    }
  }

  if (record.count > GTM_RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`[GTM RateLimit] IP ${clientIp} excedió límite: ${record.count}/${GTM_RATE_LIMIT_MAX_REQUESTS} req/min`);
    return res.status(429).json({
      error: 'Too many GTM requests',
      code: 'GTM_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((record.windowStart + GTM_RATE_LIMIT_WINDOW_MS - now) / 1000)
    });
  }

  next();
}

/**
 * Obtiene información de geolocalización basada en IP
 * NOTA: Implementación básica. Para producción, considerar:
 * - GeoIP database (MaxMind GeoLite2)
 * - Cloud Run: X-Appengine-Country, X-Appengine-Region (si está habilitado)
 * - Cloudflare headers: CF-IPCountry
 */
function getGeoLocation(req) {
  // Intentar obtener país de headers de Cloud Run/Cloudflare
  const country = req.headers['x-appengine-country'] ||
                  req.headers['cf-ipcountry'] ||
                  req.headers['cloudfront-viewer-country'] ||
                  null;

  const region = req.headers['x-appengine-region'] || null;

  // Formato esperado por Google: "country,region" (ej: "ES,AS" para España, Asturias)
  if (country && region) {
    return `${country},${region}`;
  } else if (country) {
    return country;
  }

  // Fallback: sin geolocalización
  return null;
}

/**
 * ENDPOINT: GTM Gateway Proxy - Multi-tenant DNS-based proxy
 *
 * Arquitectura:
 * Cliente configura DNS: gtm.cliente.com → Esbilla API (Cloud Run)
 * Cliente carga: <script src="https://gtm.cliente.com/gtm.js"></script>
 *
 * Flujo:
 * 1. Leer Host header (gtm.cliente.com)
 * 2. Buscar en Firestore qué site tiene ese gtmGatewayDomain
 * 3. Usar containerId de ese site
 * 4. Fetch desde Google con geolocalización
 * 5. Cache + compresión + respuesta
 *
 * Escalabilidad:
 * - Cloud CDN global (cache en PoPs)
 * - Load Balancer multi-región UE
 * - Cache in-memory por instancia (5 min TTL)
 *
 * Query params opcionales:
 * - id: Container ID override (GTM-XXXXX o G-XXXXX) - para testing
 * - l: dataLayer name (opcional, default: dataLayer)
 */
app.get('/gtm.js', gtmRateLimitMiddleware, async (req, res) => {
  try {
    const dataLayer = req.query.l || 'dataLayer';
    let containerId = req.query.id; // Puede venir por query param (fallback/testing)
    let siteId = null;

    // PASO 1: Identificar cliente por Host header
    const hostHeader = req.headers.host || req.hostname;

    // Normalizar dominio (quitar puerto si existe)
    const clientDomain = hostHeader.split(':')[0].toLowerCase();

    // PASO 2: Si no viene containerId por query param, buscar en Firestore por dominio
    if (!containerId) {
      try {
        // Buscar site que tenga este gtmGatewayDomain
        const sitesSnapshot = await db.collection('sites')
          .where('gtmGatewayDomain', '==', clientDomain)
          .limit(1)
          .get();

        if (sitesSnapshot.empty) {
          // No hay site configurado con este dominio
          console.error(`[GTM Proxy] No site found for domain: ${clientDomain}`);
          return res.status(404).json({
            error: 'GTM Gateway domain not configured',
            code: 'DOMAIN_NOT_CONFIGURED',
            message: `Domain "${clientDomain}" is not configured as GTM Gateway in any site. Please configure gtmGatewayDomain in Dashboard → Sites → Edit Site.`,
            domain: clientDomain
          });
        }

        const siteDoc = sitesSnapshot.docs[0];
        const siteData = siteDoc.data();
        siteId = siteDoc.id;

        // Verificar que el site tiene GTM habilitado
        if (!siteData.gtmGatewayEnabled) {
          console.error(`[GTM Proxy] GTM Gateway disabled for site ${siteId}`);
          return res.status(403).json({
            error: 'GTM Gateway disabled',
            code: 'GTM_GATEWAY_DISABLED',
            message: 'GTM Gateway is disabled for this site. Enable it in Dashboard → Sites → Edit Site.',
            siteId
          });
        }

        // Obtener Container ID de la configuración del site
        containerId = siteData.gtmContainerId;

        if (!containerId) {
          console.error(`[GTM Proxy] No GTM Container ID configured for site ${siteId}`);
          return res.status(400).json({
            error: 'Missing GTM Container ID',
            code: 'MISSING_CONTAINER_ID',
            message: 'GTM Container ID not configured for this site. Configure it in Dashboard → Sites → Edit Site.',
            siteId
          });
        }

        console.log(`[GTM Proxy] Multi-tenant routing: ${clientDomain} → site ${siteId} → ${containerId}`);

      } catch (firestoreError) {
        console.error('[GTM Proxy] Firestore query error:', firestoreError);
        return res.status(500).json({
          error: 'Database error',
          code: 'FIRESTORE_ERROR',
          message: 'Failed to lookup GTM Gateway configuration'
        });
      }
    }

    // PASO 3: Validar formato del Container ID
    if (!containerId.match(/^(GTM|G)-[A-Z0-9]+$/)) {
      return res.status(400).json({
        error: 'Invalid container ID',
        code: 'INVALID_CONTAINER_ID',
        message: 'Container ID must match format GTM-XXXXX or G-XXXXX',
        containerId
      });
    }

    // PASO 4: Verificar cache (ahora incluye el dominio en la key)
    const cacheKey = `gtm_${clientDomain}_${containerId}_${dataLayer}`;

    // Verificar cache
    const cached = gtmCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GTM_CACHE_TTL) {
      console.log(`[GTM Proxy] Cache HIT para ${clientDomain} (${containerId})`);
      res.set({
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 min browser cache
        'X-Cache': 'HIT',
        'X-GTM-Site-Id': siteId || 'unknown'
      });
      return res.send(cached.content);
    }

    console.log(`[GTM Proxy] Cache MISS para ${clientDomain} (${containerId}), fetching from Google...`);

    // Determinar URL de origen según el tipo de container
    let targetUrl;
    if (containerId.startsWith('GTM-')) {
      // GTM tradicional
      targetUrl = `https://www.googletagmanager.com/gtm.js?id=${containerId}&l=${dataLayer}`;
    } else if (containerId.startsWith('G-')) {
      // Google Analytics 4 / Google Tag (usa fps.goog gateway)
      targetUrl = `https://${containerId}.fps.goog/gtm.js?id=${containerId}&l=${dataLayer}`;
    }

    // Obtener geolocalización
    const geoLocation = getGeoLocation(req);

    // Headers para el fetch a Google
    const fetchHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Esbilla-GTM-Proxy/1.0',
      'Accept': 'application/javascript, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': req.headers['referer'] || req.headers['origin'] || 'https://esbilla.com'
    };

    // Añadir headers de geolocalización si están disponibles
    if (geoLocation) {
      fetchHeaders['X-Forwarded-Country-Region'] = geoLocation;
      const [country, region] = geoLocation.split(',');
      if (country) fetchHeaders['X-Forwarded-Country'] = country;
      if (region) fetchHeaders['X-Forwarded-Region'] = region;
    }

    // Añadir IP del cliente
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    if (clientIp) {
      fetchHeaders['X-Forwarded-For'] = clientIp;
    }

    // Fetch desde Google
    const response = await fetch(targetUrl, { headers: fetchHeaders });

    if (!response.ok) {
      console.error(`[GTM Proxy] Error fetching ${targetUrl}: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: 'Failed to fetch GTM script',
        code: 'GOOGLE_FETCH_ERROR',
        status: response.status
      });
    }

    const content = await response.text();

    // Guardar en cache (con límite de tamaño)
    if (gtmCache.size >= GTM_CACHE_MAX_SIZE) {
      // Eliminar entrada más antigua
      const oldestKey = gtmCache.keys().next().value;
      gtmCache.delete(oldestKey);
    }

    gtmCache.set(cacheKey, {
      content,
      timestamp: Date.now(),
      size: Buffer.byteLength(content, 'utf8')
    });

    console.log(`[GTM Proxy] Cached ${clientDomain} (${containerId}), size: ${Buffer.byteLength(content, 'utf8')} bytes`);

    // Enviar respuesta con compresión automática (middleware compression)
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // 5 min browser cache
      'X-Cache': 'MISS',
      'X-GTM-Site-Id': siteId || 'unknown'
    });

    res.send(content);

  } catch (err) {
    console.error('[GTM Proxy] Error:', err);
    res.status(500).json({
      error: 'Internal proxy error',
      code: 'GTM_PROXY_ERROR',
      message: err.message
    });
  }
});

// NOTA: Endpoint /gtm/* comentado temporalmente debido a incompatibilidad con Express 5
// GTM generalmente solo necesita /gtm.js, los recursos adicionales son raros
// Si se necesita en el futuro, implementar con middleware personalizado que capture todo el path

/**
 * ENDPOINT: Health check de GTM Gateway
 * Google verifica disponibilidad del gateway con /metrics/healthy
 */
app.get('/metrics/:check', gtmRateLimitMiddleware, async (req, res) => {
  const { check } = req.params;

  if (check === 'healthy') {
    // Responder OK (Google espera 200)
    return res.status(200).send('OK');
  }

  // Otros health checks: proxear a Google
  try {
    const targetUrl = `https://www.googletagmanager.com/metrics/${check}`;
    const response = await fetch(targetUrl);
    const content = await response.text();

    res.status(response.status).send(content);

  } catch (err) {
    console.error('[GTM Proxy] Error en /metrics:', err);
    res.status(500).send('Error');
  }
});

// Health check pa Cloud Run
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    firebase: db ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
