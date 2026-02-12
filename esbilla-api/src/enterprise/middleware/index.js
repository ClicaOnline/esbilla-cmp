/**
 * Enterprise Edition Middleware
 *
 * Sistema de middlewares para features empresariales:
 * - Multi-tenancy validation
 * - Quota enforcement
 * - Organization access control
 * - Plan limits verification
 */

const { getFirestore } = require('firebase-admin/firestore');
const { hasFeature } = require('../../config/edition.js');

/**
 * Middleware para validar acceso a organización
 * Verifica que el usuario tenga acceso a la organización especificada
 */
async function validateOrganizationAccess(req, res, next) {
  if (!hasFeature('multiTenancy')) {
    // En CE, no hay multi-tenancy, continuar sin validar
    return next();
  }

  try {
    const { organizationId } = req.params.organizationId ? req.params : req.body;
    const userId = req.user?.uid; // Asume que auth middleware ya validó el token

    if (!organizationId) {
      return res.status(400).json({
        error: 'MISSING_ORGANIZATION_ID',
        message: 'Organization ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User document not found'
      });
    }

    const userData = userDoc.data();

    // Superadmin tiene acceso a todo
    if (userData.globalRole === 'superadmin') {
      req.userRole = 'superadmin';
      return next();
    }

    // Verificar acceso a organización
    const orgAccess = userData.orgAccess?.[organizationId];
    if (!orgAccess) {
      return res.status(403).json({
        error: 'ORGANIZATION_ACCESS_DENIED',
        message: 'You do not have access to this organization'
      });
    }

    // Añadir rol al request para uso posterior
    req.userRole = orgAccess.role;
    req.organizationId = organizationId;

    next();
  } catch (error) {
    console.error('[validateOrganizationAccess] Error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error validating organization access'
    });
  }
}

/**
 * Middleware para validar quotas
 * Verifica que la organización no haya excedido sus límites
 */
async function enforceQuotas(req, res, next) {
  if (!hasFeature('quotas')) {
    // En CE, no hay quotas, continuar sin validar
    return next();
  }

  try {
    const organizationId = req.organizationId || req.body.organizationId;

    if (!organizationId) {
      // Si no hay organizationId, no se puede validar quota
      // (puede ser una ruta que no requiere org)
      return next();
    }

    const db = getFirestore();
    const orgDoc = await db.collection('organizations').doc(organizationId).get();

    if (!orgDoc.exists) {
      return res.status(404).json({
        error: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found'
      });
    }

    const orgData = orgDoc.data();
    const { plan, maxSites, maxConsentsPerMonth } = orgData;

    // Validar límite de sites (si la ruta es crear site)
    if (req.path.includes('/sites') && req.method === 'POST') {
      const sitesSnapshot = await db
        .collection('sites')
        .where('organizationId', '==', organizationId)
        .get();

      const currentSitesCount = sitesSnapshot.size;

      if (maxSites !== -1 && currentSitesCount >= maxSites) {
        return res.status(403).json({
          error: 'QUOTA_EXCEEDED',
          message: `Your ${plan} plan allows a maximum of ${maxSites} sites. Please upgrade to add more.`,
          quota: {
            type: 'sites',
            limit: maxSites,
            current: currentSitesCount
          },
          upgrade: 'https://esbilla.com/pricing'
        });
      }
    }

    // Validar límite de consents (si la ruta es logging consent)
    if (req.path.includes('/consent/log') && req.method === 'POST') {
      // Contar consents del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const consentsSnapshot = await db
        .collection('consents')
        .where('organizationId', '==', organizationId)
        .where('createdAt', '>=', startOfMonth)
        .get();

      const currentConsentsCount = consentsSnapshot.size;

      if (maxConsentsPerMonth !== -1 && currentConsentsCount >= maxConsentsPerMonth) {
        return res.status(403).json({
          error: 'QUOTA_EXCEEDED',
          message: `Your ${plan} plan allows ${maxConsentsPerMonth} consents per month. Please upgrade for more.`,
          quota: {
            type: 'consents',
            limit: maxConsentsPerMonth,
            current: currentConsentsCount
          },
          upgrade: 'https://esbilla.com/pricing'
        });
      }
    }

    next();
  } catch (error) {
    console.error('[enforceQuotas] Error:', error);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Error enforcing quotas'
    });
  }
}

/**
 * Middleware para validar permisos de rol
 * @param {string[]} allowedRoles - Roles permitidos para acceder a la ruta
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!hasFeature('multiTenancy')) {
      // En CE, no hay roles, continuar
      return next();
    }

    const userRole = req.userRole;

    if (!userRole) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'User role not found'
      });
    }

    // Superadmin siempre tiene acceso
    if (userRole === 'superadmin') {
      return next();
    }

    // Verificar si el rol del usuario está en los permitidos
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        requiredRoles: allowedRoles,
        userRole
      });
    }

    next();
  };
}

/**
 * Hook para extender creación de site con validaciones EE
 * Se llama desde la ruta CE antes de crear el site
 */
async function beforeCreateSite(req, res, siteData) {
  if (!hasFeature('multiTenancy')) {
    return { valid: true, data: siteData };
  }

  try {
    // Validar que el site pertenezca a una organización válida
    if (!siteData.organizationId) {
      return {
        valid: false,
        error: {
          status: 400,
          code: 'MISSING_ORGANIZATION_ID',
          message: 'Sites must belong to an organization'
        }
      };
    }

    const db = getFirestore();
    const orgDoc = await db.collection('organizations').doc(siteData.organizationId).get();

    if (!orgDoc.exists) {
      return {
        valid: false,
        error: {
          status: 404,
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        }
      };
    }

    // Añadir metadata de organización al site
    const orgData = orgDoc.data();
    const enrichedData = {
      ...siteData,
      organizationName: orgData.name,
      plan: orgData.plan
    };

    return { valid: true, data: enrichedData };
  } catch (error) {
    console.error('[beforeCreateSite] Error:', error);
    return {
      valid: false,
      error: {
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error validating site creation'
      }
    };
  }
}

/**
 * Hook para extender logging de consent con features EE
 */
async function beforeLogConsent(req, res, consentData) {
  // En CE, no se añade nada extra
  if (!hasFeature('multiTenancy')) {
    return { valid: true, data: consentData };
  }

  try {
    // Obtener organizationId del site
    const db = getFirestore();
    const siteDoc = await db.collection('sites').doc(consentData.siteId).get();

    if (!siteDoc.exists) {
      return {
        valid: false,
        error: {
          status: 404,
          code: 'SITE_NOT_FOUND',
          message: 'Site not found'
        }
      };
    }

    const siteData = siteDoc.data();

    // Añadir organizationId al consent para facilitar queries
    const enrichedData = {
      ...consentData,
      organizationId: siteData.organizationId || null
    };

    return { valid: true, data: enrichedData };
  } catch (error) {
    console.error('[beforeLogConsent] Error:', error);
    return { valid: true, data: consentData }; // No bloquear logging por error
  }
}

module.exports = {
  validateOrganizationAccess,
  enforceQuotas,
  requireRole,
  beforeCreateSite,
  beforeLogConsent
};
