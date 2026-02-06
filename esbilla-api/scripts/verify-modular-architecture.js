#!/usr/bin/env node

/**
 * Script de verificación de arquitectura modular
 * Valida que todos los componentes del sistema modular estén correctamente configurados
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const MODULES_DIR = path.join(PUBLIC_DIR, 'modules');
const SDK_FILE = path.join(PUBLIC_DIR, 'pegoyu.js');
const MANIFEST_FILE = path.join(PUBLIC_DIR, 'sdk-modules.json');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function header(message) {
  console.log('');
  log(`═══════════════════════════════════════════════`, 'cyan');
  log(`  ${message}`, 'cyan');
  log(`═══════════════════════════════════════════════`, 'cyan');
}

let errors = 0;
let warnings = 0;
let checks = 0;

/**
 * Test 1: Verificar que el manifest existe y es válido
 */
function verifyManifest() {
  header('Test 1: Verificar Manifest (sdk-modules.json)');
  checks++;

  if (!fs.existsSync(MANIFEST_FILE)) {
    error('sdk-modules.json no encontrado');
    errors++;
    return null;
  }
  checkmark('sdk-modules.json encontrado');

  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    checkmark('JSON válido');

    if (!manifest.version) {
      warning('Falta campo "version"');
      warnings++;
    } else {
      checkmark(`Versión: ${manifest.version}`);
    }

    if (!manifest.modules) {
      error('Falta campo "modules"');
      errors++;
      return null;
    }

    const categories = Object.keys(manifest.modules);
    checkmark(`Categorías encontradas: ${categories.join(', ')}`);

    let totalModules = 0;
    categories.forEach(category => {
      const modules = Object.keys(manifest.modules[category]);
      totalModules += modules.length;
      log(`  - ${category}: ${modules.length} módulos`, 'blue');
    });

    checkmark(`Total: ${totalModules} módulos en manifest`);
    return manifest;
  } catch (err) {
    error(`Error parseando manifest: ${err.message}`);
    errors++;
    return null;
  }
}

/**
 * Test 2: Verificar estructura de carpetas de módulos
 */
function verifyModuleStructure() {
  header('Test 2: Verificar Estructura de Carpetas');
  checks++;

  if (!fs.existsSync(MODULES_DIR)) {
    error('Carpeta /modules no encontrada');
    errors++;
    return;
  }
  checkmark('Carpeta /modules encontrada');

  const categories = fs.readdirSync(MODULES_DIR);
  if (categories.length === 0) {
    error('Carpeta /modules está vacía');
    errors++;
    return;
  }

  checkmark(`Encontradas ${categories.length} categorías`);

  categories.forEach(category => {
    const categoryPath = path.join(MODULES_DIR, category);
    const stat = fs.statSync(categoryPath);

    if (stat.isDirectory()) {
      const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
      log(`  - ${category}/: ${files.length} archivos .js`, 'blue');
    }
  });
}

/**
 * Test 3: Verificar que todos los módulos del manifest existen como archivos
 */
function verifyModuleFiles(manifest) {
  header('Test 3: Verificar Archivos de Módulos');
  checks++;

  if (!manifest) {
    error('No hay manifest para verificar');
    errors++;
    return;
  }

  let totalChecked = 0;
  let totalFound = 0;
  let totalMissing = 0;

  Object.keys(manifest.modules).forEach(category => {
    log(`\nVerificando categoría: ${category}`, 'yellow');

    Object.entries(manifest.modules[category]).forEach(([moduleName, moduleInfo]) => {
      totalChecked++;
      const filePath = path.join(PUBLIC_DIR, moduleInfo.file);

      if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        checkmark(`${moduleName}: ${moduleInfo.file} (${Math.round(size / 1024 * 10) / 10}KB)`);
        totalFound++;
      } else {
        error(`${moduleName}: ${moduleInfo.file} NO ENCONTRADO`);
        totalMissing++;
        errors++;
      }
    });
  });

  console.log('');
  if (totalMissing === 0) {
    checkmark(`Todos los ${totalChecked} módulos tienen archivos`);
  } else {
    error(`${totalMissing}/${totalChecked} módulos faltan archivos`);
  }
}

/**
 * Test 4: Verificar que los archivos de módulos siguen el patrón correcto
 */
function verifyModulePattern(manifest) {
  header('Test 4: Verificar Patrón de Módulos');
  checks++;

  if (!manifest) {
    error('No hay manifest para verificar');
    errors++;
    return;
  }

  let validModules = 0;
  let invalidModules = 0;

  Object.keys(manifest.modules).forEach(category => {
    Object.entries(manifest.modules[category]).forEach(([moduleName, moduleInfo]) => {
      const filePath = path.join(PUBLIC_DIR, moduleInfo.file);

      if (!fs.existsSync(filePath)) {
        return; // Ya reportado en test anterior
      }

      try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Verificar patrón: window.EsbillaModules = window.EsbillaModules || {};
        if (!content.includes('window.EsbillaModules')) {
          error(`${moduleName}: falta "window.EsbillaModules"`);
          invalidModules++;
          errors++;
          return;
        }

        // Verificar patrón: window.EsbillaModules.moduleName = function(param)
        if (!content.includes(`window.EsbillaModules.${moduleName}`)) {
          error(`${moduleName}: no exporta función como "window.EsbillaModules.${moduleName}"`);
          invalidModules++;
          errors++;
          return;
        }

        // Verificar que retorna template literal
        if (!content.includes('return `')) {
          warning(`${moduleName}: no parece retornar template literal`);
          warnings++;
        }

        validModules++;
      } catch (err) {
        error(`${moduleName}: error leyendo archivo - ${err.message}`);
        invalidModules++;
        errors++;
      }
    });
  });

  console.log('');
  if (invalidModules === 0) {
    checkmark(`${validModules} módulos siguen el patrón correcto`);
  } else {
    error(`${invalidModules} módulos tienen errores de patrón`);
  }
}

