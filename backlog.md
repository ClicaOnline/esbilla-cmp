
### 📋 Informe de Auditoría Esbilla-CMP

**Estado del Checklist**

| Criterio | Estado | Detalles |
| :--- | :--- | :--- |
| Core Legal | [OK] | Registro inmutable (.add() siempre), IP anonimizada (hashIP SHA-256), versión política (bannerVersion), timestamps (createdAt/expiresAt), Firestore rules bloquean write
| SDK Front | [PARCIAL] | Vanilla JS ~20KB (OK), Google Consent Mode V2 implementado, pero falta interceptor explícito (type="text/plain" o MutationObserver) para bloqueo de scripts
| UI/UX | [OK] | Banner con Aceptar/Rechazar/Configurar, persistencia LocalStorage, selector de idioma, múltiples plantillas
| Backend API | [OK] | POST /api/consent/log con Firestore, Cloud Run para alta concurrencia, TTL 3 años GDPR
| Dashboard | [PARCIAL] | CRUD dominios (Sites.tsx), logs (Footprint.tsx), stats (Dashboard.tsx). Falta: personalización visual completa del banner
| Infra | [PARCIAL] | Dockerfile ✓, docker-compose.yml ✓. Falta: manifiestos K8s/Helm
| Cloud | [PARCIAL] | Cloud Run configurado, Firebase Hosting via GitHub Actions. Falta: Terraform/IaC
| Licencia | [PENDIENTE] | Sin LICENSE ni CONTRIBUTING.md en raíz


**Backlog Prioritario**

- Crear LICENSE - Definir modelo de licencia (MIT/Apache/comercial) en raíz
- Crear CONTRIBUTING.md - Guía de contribución para la comunidad
- SDK: Implementar script blocking - Añadir interceptor type="text/plain" o MutationObserver para bloquear scripts antes del consentimiento
- Dashboard: Editor visual de banner - UI para personalizar colores, posición, textos del banner
- Infra: Manifiestos Kubernetes - Crear k8s/ con Deployment, Service, Ingress, ConfigMap
- Cloud: Terraform - IaC para Cloud Run, Firestore, IAM, VPC en terraform/
- Infra: Helm Chart - Chart parametrizable para despliegues multi-entorno

### Auditoría Técnica: Esbilla-CMP Multi-tenant SaaS

| Criterio | Estado | Observaciones |
| :--- | :--- | :--- |
| Multi-tenancy jerárquica | [PARCIAL] | Existe sites y organizations pero estructura plana, no jerárquica (distribuidores > empresas > dominios) |
| Identidad Unificada | [PARCIAL] | userHash basado en footprintId+IP+UA (dispositivo), no en UID/Email del usuario entre dominios |
| Firestore Schema | [OK] | timestamp ✓, metadata.domain ✓, choices ✓, bannerVersion ✓, expiresAt ✓ |
| Seguridad acceso cruzado | [PARCIAL] | hasSiteAccess(siteId) aísla por sitio, pero sin nivel distribuidor en reglas |
| SDK sin claves maestras | [OK] | SDK llama a API backend (/api/consent/log), no accede directamente a Firestore |
| Privacidad/Anonimización | [OK] | serHash SHA-256, ipHash, endpoint transparencia /api/consent/history/:footprintId |


**Fixes Prioritarios**

- Implementar jerarquía multi-tenant:
    - distributors/{distId}/companies/{compId}/sites/{siteId}
    O añadir campos distributorId, companyId a sites con reglas de aislamiento.

- Unificar identidad entre dominios:
    - Añadir campo opcional unifiedUserId (hash de email si usuario autenticado)
    - Permitir cruzar consentimientos del mismo usuario en distintos dominios del mismo cliente

- Reglas Firestore para distribuidores:
    function hasDistributorAccess(distId) {
    return getUserData().distributorId == distId;
    }

- Añadir distributorId al schema de consents para queries segmentadas por distribuidor.