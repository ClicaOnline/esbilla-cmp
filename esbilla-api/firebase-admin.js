/**
 * Firebase Admin SDK initialization
 * Shared instance for all routes and services
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de la BBDD
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'esbilla-cmp';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'esbilla-cmp';

let db;

// Inicializar Firebase Admin (solo una vez)
if (!admin.apps.length) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    admin.initializeApp({ projectId: PROJECT_ID });
    db = getFirestore(admin.app(), DATABASE_ID);
    console.log(`✅ Firebase Admin inicializáu: proyecto=${PROJECT_ID}, database=${DATABASE_ID}`);
  } else {
    console.warn('⚠️ Firebase nun ta configuráu. Los logs de consentimientu nun se guardarán.');
    // Mock db para entornu de desarrollo sin Firebase
    db = null;
  }
}

module.exports = admin;
module.exports.db = db || getFirestore(admin.app(), DATABASE_ID);
module.exports.admin = admin;