/**
 * Test 5: Verificar que el Pegoyu core tiene el loader implementado
 */
function verifySDKCore() {
  header('Test 5: Verificar SDK Core');
  checks++;

  if (!fs.existsSync(SDK_FILE)) {
    error('pegoyu.js no encontrado');
    errors++;
    return;
  }
  checkmark('pegoyu.js encontrado');

  try {
    const sdkContent = fs.readFileSync(SDK_FILE, 'utf-8');
    const sdkSize = (fs.statSync(SDK_FILE).size / 1024).toFixed(2);
    checkmark(`Tamaño: ${sdkSize}KB`);

    // Verificar versión
    const versionMatch = sdkContent.match(/const PEGOYU_VERSION = ['"](.+?)['"]/);
    if (versionMatch) {
      checkmark(`Versión: ${versionMatch[1]}`);
    } else {
      warning('No se encontró PEGOYU_VERSION');
      warnings++;
    }

    // Verificar que tiene el loader
    if (!sdkContent.includes('function loadModule')) {
      error('Falta función loadModule()');
      errors++;
    } else {
      checkmark('Función loadModule() presente');
    }

    // Verificar que tiene el moduleMap
    if (!sdkContent.includes('const moduleMap')) {
      error('Falta const moduleMap');
      errors++;
    } else {
      checkmark('moduleMap presente');
    }

    // Verificar que NO tiene scriptTemplates monolítico
    if (sdkContent.includes('const scriptTemplates = {')) {
      error('¡Aún tiene scriptTemplates monolítico!');
      errors++;
    } else {
      checkmark('scriptTemplates monolítico eliminado ✓');
    }

    // Verificar que loadDynamicScripts usa loadModule
    if (!sdkContent.includes('loadModule(moduleName)')) {
      error('loadDynamicScripts no usa loadModule()');
      errors++;
    } else {
      checkmark('loadDynamicScripts usa loadModule() ✓');
    }

    // Verificar window.EsbillaModules
    if (!sdkContent.includes('window.EsbillaModules')) {
      error('Falta window.EsbillaModules');
      errors++;
    } else {
      checkmark('window.EsbillaModules presente');
    }

  } catch (err) {
    error(`Error leyendo pegoyu.js: ${err.message}`);
    errors++;
  }
}

/**
 * Test 6: Verificar integridad de nombres de módulos
 */
function verifyModuleNaming(manifest) {
  header('Test 6: Verificar Nombres de Módulos');
  checks++;

  if (!manifest) {
    error('No hay manifest para verificar');
    errors++;
    return;
  }

  // Leer moduleMap del Pegoyu
  try {
    const sdkContent = fs.readFileSync(SDK_FILE, 'utf-8');

    // Extraer moduleMap del Pegoyu
    const moduleMapMatch = sdkContent.match(/const moduleMap = \{([^}]+(?:\{[^}]+\}[^}]+)*)\};/s);

    if (!moduleMapMatch) {
      error('No se pudo extraer moduleMap del Pegoyu');
      errors++;
      return;
    }

    const moduleMapStr = moduleMapMatch[1];

    // Verificar que cada módulo del manifest está en moduleMap
    let missingInMap = 0;
    Object.keys(manifest.modules).forEach(category => {
      Object.keys(manifest.modules[category]).forEach(moduleName => {
        if (!moduleMapStr.includes(`${moduleName}:`)) {
          error(`${moduleName} no está en moduleMap del Pegoyu`);
          missingInMap++;
          errors++;
        }
      });
    });

    if (missingInMap === 0) {
      checkmark('Todos los módulos del manifest están en moduleMap del Pegoyu');
    }

  } catch (err) {
    error(`Error verificando nombres: ${err.message}`);
    errors++;
  }
}

/**
 * Resumen final
 */
function printSummary() {
  console.log('');
  log('═══════════════════════════════════════════════', 'cyan');
  log('  RESUMEN DE VERIFICACIÓN', 'cyan');
  log('═══════════════════════════════════════════════', 'cyan');
  console.log('');

  log(`Tests ejecutados: ${checks}`, 'blue');

  if (errors > 0) {
    log(`Errores: ${errors}`, 'red');
  } else {
    log(`Errores: 0`, 'green');
  }

  if (warnings > 0) {
    log(`Advertencias: ${warnings}`, 'yellow');
  } else {
    log(`Advertencias: 0`, 'green');
  }

  console.log('');

  if (errors === 0 && warnings === 0) {
    log('🎉 ¡ARQUITECTURA MODULAR VERIFICADA EXITOSAMENTE!', 'green');
    log('Todos los componentes están correctamente configurados.', 'green');
    process.exit(0);
  } else if (errors === 0) {
    log('✓ Verificación completada con advertencias', 'yellow');
    log('La arquitectura funciona pero hay algunos puntos menores a revisar.', 'yellow');
    process.exit(0);
  } else {
    log('✗ VERIFICACIÓN FALLIDA', 'red');
    log('Hay errores que deben ser corregidos antes de deployar.', 'red');
    process.exit(1);
  }
}

/**
 * Ejecutar todos los tests
 */
function runVerification() {
  log('🌽 Esbilla CMP - Verificación de Arquitectura Modular v2.0', 'cyan');
  log(`Directorio: ${PUBLIC_DIR}`, 'blue');
  console.log('');

  const manifest = verifyManifest();
  verifyModuleStructure();
  verifyModuleFiles(manifest);
  verifyModulePattern(manifest);
  verifySDKCore();
  verifyModuleNaming(manifest);

  printSummary();
}

// Ejecutar
runVerification();
