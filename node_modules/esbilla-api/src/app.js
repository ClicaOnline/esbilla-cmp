const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

// Inicialización de Firebase Admin
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de la BBDD
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'esbilla-cmp';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || '(default)'; // Usa '(default)' pa la BBDD por defeutu

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

// Hash anónimu del IP pa soberanía de datos
function hashIP(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip + 'esbilla-salt').digest('hex').substring(0, 16);
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

// Ruta: Rexistru de consentimientu
app.post('/api/consent/log', async (req, res) => {
  const { cmpId, choices, timestamp } = req.body;

  // Validación básica
  if (!cmpId || !choices) {
    return res.status(400).json({ error: 'Falten datos obligatorios (cmpId, choices)' });
  }

  const consentRecord = {
    cmpId,
    choices,
    timestamp: timestamp || new Date().toISOString(),
    userAgent: req.headers['user-agent'] || 'unknown',
    ipHash: hashIP(req.ip || req.headers['x-forwarded-for']),
    createdAt: admin.apps.length ? admin.firestore.FieldValue.serverTimestamp() : new Date()
  };

  // Si Firestore ta disponible, guardar nel hórreu
  if (db) {
    try {
      const docRef = await db.collection('consents').add(consentRecord);
      return res.status(201).json({
        status: 'esbilláu',
        message: 'Log guardáu nel hórreu de Firestore',
        docId: docRef.id
      });
    } catch (err) {
      console.error('Error guardando en Firestore:', err);
      return res.status(500).json({
        error: 'Error interno al guardar el consentimientu',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }

  // Fallback si Firestore nun ta configuráu (desarrollo local)
  console.log('📝 Consent log (local):', consentRecord);
  return res.status(201).json({
    status: 'esbilláu',
    message: 'Log guardáu (modo local - sin Firestore)'
  });
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
