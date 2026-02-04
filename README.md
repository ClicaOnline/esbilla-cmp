# 📦 Esbilla-CMP

**Esbilla-CMP** es un proyecto Open Source para la gestión de consentimiento (CMP), diseñado para ser auto-alojado y centrado en la soberanía de los datos. El objetivo es permitir que cualquier desarrollador o empresa despliegue su propia infraestructura de privacidad en **Google Cloud, Docker o Kubernetes**.

---

## 🍎 ¿Por qué "Esbilla"?

El nombre proviene del verbo asturiano **esbillar**, que define el arte de seleccionar, desgranar y limpiar. Tradicionalmente, *esbillar* es quitar la vaina a las legumbres, la cáscara a las avellanas o el erizo a las castañas para llegar al fruto limpio.

En el contexto de la privacidad, **Esbilla-CMP** nace con esa filosofía:
* **Desgrana** la complejidad del cumplimiento legal (RGPD/ePrivacy).
* **Separa** los datos necesarios de los que no lo son.
* **Limpia** el flujo de navegación de scripts no autorizados, dejando solo lo que el usuario ha decidido aceptar.
y apoyado en la comunidad porque para la esbilla se llama a los vecinos.

---

## 🏗️ Estructura del Proyecto (Monorepo)

Este repositorio utiliza una arquitectura de **Monorepo** para gestionar todas las piezas de la "andecha" tecnológica desde un solo lugar:

| Carpeta | Componente | Descripción |
| :--- | :--- | :--- |
| `esbilla-public/` | **Landing Page** | Web pública construida con Astro (Multi-idioma). |
| `esbilla-dashboard/` | **Panel de Control** | Interfaz para gestionar sitios y consentimientos (En desarrollo). |
| `esbilla-api/` | **Backend Core** | API de alta concurrencia para el registro de logs. |
| `esbilla-plugins/` | **Adaptadores** | Conectores para WordPress, Shopify y otros CMS. |

---

## 🚀 Hoja de Ruta y Características Futuras

Este proyecto se encuentra actualmente en fase de desarrollo. Las siguientes características están planificadas para las próximas versiones:

- [ ] **Soberanía de Datos:** Almacenamiento de logs de consentimiento inmutables en tu propia infraestructura.
- [ ] **Despliegue Cloud Native:** Plantillas de Terraform para Google Cloud y Helm Charts para Kubernetes.
- [ ] **SDK Ultra-ligero:** Script JS Vanilla (<50kb) para bloquear scripts de terceros (GTM, Meta Pixel, etc.) antes del consentimiento.
- [ ] **Dashboard de Gestión:** Panel de control para configurar múltiples sitios, textos legales y estilos visuales.
- [ ] **Prueba de Consentimiento:** Sistema de auditoría exportable para cumplir con requerimientos de la AEPD/RGPD.
- [ ] **Multi-idioma Automático:** Detección de región y carga de textos legales específicos por país.

---

## 🛠️ Stack Tecnológico (Previsto)

* **Backend:** Node.js / Go (API de alta concurrencia)
* **Frontend Dashboard:** React / Next.js
* **SDK:** JavaScript Vanilla (Agnóstico a frameworks)
* **Infraestructura:** Docker, K8s, Terraform

---

## ⚖️ Licencia y Propiedad

Este proyecto es propiedad de **Clica Online Soluciones S.L.**. 

**Esbilla-CMP** se distribuye bajo un modelo que fomenta la transparencia y la colaboración, pero protege su explotación comercial:

1.  **Uso No Comercial y Educativo:** Se permite el uso gratuito, la modificación y la creación de forks para proyectos personales o entidades sin ánimo de lucro, siempre que se mantenga la atribución y el enlace a este repositorio.
2.  **Uso Comercial:** La explotación comercial de este software (uso en sitios web corporativos, oferta como servicio SaaS o reventa) está sujeta a una **Licencia Comercial Privada**.
3.  **Contribuciones:** Las aportaciones de código son bienvenidas. Al colaborar, los autores aceptan los términos de contribución que permiten a **Clica Online** la gestión y comercialización del producto.

Para consultas sobre licencias comerciales o soporte: `esbilla@clicaonline.com`

---

## 👷 Contribuir

Si eres desarrollador y quieres ayudar a construir la alternativa Open Source a los CMPs tradicionales:
1. Haz un **Fork** del proyecto.
2. Crea una rama para tu mejora (`git checkout -b feature/mejora`).
3. Envía un **Pull Request**.

---

![Tests](https://github.com/ClicaOnline/esbilla-cmp/actions/workflows/deploy.yml/badge.svg)

Hecho con ❤️ y mentalidad de *esbillar* código.
