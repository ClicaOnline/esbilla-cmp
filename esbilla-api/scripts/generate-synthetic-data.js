/**
 * ESBILLA CMP - Generador de Datos Sintéticos
 *
 * Script para generar datos de consentimiento sintéticos de los últimos 30 días
 * y subirlos a Firestore para pruebas del dashboard.
 *
 * USO:
 *   1. Configurar GOOGLE_APPLICATION_CREDENTIALS con tu service account JSON
 *   2. Ejecutar: node scripts/generate-synthetic-data.js
 *
 * OPCIONES (variables de entorno):
 *   - DAYS: Número de días a generar (default: 30)
 *   - RECORDS_PER_DAY: Registros promedio por día (default: 50)
 *   - SITE_ID: ID del sitio (default: 'demo-site')
 *   - DRY_RUN: Si es 'true', solo muestra los datos sin subirlos
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN
// ============================================
const CONFIG = {
  DAYS: parseInt(process.env.DAYS) || 30,
  RECORDS_PER_DAY: parseInt(process.env.RECORDS_PER_DAY) || 50,
  SITE_ID: process.env.SITE_ID || 'demo-site',
  DRY_RUN: process.env.DRY_RUN === 'true',
  PROJECT_ID: process.env.GCLOUD_PROJECT || 'esbilla-cmp',
  DATABASE_ID: process.env.FIRESTORE_DATABASE_ID || 'esbilla-cmp'
};

// ============================================
// DATOS PARA GENERACIÓN SINTÉTICA
// ============================================

// Distribución realista de acciones
const ACTIONS = [
  { action: 'accept_all', weight: 45 },
  { action: 'reject_all', weight: 25 },
  { action: 'customize', weight: 20 },
  { action: 'update', weight: 10 }
];

// Dominios de ejemplo (para simular cross-domain)
const DOMAINS = [
  'demo.esbilla.com',
  'app.esbilla.com',
  'tienda.esbilla.com',
  'blog.esbilla.com',
  'localhost:3000'
];

// Idiomas con distribución realista
const LANGUAGES = [
  { lang: 'es', weight: 50 },
  { lang: 'en', weight: 25 },
  { lang: 'ast', weight: 10 },
  { lang: 'fr', weight: 5 },
  { lang: 'pt', weight: 5 },
  { lang: 'de', weight: 3 },
  { lang: 'it', weight: 2 }
];

// User agents realistas
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

// Zonas horarias
const TIMEZONES = [
  'Europe/Madrid',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/Paris',
  'Europe/Berlin',
  'America/Mexico_City',
  'America/Bogota',
  'America/Argentina/Buenos_Aires'
];

// Resoluciones de pantalla comunes
const SCREEN_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 2560, height: 1440 },
  { width: 390, height: 844 },   // iPhone
  { width: 412, height: 915 },   // Android
  { width: 820, height: 1180 },  // iPad
  { width: 375, height: 812 }    // iPhone X
];

// ============================================
// FUNCIONES HELPER
// ============================================

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandomChoice(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
}

function generateFootprintId() {
  const uuid = crypto.randomUUID();
  return 'ESB-' + uuid.split('-')[0].toUpperCase();
}

function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + 'esbilla-salt').digest('hex').substring(0, 16);
}

function generateUserHash(footprintId, ip, userAgent) {
  const data = `${footprintId}:${ip}:${userAgent}`;
  return crypto.createHash('sha256').update(data + 'esbilla-gdpr-salt').digest('hex');
}

function randomIP() {
  // Generar IPs europeas/americanas realistas
  const ranges = [
    () => `83.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    () => `88.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    () => `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    () => `176.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    () => `45.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
  ];
  return randomChoice(ranges)();
}

function randomDateInDay(date) {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);

  const result = new Date(date);
  result.setHours(hours, minutes, seconds, Math.floor(Math.random() * 1000));
  return result;
}

function getChoicesForAction(action) {
  switch (action) {
    case 'accept_all':
      return { analytics: true, marketing: true };
    case 'reject_all':
      return { analytics: false, marketing: false };
    case 'customize':
      // Combinaciones personalizadas
      return randomChoice([
        { analytics: true, marketing: false },
        { analytics: false, marketing: true },
        { analytics: true, marketing: true },
        { analytics: false, marketing: false }
      ]);
    case 'update':
      // Actualizaciones (puede ser cualquier combinación)
      return {
        analytics: Math.random() > 0.4,
        marketing: Math.random() > 0.6
      };
    default:
      return { analytics: false, marketing: false };
  }
}

// ============================================
// GENERADOR DE REGISTROS
// ============================================

function generateConsentRecord(timestamp, existingFootprints = []) {
  // 70% de probabilidad de reusar un footprint existente (usuarios recurrentes)
  const reuseFootprint = existingFootprints.length > 0 && Math.random() < 0.3;
  const footprintId = reuseFootprint
    ? randomChoice(existingFootprints)
    : generateFootprintId();

  const actionInfo = weightedRandomChoice(ACTIONS);
  const action = actionInfo.action;
  const choices = getChoicesForAction(action);

  const langInfo = weightedRandomChoice(LANGUAGES);
  const language = langInfo.lang;

  const domain = randomChoice(DOMAINS);
  const userAgent = randomChoice(USER_AGENTS);
  const ip = randomIP();
  const screen = randomChoice(SCREEN_SIZES);
  const timezone = randomChoice(TIMEZONES);

  const expiresAt = new Date(timestamp);
  expiresAt.setDate(expiresAt.getDate() + 1095); // 3 años

  return {
    // Identificadores
    siteId: CONFIG.SITE_ID,
    projectId: CONFIG.SITE_ID,
    footprintId,
    userHash: generateUserHash(footprintId, ip, userAgent),

    // Versión del banner
    bannerVersion: randomChoice(['1.0', '1.0.1', '1.1.0']),

    // Elecciones del usuario
    choices,
    action,

    // Metadata
    metadata: {
      domain,
      pageUrl: `https://${domain}/`,
      referrer: Math.random() > 0.5 ? `https://google.com/search?q=esbilla` : null,
      language,
      timezone,
      screenWidth: screen.width,
      screenHeight: screen.height,
      sdkVersion: '1.1.0',
      consentVersion: '1.0'
    },

    // Hash del IP (GDPR compliant)
    ipHash: hashIP(ip),
    userAgent,

    // Timestamps
    timestamp: timestamp.toISOString(),
    createdAt: admin.firestore.Timestamp.fromDate(timestamp),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt)
  };
}

function generateDayRecords(date, existingFootprints) {
  // Variación en el número de registros por día (más en días laborables)
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const multiplier = isWeekend ? 0.6 : 1.0;

  // Variación aleatoria ±30%
  const variation = 0.7 + Math.random() * 0.6;
  const recordCount = Math.floor(CONFIG.RECORDS_PER_DAY * multiplier * variation);

  const records = [];
  const newFootprints = [...existingFootprints];

  for (let i = 0; i < recordCount; i++) {
    const timestamp = randomDateInDay(date);
    const record = generateConsentRecord(timestamp, newFootprints);
    records.push(record);

    // Añadir footprint a la lista si es nuevo
    if (!newFootprints.includes(record.footprintId)) {
      newFootprints.push(record.footprintId);
    }
  }

  return { records, footprints: newFootprints };
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🌽 ESBILLA CMP - Generador de Datos Sintéticos');
  console.log('='.repeat(50));
  console.log(`📅 Días a generar: ${CONFIG.DAYS}`);
  console.log(`📊 Registros/día (promedio): ${CONFIG.RECORDS_PER_DAY}`);
  console.log(`🏷️  Site ID: ${CONFIG.SITE_ID}`);
  console.log(`🔥 Proyecto: ${CONFIG.PROJECT_ID}`);
  console.log(`💾 Database: ${CONFIG.DATABASE_ID}`);
  console.log(`🧪 Dry run: ${CONFIG.DRY_RUN ? 'Sí (no se subirán datos)' : 'No'}`);
  console.log('='.repeat(50));

  // Inicializar Firebase
  let db = null;
  if (!CONFIG.DRY_RUN) {
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.K_SERVICE) {
      console.error('❌ Error: Configura GOOGLE_APPLICATION_CREDENTIALS con tu service account JSON');
      console.log('   Ejemplo: set GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json');
      process.exit(1);
    }

    admin.initializeApp({ projectId: CONFIG.PROJECT_ID });
    // Usar getFirestore para bases de datos nombradas
    const { getFirestore } = require('firebase-admin/firestore');
    db = getFirestore(admin.app(), CONFIG.DATABASE_ID);
    console.log('✅ Conectado a Firestore');
  }

  // Generar datos
  const allRecords = [];
  let existingFootprints = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - CONFIG.DAYS);

  console.log('\n📝 Generando datos...\n');

  for (let day = 0; day < CONFIG.DAYS; day++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day);

    const { records, footprints } = generateDayRecords(date, existingFootprints);
    existingFootprints = footprints;
    allRecords.push(...records);

    const dateStr = date.toISOString().split('T')[0];
    console.log(`  📅 ${dateStr}: ${records.length} registros`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Total de registros generados: ${allRecords.length}`);
  console.log(`👥 Footprints únicos: ${existingFootprints.length}`);

  // Estadísticas de acciones
  const actionStats = {};
  allRecords.forEach(r => {
    actionStats[r.action] = (actionStats[r.action] || 0) + 1;
  });
  console.log('\n📈 Distribución de acciones:');
  Object.entries(actionStats).forEach(([action, count]) => {
    const pct = ((count / allRecords.length) * 100).toFixed(1);
    console.log(`   ${action}: ${count} (${pct}%)`);
  });

  // Estadísticas de idiomas
  const langStats = {};
  allRecords.forEach(r => {
    const lang = r.metadata.language;
    langStats[lang] = (langStats[lang] || 0) + 1;
  });
  console.log('\n🌍 Distribución de idiomas:');
  Object.entries(langStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      const pct = ((count / allRecords.length) * 100).toFixed(1);
      console.log(`   ${lang}: ${count} (${pct}%)`);
    });

  if (CONFIG.DRY_RUN) {
    console.log('\n🧪 Modo DRY RUN - No se subieron datos');
    console.log('   Para subir datos, ejecuta sin DRY_RUN=true');

    // Mostrar ejemplo de registro
    console.log('\n📋 Ejemplo de registro generado:');
    console.log(JSON.stringify(allRecords[0], null, 2));
    return;
  }

  // Subir a Firestore en lotes
  console.log('\n⬆️  Subiendo a Firestore...');

  const BATCH_SIZE = 500; // Firestore permite máximo 500 operaciones por batch
  let uploaded = 0;

  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = allRecords.slice(i, i + BATCH_SIZE);

    chunk.forEach(record => {
      const docRef = db.collection('consents').doc();
      batch.set(docRef, record);
    });

    await batch.commit();
    uploaded += chunk.length;

    const progress = ((uploaded / allRecords.length) * 100).toFixed(1);
    process.stdout.write(`\r   Progreso: ${uploaded}/${allRecords.length} (${progress}%)`);
  }

  console.log('\n\n✅ ¡Datos subidos exitosamente!');
  console.log(`   Total: ${allRecords.length} registros en la colección 'consents'`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
