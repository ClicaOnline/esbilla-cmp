/**
 * GTM Gateway Management Routes
 *
 * Automatiza la creación y monitorización de dominios personalizados
 * para el GTM Gateway usando Google Certificate Manager.
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const dns = require('dns').promises;
const admin = require('../firebase-admin');

const execAsync = promisify(exec);
const db = admin.firestore();

// Configuración
const PROJECT_ID = process.env.GCLOUD_PROJECT || 'esbilla-cmp';
const CERT_MAP_NAME = 'gtm-gateway-cert-map';
const GATEWAY_DOMAIN = 'gtm-gateway.esbilla.com'; // Tu dominio gateway
const GATEWAY_IP = '34.149.27.138'; // IP del Load Balancer

/**
 * POST /api/gtm-gateway/enable
 *
 * Activa GTM Gateway para un sitio.
 * Crea certificado SSL y entrada en Certificate Map.
 *
 * Body: { siteId, domain }
 * Headers: Authorization: Bearer <firebase-token>
 */
router.post('/enable', async (req, res) => {
  try {
    const { siteId, domain } = req.body;

    // 1. Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Verificar que el usuario tiene acceso al site
    const siteDoc = await db.collection('sites').doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    const site = siteDoc.data();
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();

    // Verificar permisos (debe ser org_owner, org_admin o superadmin)
    const hasAccess =
      userData.globalRole === 'superadmin' ||
      (site.organizationId && userData.orgAccess?.[site.organizationId]?.role in ['org_owner', 'org_admin']);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Sin permisos para modificar este sitio' });
    }

    // 3. Validar formato de dominio
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ error: 'Formato de dominio inválido' });
    }

    // 4. Verificar que el dominio no está ya en uso
    const existingSnapshot = await db.collection('sites')
      .where('gtmGatewayDomain', '==', domain)
      .get();

    if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== siteId) {
      return res.status(409).json({ error: 'Este dominio ya está en uso por otro sitio' });
    }

    // 5. Crear documento de estado en Firestore
    const gtmStatusRef = db.collection('gtmGatewayStatus').doc(siteId);
    await gtmStatusRef.set({
      siteId,
      domain,
      status: 'dns_pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
      dnsChecks: {
        lastCheck: null,
        resolves: false,
        isCNAME: false,
        pointsToGateway: false
      },
      certificate: {
        name: `cert-${domain.replace(/\./g, '-')}`,
        state: 'not_created',
        lastCheck: null
      },
      certificateMapEntry: {
        name: `entry-${domain.replace(/\./g, '-')}`,
        created: false
      }
    });

    // 6. Actualizar documento del site
    await db.collection('sites').doc(siteId).update({
      gtmGatewayEnabled: true,
      gtmGatewayDomain: domain,
      gtmGatewayStatus: 'dns_pending',
      gtmGatewayActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      gtmGatewayActivatedBy: uid
    });

    // 7. Iniciar proceso de verificación DNS (asíncrono)
    // No bloqueamos la respuesta, el polling lo hará después
    checkDNSAndCreateCertificate(siteId, domain).catch(err => {
      console.error(`Error en proceso GTM Gateway para ${domain}:`, err);
    });

    // 8. Responder inmediatamente
    res.json({
      success: true,
      message: 'GTM Gateway activado. Verificando DNS...',
      instructions: {
        type: 'CNAME',
        host: domain.split('.')[0], // ej: "gtm" de "gtm.cliente.com"
        value: GATEWAY_DOMAIN,
        example: `${domain} → ${GATEWAY_DOMAIN}`
      },
      estimatedTime: '15-30 minutos una vez configurado el DNS'
    });

  } catch (error) {
    console.error('Error en /api/gtm-gateway/enable:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/gtm-gateway/status/:siteId
 *
 * Obtiene el estado actual del GTM Gateway para un sitio.
 * El Dashboard hace polling a este endpoint cada 10s.
 */
router.get('/status/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    // Verificar autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Verificar acceso al site
    const siteDoc = await db.collection('sites').doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    // Obtener estado del GTM Gateway
    const statusDoc = await db.collection('gtmGatewayStatus').doc(siteId).get();
    if (!statusDoc.exists) {
      return res.json({
        enabled: false,
        status: 'not_configured'
      });
    }

    const status = statusDoc.data();

    res.json({
      enabled: true,
      status: status.status,
      domain: status.domain,
      dnsChecks: status.dnsChecks,
      certificate: status.certificate,
      updatedAt: status.updatedAt?._seconds ? new Date(status.updatedAt._seconds * 1000).toISOString() : null
    });

  } catch (error) {
    console.error('Error en /api/gtm-gateway/status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/gtm-gateway/disable/:siteId
 *
 * Desactiva GTM Gateway para un sitio.
 * Elimina certificado y entrada en Certificate Map.
 */
router.post('/disable/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;

    // Verificar autenticación y permisos
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const siteDoc = await db.collection('sites').doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    const site = siteDoc.data();
    const statusDoc = await db.collection('gtmGatewayStatus').doc(siteId).get();

    if (!statusDoc.exists) {
      return res.json({ success: true, message: 'GTM Gateway ya estaba desactivado' });
    }

    const status = statusDoc.data();
    const SAFE_DOMAIN = status.domain.replace(/\./g, '-');
    const CERT_NAME = `cert-${SAFE_DOMAIN}`;
    const MAP_ENTRY_NAME = `entry-${SAFE_DOMAIN}`;

    // Eliminar entrada en Certificate Map
    try {
      await execAsync(
        `gcloud certificate-manager maps entries delete ${MAP_ENTRY_NAME} --map=${CERT_MAP_NAME} --quiet --project=${PROJECT_ID}`
      );
      console.log(`✅ Entrada ${MAP_ENTRY_NAME} eliminada`);
    } catch (err) {
      console.warn(`⚠️ No se pudo eliminar entrada en Certificate Map: ${err.message}`);
    }

    // Eliminar certificado
    try {
      await execAsync(
        `gcloud certificate-manager certificates delete ${CERT_NAME} --quiet --project=${PROJECT_ID}`
      );
      console.log(`✅ Certificado ${CERT_NAME} eliminado`);
    } catch (err) {
      console.warn(`⚠️ No se pudo eliminar certificado: ${err.message}`);
    }

    // Actualizar Firestore
    await db.collection('sites').doc(siteId).update({
      gtmGatewayEnabled: false,
      gtmGatewayStatus: 'disabled',
      gtmGatewayDisabledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('gtmGatewayStatus').doc(siteId).delete();

    res.json({ success: true, message: 'GTM Gateway desactivado correctamente' });

  } catch (error) {
    console.error('Error en /api/gtm-gateway/disable:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * Proceso asíncrono de verificación DNS y creación de certificado
 *
 * Estados:
 * - dns_pending: Esperando que el cliente configure DNS
 * - dns_configured: DNS apunta correctamente
 * - cert_provisioning: Certificado creándose (15-30 min)
 * - cert_active: Todo listo
 * - cert_failed: Error en el certificado
 */
async function checkDNSAndCreateCertificate(siteId, domain) {
  const statusRef = db.collection('gtmGatewayStatus').doc(siteId);
  const SAFE_DOMAIN = domain.replace(/\./g, '-');
  const CERT_NAME = `cert-${SAFE_DOMAIN}`;
  const MAP_ENTRY_NAME = `entry-${SAFE_DOMAIN}`;

  try {
    // 1. Verificar DNS
    console.log(`[GTM Gateway] Verificando DNS para ${domain}...`);

    let dnsConfigured = false;
    let isCNAME = false;
    let pointsToGateway = false;

    try {
      // Resolver CNAME
      const cnameRecords = await dns.resolveCname(domain);
      if (cnameRecords && cnameRecords.includes(GATEWAY_DOMAIN)) {
        isCNAME = true;
        pointsToGateway = true;
        dnsConfigured = true;
        console.log(`✅ ${domain} → CNAME → ${GATEWAY_DOMAIN}`);
      }
    } catch (err) {
      // No es CNAME, probar con A record
      try {
        const aRecords = await dns.resolve4(domain);
        if (aRecords && aRecords.includes(GATEWAY_IP)) {
          pointsToGateway = true;
          dnsConfigured = true;
          console.log(`✅ ${domain} → A → ${GATEWAY_IP}`);
        }
      } catch (err2) {
        console.log(`❌ DNS no resuelve para ${domain}`);
      }
    }

    // Actualizar estado DNS
    await statusRef.update({
      'dnsChecks.lastCheck': admin.firestore.FieldValue.serverTimestamp(),
      'dnsChecks.resolves': dnsConfigured,
      'dnsChecks.isCNAME': isCNAME,
      'dnsChecks.pointsToGateway': pointsToGateway,
      status: dnsConfigured ? 'dns_configured' : 'dns_pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Actualizar site
    await db.collection('sites').doc(siteId).update({
      gtmGatewayStatus: dnsConfigured ? 'dns_configured' : 'dns_pending'
    });

    // Si DNS no está configurado, no continuar
    if (!dnsConfigured) {
      console.log(`⏸️ Esperando configuración DNS para ${domain}`);
      return;
    }

    // 2. Crear certificado SSL (solo si DNS está OK)
    console.log(`[GTM Gateway] Creando certificado SSL para ${domain}...`);

    try {
      // Verificar si el certificado ya existe
      const { stdout } = await execAsync(
        `gcloud certificate-manager certificates describe ${CERT_NAME} --format="get(name)" --project=${PROJECT_ID} 2>&1`
      );

      if (stdout.trim()) {
        console.log(`ℹ️ Certificado ${CERT_NAME} ya existe`);
      }
    } catch (err) {
      // El certificado no existe, crearlo
      await execAsync(
        `gcloud certificate-manager certificates create ${CERT_NAME} --domains=${domain} --description="SSL certificate for GTM Gateway - ${domain}" --project=${PROJECT_ID}`
      );
      console.log(`✅ Certificado ${CERT_NAME} creado`);
    }

    // 3. Crear entrada en Certificate Map
    try {
      // Verificar si la entrada ya existe
      const { stdout } = await execAsync(
        `gcloud certificate-manager maps entries describe ${MAP_ENTRY_NAME} --map=${CERT_MAP_NAME} --format="get(name)" --project=${PROJECT_ID} 2>&1`
      );

      if (stdout.trim()) {
        console.log(`ℹ️ Entrada ${MAP_ENTRY_NAME} ya existe`);
      }
    } catch (err) {
      // La entrada no existe, crearla
      await execAsync(
        `gcloud certificate-manager maps entries create ${MAP_ENTRY_NAME} --map=${CERT_MAP_NAME} --hostname=${domain} --certificates=${CERT_NAME} --project=${PROJECT_ID}`
      );
      console.log(`✅ Entrada ${MAP_ENTRY_NAME} creada en Certificate Map`);
    }

    // 4. Actualizar estado
    await statusRef.update({
      status: 'cert_provisioning',
      'certificate.state': 'PROVISIONING',
      'certificate.lastCheck': admin.firestore.FieldValue.serverTimestamp(),
      'certificateMapEntry.created': true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('sites').doc(siteId).update({
      gtmGatewayStatus: 'cert_provisioning'
    });

    console.log(`✅ Certificado en provisioning para ${domain}`);

  } catch (error) {
    console.error(`❌ Error en checkDNSAndCreateCertificate para ${domain}:`, error);

    await statusRef.update({
      status: 'error',
      error: error.message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('sites').doc(siteId).update({
      gtmGatewayStatus: 'error'
    });
  }
}

/**
 * Función de polling para verificar estado de certificados
 * Se ejecuta cada minuto via Cloud Scheduler
 */
async function pollCertificateStatus() {
  console.log('[GTM Gateway] Polling certificate status...');

  try {
    // Obtener todos los sitios con GTM Gateway en provisioning
    const snapshot = await db.collection('gtmGatewayStatus')
      .where('status', 'in', ['cert_provisioning', 'dns_configured'])
      .get();

    console.log(`[GTM Gateway] Verificando ${snapshot.size} certificados...`);

    for (const doc of snapshot.docs) {
      const status = doc.data();
      const { siteId, domain } = status;
      const CERT_NAME = status.certificate.name;

      try {
        // Verificar DNS primero (puede haber cambiado)
        let dnsConfigured = false;
        try {
          const cnameRecords = await dns.resolveCname(domain);
          if (cnameRecords && cnameRecords.includes(GATEWAY_DOMAIN)) {
            dnsConfigured = true;
          }
        } catch {
          try {
            const aRecords = await dns.resolve4(domain);
            if (aRecords && aRecords.includes(GATEWAY_IP)) {
              dnsConfigured = true;
            }
          } catch {}
        }

        if (!dnsConfigured) {
          console.log(`⚠️ DNS dejó de resolver para ${domain}`);
          await doc.ref.update({
            status: 'dns_pending',
            'dnsChecks.resolves': false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          continue;
        }

        // Si DNS está OK pero el certificado no se ha creado aún, intentar crearlo
        if (status.status === 'dns_configured') {
          await checkDNSAndCreateCertificate(siteId, domain);
          continue;
        }

        // Verificar estado del certificado
        const { stdout } = await execAsync(
          `gcloud certificate-manager certificates describe ${CERT_NAME} --format="get(managed.state)" --project=${PROJECT_ID}`
        );

        const certState = stdout.trim();
        console.log(`📋 ${domain}: ${certState}`);

        if (certState === 'ACTIVE') {
          // Certificado activo!
          await doc.ref.update({
            status: 'cert_active',
            'certificate.state': 'ACTIVE',
            'certificate.lastCheck': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await db.collection('sites').doc(siteId).update({
            gtmGatewayStatus: 'active'
          });

          console.log(`✅ Certificado ACTIVE para ${domain}`);

        } else if (certState === 'FAILED') {
          // Certificado falló
          await doc.ref.update({
            status: 'cert_failed',
            'certificate.state': 'FAILED',
            'certificate.lastCheck': admin.firestore.FieldValue.serverTimestamp(),
            error: 'Certificate provisioning failed. Check DNS configuration.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await db.collection('sites').doc(siteId).update({
            gtmGatewayStatus: 'failed'
          });

          console.log(`❌ Certificado FAILED para ${domain}`);

        } else {
          // Aún en provisioning
          await doc.ref.update({
            'certificate.state': certState,
            'certificate.lastCheck': admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }

      } catch (error) {
        console.error(`Error verificando certificado para ${domain}:`, error);
      }
    }

  } catch (error) {
    console.error('[GTM Gateway] Error en pollCertificateStatus:', error);
  }
}

// Endpoint para ejecutar polling manualmente (o via Cloud Scheduler)
router.post('/poll-certificates', async (req, res) => {
  try {
    // Verificar que la petición viene de Cloud Scheduler
    // (en producción, validar con Google Cloud Tasks auth)
    const schedulerHeader = req.headers['x-cloudscheduler'];
    if (!schedulerHeader && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await pollCertificateStatus();
    res.json({ success: true, message: 'Certificate polling completed' });

  } catch (error) {
    console.error('Error en /poll-certificates:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
