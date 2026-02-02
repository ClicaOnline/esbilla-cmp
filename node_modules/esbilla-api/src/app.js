const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

// Inicialización de Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase solo si nun ta yá inicializáu
if (!admin.apps.length) {
  // En Cloud Run, les credenciales cárguense automáticamente
  // En local, pue usase GOOGLE_APPLICATION_CREDENTIALS o un ficheru JSON
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    admin.initializeApp({
      projectId: process.env.GCLOUD_PROJECT || 'esbilla-cmp'
    });
  } else {
    // Fallback pa desarrollo local sin credenciales
    console.warn('⚠️ Firebase nun ta configuráu. Los logs de consentimientu nun se guardarán.');
  }
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();

// CORS configuráu pa permitir el dominiu de producción y desarrollo
app.use(cors({
  origin: ['https://esbilla.com', 'http://localhost:4321', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use('/', express.static(path.join(__dirname, '../public')));

// Hash anónimu del IP pa soberanía de datos
function hashIP(ip) {
  if (!ip) return 'unknown';
  return crypto.createHash('sha256').update(ip + 'esbilla-salt').digest('hex').substring(0, 16);
}

// Ruta: Configuración del sitiu por ID
app.get('/api/config/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: id,
    theme: { primary: '#FFBF00', secondary: '#3D2B1F' },
    texts: { title: "¿Esbillamos les cookies?" }
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
