/**
 * Hooks System
 *
 * Sistema de hooks que permite al código CE (Community Edition)
 * llamar a funciones EE (Enterprise Edition) si están disponibles.
 *
 * En CE: Los hooks retornan valores por defecto sin ejecutar lógica EE
 * En EE: Los hooks ejecutan la lógica empresarial completa
 *
 * Esto permite que el código base (CE) tenga puntos de extensión
 * donde se pueden inyectar features EE sin modificar el core.
 */

const { isEnterprise } = require('./config/edition.js');

// Lazy load de middlewares EE (solo se importan si ESBILLA_EDITION=enterprise)
let eeMiddleware = null;

if (isEnterprise()) {
  try {
    eeMiddleware = require('./enterprise/middleware/index.js');
    console.log('[Hooks] Enterprise middleware loaded');
  } catch (error) {
    console.error('[Hooks] Error loading enterprise middleware:', error);
    // En modo EE, si no se pueden cargar los middlewares, es un error crítico
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

/**
 * Hook: beforeCreateSite
 * Se ejecuta antes de crear un site para validaciones EE
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Object} siteData - Datos del site a crear
 * @returns {Promise<{valid: boolean, data?: Object, error?: Object}>}
 */
async function beforeCreateSite(req, res, siteData) {
  if (eeMiddleware?.beforeCreateSite) {
    return await eeMiddleware.beforeCreateSite(req, res, siteData);
  }

  // CE: Validación básica sin multi-tenancy
  return { valid: true, data: siteData };
}

/**
 * Hook: beforeLogConsent
 * Se ejecuta antes de guardar un consent para enriquecerlo con datos EE
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Object} consentData - Datos del consent a guardar
 * @returns {Promise<{valid: boolean, data?: Object, error?: Object}>}
 */
async function beforeLogConsent(req, res, consentData) {
  if (eeMiddleware?.beforeLogConsent) {
    return await eeMiddleware.beforeLogConsent(req, res, consentData);
  }

  // CE: Sin enriquecimiento
  return { valid: true, data: consentData };
}

/**
 * Hook: beforeDeleteSite
 * Se ejecuta antes de eliminar un site
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {string} siteId - ID del site a eliminar
 * @returns {Promise<{valid: boolean, error?: Object}>}
 */
async function beforeDeleteSite(req, res, siteId) {
  if (eeMiddleware?.beforeDeleteSite) {
    return await eeMiddleware.beforeDeleteSite(req, res, siteId);
  }

  // CE: Sin validaciones adicionales
  return { valid: true };
}

/**
 * Hook: afterUserCreated
 * Se ejecuta después de crear un usuario
 *
 * @param {Object} userData - Datos del usuario creado
 */
async function afterUserCreated(userData) {
  if (eeMiddleware?.afterUserCreated) {
    await eeMiddleware.afterUserCreated(userData);
  }

  // CE: Sin acciones post-creación
}

/**
 * Middleware: validateOrganizationAccess
 * Valida que el usuario tenga acceso a la organización
 */
function validateOrganizationAccess(req, res, next) {
  if (eeMiddleware?.validateOrganizationAccess) {
    return eeMiddleware.validateOrganizationAccess(req, res, next);
  }

  // CE: Sin multi-tenancy, continuar
  next();
}

/**
 * Middleware: enforceQuotas
 * Valida que no se excedan los límites del plan
 */
function enforceQuotas(req, res, next) {
  if (eeMiddleware?.enforceQuotas) {
    return eeMiddleware.enforceQuotas(req, res, next);
  }

  // CE: Sin quotas, continuar
  next();
}

/**
 * Middleware factory: requireRole
 * Valida que el usuario tenga uno de los roles especificados
 *
 * @param {...string} allowedRoles - Roles permitidos
 */
function requireRole(...allowedRoles) {
  if (eeMiddleware?.requireRole) {
    return eeMiddleware.requireRole(...allowedRoles);
  }

  // CE: Sin roles, continuar
  return (req, res, next) => next();
}

/**
 * Utilidad: getMiddleware
 * Retorna un middleware específico (EE o noop)
 *
 * @param {string} name - Nombre del middleware
 * @returns {Function} Middleware function
 */
function getMiddleware(name) {
  if (eeMiddleware && typeof eeMiddleware[name] === 'function') {
    return eeMiddleware[name];
  }

  // Noop middleware
  return (req, res, next) => next();
}

/**
 * Utilidad: hasEEMiddleware
 * Verifica si un middleware EE específico está disponible
 *
 * @param {string} name - Nombre del middleware
 * @returns {boolean}
 */
function hasEEMiddleware(name) {
  return eeMiddleware && typeof eeMiddleware[name] === 'function';
}

module.exports = {
  // Hooks
  beforeCreateSite,
  beforeLogConsent,
  beforeDeleteSite,
  afterUserCreated,

  // Middlewares
  validateOrganizationAccess,
  enforceQuotas,
  requireRole,

  // Utilities
  getMiddleware,
  hasEEMiddleware
};
