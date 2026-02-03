#!/usr/bin/env node
/**
 * ESBILLA CMP - Script de configuración TTL para Firestore
 *
 * Este script proporciona instrucciones y validación para configurar
 * la política TTL (Time To Live) en la colección 'consents' de Firestore.
 *
 * GDPR COMPLIANCE:
 * - Los registros de consentimiento se eliminan automáticamente después de 3 años (1095 días)
 * - Esto cumple con el principio de limitación del almacenamiento del GDPR
 * - El campo 'expiresAt' se usa para la política TTL
 *
 * REQUISITOS:
 * - Node.js 18+
 * - Firebase Admin SDK
 * - gcloud CLI (para configurar la política TTL)
 * - Permisos de administrador en el proyecto de Firebase
 *
 * USO:
 *   node scripts/setup-ttl.js --project=esbilla-cmp --database=esbilla-cmp
 *
 * @author Esbilla CMP Team
 * @version 1.0.0
 */

const { execSync } = require('child_process');

// Configuración
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'esbilla-cmp';
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'esbilla-cmp';
const COLLECTION_GROUP = 'consents';
const TTL_FIELD = 'expiresAt';
const REGION = 'europe-west4';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log();
  log('═'.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('═'.repeat(60), 'cyan');
  console.log();
}

// Banner
console.log();
log('🌽 ESBILLA CMP - Configuración de TTL para GDPR', 'bright');
log('   Política de retención de datos: 3 años (1095 días)', 'yellow');
console.log();

// Parsear argumentos
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

const projectId = args.project || PROJECT_ID;
const databaseId = args.database || DATABASE_ID;

logSection('1. INFORMACIÓN DEL PROYECTO');
log(`   Proyecto: ${projectId}`, 'blue');
log(`   Base de datos: ${databaseId}`, 'blue');
log(`   Colección: ${COLLECTION_GROUP}`, 'blue');
log(`   Campo TTL: ${TTL_FIELD}`, 'blue');
log(`   Región: ${REGION}`, 'blue');

logSection('2. VERIFICAR GCLOUD CLI');
try {
  const version = execSync('gcloud --version', { encoding: 'utf8' }).split('\n')[0];
  log(`   ✓ gcloud CLI instalado: ${version}`, 'green');
} catch (err) {
  log('   ✗ gcloud CLI no encontrado', 'red');
  log('   Instalar desde: https://cloud.google.com/sdk/docs/install', 'yellow');
  process.exit(1);
}

logSection('3. COMANDOS PARA CONFIGURAR TTL');

log('   Para configurar la política TTL, ejecuta los siguientes comandos:', 'yellow');
console.log();

// Comando para autenticarse
log('   # 1. Autenticarse en Google Cloud', 'cyan');
console.log(`   gcloud auth login`);
console.log(`   gcloud config set project ${projectId}`);
console.log();

// Comando para crear el índice TTL
log('   # 2. Crear la política TTL en Firestore', 'cyan');
const ttlCommand = `gcloud firestore fields ttls update ${TTL_FIELD} \\
     --collection-group=${COLLECTION_GROUP} \\
     --database=${databaseId === '(default)' ? '(default)' : databaseId} \\
     --project=${projectId}`;

console.log(`   ${ttlCommand}`);
console.log();

// Comando para verificar
log('   # 3. Verificar la configuración', 'cyan');
console.log(`   gcloud firestore fields ttls list \\
     --database=${databaseId === '(default)' ? '(default)' : databaseId} \\
     --project=${projectId}`);
console.log();

logSection('4. VERIFICACIÓN DEL ESQUEMA');

log('   El campo TTL debe tener el siguiente formato en cada documento:', 'yellow');
console.log();
console.log(`   {
     "expiresAt": Timestamp,  // Firestore Timestamp (3 años desde creación)
     ...otros campos
   }`);
console.log();

log('   Ejemplo de documento válido:', 'cyan');
console.log(`   {
     "siteId": "site_abc123xyz",
     "userHash": "sha256...",
     "choices": { "analytics": true, "marketing": false },
     "createdAt": Timestamp("2024-01-15T10:30:00Z"),
     "expiresAt": Timestamp("2027-01-15T10:30:00Z")  // 3 años después
   }`);
console.log();

logSection('5. NOTAS IMPORTANTES');

log('   ⚠️  IMPORTANTE:', 'yellow');
log('   • La política TTL puede tardar hasta 24h en activarse', 'reset');
log('   • Los documentos existentes SIN campo expiresAt NO se eliminarán', 'reset');
log('   • Ejecutar este proceso en europe-west4 para cumplir GDPR', 'reset');
log('   • La eliminación es irreversible - hacer backup antes si necesario', 'reset');
console.log();

log('   📋 CUMPLIMIENTO GDPR:', 'green');
log('   • Art. 5(1)(e): Limitación del plazo de conservación', 'reset');
log('   • Art. 17: Derecho de supresión (automático tras 3 años)', 'reset');
log('   • Recital 39: Datos no conservados más tiempo del necesario', 'reset');
console.log();

logSection('6. SCRIPT DE MIGRACIÓN (OPCIONAL)');

log('   Para añadir expiresAt a documentos existentes:', 'yellow');
console.log();
console.log(`   // En Firebase Admin SDK:
   const admin = require('firebase-admin');
   const db = admin.firestore();

   async function migrateExistingConsents() {
     const consentsRef = db.collection('consents');
     const snapshot = await consentsRef.where('expiresAt', '==', null).get();

     const batch = db.batch();
     let count = 0;

     snapshot.forEach(doc => {
       const createdAt = doc.data().createdAt?.toDate() || new Date();
       const expiresAt = new Date(createdAt);
       expiresAt.setDate(expiresAt.getDate() + 1095); // 3 años

       batch.update(doc.ref, {
         expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
       });
       count++;

       // Firestore batch limit: 500 operaciones
       if (count % 500 === 0) {
         await batch.commit();
         batch = db.batch();
       }
     });

     if (count % 500 !== 0) {
       await batch.commit();
     }

     console.log(\`Migrados \${count} documentos\`);
   }`);
console.log();

log('═'.repeat(60), 'cyan');
log('  ✓ Script completado. Ejecuta los comandos gcloud manualmente.', 'green');
log('═'.repeat(60), 'cyan');
console.log();
