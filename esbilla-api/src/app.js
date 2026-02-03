const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

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

// CORS configuráu pa permitir el dominiu de producción y desarrollo
app.use(cors({
  origin: [
    'https://esbilla.com',
    'https://api.esbilla.com',
    'http://localhost:4321',
    'http://localhost:3000',
    'http://localhost:5173'  // Vite dev server del dashboard
  ],
  credentials: true
}));

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

// Ruta: Configuración del sitiu por ID
app.get('/api/config/:id', async (req, res) => {
  const { id } = req.params;

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
// ============================================
app.post('/api/consent/log', async (req, res) => {
  const {
    // Campos nuevos (SDK v1.1+)
    siteId,
    // apiKey, // TODO: Validar API key del sitio en futuras versiones
    footprintId,
    choices,
    action,
    metadata,
    timestamp,
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

    // Campo TTL para eliminación automática (3 años)
    // Firestore TTL policy debe configurarse en este campo
    expiresAt: admin.apps.length ? admin.firestore.Timestamp.fromDate(expiresAt) : expiresAt
  };

  // Si Firestore ta disponible, guardar nel hórreu
  if (db) {
    try {
      // SIEMPRE usamos .add() para crear un nuevo documento
      // Esto garantiza el audit trail (nunca sobrescribimos)
      const docRef = await db.collection('consents').add(consentRecord);

      // Actualizar estadísticas del sitio (opcional, async)
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

// Función auxiliar para actualizar estadísticas del sitio
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
    // Buscar todos los registros con este footprintId (de todos los dominios)
    const consentsRef = db.collection('consents');
    const q = consentsRef
      .where('footprintId', '==', footprintId)
      .orderBy('createdAt', 'desc')
      .limit(100); // Límite de seguridad

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
        contactEmail: 'privacy@esbilla.com',
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

// Health check pa Cloud Run
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    firebase: db ? 'connected' : 'not configured',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
