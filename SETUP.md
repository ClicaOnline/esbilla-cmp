# Setup Guide - Entornos Dev y Producción

Guía completa para configurar los entornos de desarrollo y producción con CI/CD automático.

## 📋 Pre-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- Acceso a GitHub con permisos de administrador del repositorio

---

## 🔧 Configuración Inicial

### 1. Crear Proyectos Firebase

#### Development
```bash
# Login en Firebase
firebase login

# Crear proyecto de desarrollo
firebase projects:create esbilla-development --display-name="Esbilla CMP (Development)"

# Habilitar servicios necesarios
firebase use esbilla-development
firebase init hosting
firebase init firestore
```

#### Production
```bash
# Crear proyecto de producción
firebase projects:create esbilla-production --display-name="Esbilla CMP (Production)"

# Habilitar servicios necesarios
firebase use esbilla-production
firebase init hosting
firebase init firestore
```

### 2. Configurar Hosting Targets

```bash
# Development
firebase target:apply hosting dev esbilla-development
firebase target:apply hosting dashboard-dev esbilla-app-dev

# Production
firebase target:apply hosting prod esbilla-production
firebase target:apply hosting dashboard-prod esbilla-app
```

### 3. Crear Proyectos Google Cloud

```bash
# Login en GCP
gcloud auth login

# Development
gcloud projects create esbilla-development --name="Esbilla Development"
gcloud config set project esbilla-development

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Production
gcloud projects create esbilla-production --name="Esbilla Production"
gcloud config set project esbilla-production

# Habilitar APIs necesarias
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

---

## 🔑 Configurar GitHub Secrets

### Obtener Tokens Firebase

```bash
# Obtener token para development
firebase login:ci

# Guardar el token y repetir para cada proyecto
```

### Obtener Service Account Keys de GCP

```bash
# Development
gcloud iam service-accounts create github-actions-dev \
  --display-name="GitHub Actions Dev" \
  --project=esbilla-development

gcloud projects add-iam-policy-binding esbilla-development \
  --member="serviceAccount:github-actions-dev@esbilla-development.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding esbilla-development \
  --member="serviceAccount:github-actions-dev@esbilla-development.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud iam service-accounts keys create gcp-dev-key.json \
  --iam-account=github-actions-dev@esbilla-development.iam.gserviceaccount.com

# Production (repetir con esbilla-production)
gcloud iam service-accounts create github-actions-prod \
  --display-name="GitHub Actions Prod" \
  --project=esbilla-production

gcloud projects add-iam-policy-binding esbilla-production \
  --member="serviceAccount:github-actions-prod@esbilla-production.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding esbilla-production \
  --member="serviceAccount:github-actions-prod@esbilla-production.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud iam service-accounts keys create gcp-prod-key.json \
  --iam-account=github-actions-prod@esbilla-production.iam.gserviceaccount.com
```

### Añadir Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions → New repository secret

**Development Secrets:**
- `FIREBASE_TOKEN_DEV`: Token de Firebase CLI para development
- `GCP_SA_KEY_DEV`: Contenido completo de `gcp-dev-key.json`
- `FIREBASE_PROJECT_ID_DEV`: `esbilla-development`
- `FIREBASE_API_KEY_DEV`: Desde Firebase Console → Project Settings → Web App
- `FIREBASE_AUTH_DOMAIN_DEV`: `esbilla-development.firebaseapp.com`
- `FIREBASE_STORAGE_BUCKET_DEV`: `esbilla-development.appspot.com`
- `FIREBASE_MESSAGING_SENDER_ID_DEV`: Desde Firebase Console
- `FIREBASE_APP_ID_DEV`: Desde Firebase Console

**Production Secrets:**
- `FIREBASE_TOKEN_PROD`: Token de Firebase CLI para production
- `GCP_SA_KEY_PROD`: Contenido completo de `gcp-prod-key.json`
- `FIREBASE_PROJECT_ID_PROD`: `esbilla-production`
- `FIREBASE_API_KEY_PROD`: Desde Firebase Console → Project Settings → Web App
- `FIREBASE_AUTH_DOMAIN_PROD`: `esbilla-production.firebaseapp.com`
- `FIREBASE_STORAGE_BUCKET_PROD`: `esbilla-production.appspot.com`
- `FIREBASE_MESSAGING_SENDER_ID_PROD`: Desde Firebase Console
- `FIREBASE_APP_ID_PROD`: Desde Firebase Console

---

## 🌿 Configurar Ramas Git

### 1. Crear rama develop

```bash
# Desde main
git checkout main
git pull origin main

# Crear develop
git checkout -b develop
git push origin develop
```

### 2. Configurar Branch Protection

En GitHub → Settings → Branches → Add rule:

**Para `main`:**
- Branch name pattern: `main`
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Tests & Validation
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

**Para `develop`:**
- Branch name pattern: `develop`
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Tests & Validation
- ✅ Require branches to be up to date before merging

---

## 🚀 Primer Despliegue

### Development

```bash
# Desde la rama develop
git checkout develop
git pull origin develop

# Hacer un cambio pequeño para trigger el deploy
git commit --allow-empty -m "chore: trigger first dev deployment"
git push origin develop

# Verificar en GitHub Actions que el workflow se ejecuta correctamente
```

### Production

```bash
# Cuando develop esté estable
git checkout main
git merge develop
git push origin main

# Verificar en GitHub Actions que el workflow se ejecuta correctamente
```

---

## 🧪 Verificar que Todo Funciona

### 1. Verificar Workflows

Ve a GitHub → Actions y verifica que:
- ✅ Deploy Development se ejecutó correctamente
- ✅ Deploy Production se ejecutó correctamente

### 2. Verificar Deployments

**Development:**
- Landing: https://esbilla-development.web.app
- API: https://api-dev.esbilla.com (configurar dominio custom en Cloud Run)
- Dashboard: https://esbilla-app-dev.web.app

**Production:**
- Landing: https://esbilla-production.web.app
- API: https://api.esbilla.com (configurar dominio custom en Cloud Run)
- Dashboard: https://esbilla-app.web.app

### 3. Verificar Logs

```bash
# Firebase Hosting
firebase hosting:sites:list --project esbilla-development

# Cloud Run
gcloud run services list --region europe-west4 --project esbilla-development
```

---

## 🌐 Configurar Dominios Personalizados

### Firebase Hosting

```bash
# Development
firebase hosting:sites:create dev.esbilla.com --project esbilla-development
firebase hosting:sites:create app-dev.esbilla.com --project esbilla-development

# Production
firebase hosting:sites:create esbilla.com --project esbilla-production
firebase hosting:sites:create app.esbilla.com --project esbilla-production
```

### Cloud Run

```bash
# Development
gcloud run domain-mappings create \
  --service esbilla-api-dev \
  --domain api-dev.esbilla.com \
  --region europe-west4 \
  --project esbilla-development

# Production
gcloud run domain-mappings create \
  --service esbilla-api \
  --domain api.esbilla.com \
  --region europe-west4 \
  --project esbilla-production
```

Luego configurar los registros DNS según las instrucciones que proporcione el comando.

---

## 📝 Configuración Local

### Dashboard

```bash
cd esbilla-dashboard

# Copiar archivos de ejemplo
cp .env.development.example .env.development
cp .env.production.example .env.production

# Editar con tus valores reales
nano .env.development
nano .env.production

# Añadir a .gitignore (ya debería estar)
echo ".env.development" >> .gitignore
echo ".env.production" >> .gitignore
```

---

## ✅ Checklist Final

- [ ] Proyectos Firebase creados (dev y prod)
- [ ] Proyectos GCP creados (dev y prod)
- [ ] Service Accounts creados con permisos correctos
- [ ] Todos los secrets configurados en GitHub
- [ ] Branch protection rules configurados
- [ ] Rama `develop` creada
- [ ] Workflows de GitHub Actions funcionando
- [ ] Primer deployment exitoso en development
- [ ] Primer deployment exitoso en production
- [ ] Dominios personalizados configurados
- [ ] Variables de entorno locales configuradas

---

## 🆘 Troubleshooting

### Error: "Permission denied" en Cloud Run

```bash
# Verificar que el service account tiene los permisos correctos
gcloud projects get-iam-policy esbilla-development \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-dev@esbilla-development.iam.gserviceaccount.com"

# Añadir permisos faltantes
gcloud projects add-iam-policy-binding esbilla-development \
  --member="serviceAccount:github-actions-dev@esbilla-development.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Error: "Firebase project not found"

```bash
# Verificar que los nombres de proyecto coinciden
firebase projects:list

# Actualizar .firebaserc si es necesario
```

### Error: Build fails en GitHub Actions

1. Verificar que todos los secrets están configurados correctamente
2. Revisar los logs en GitHub Actions
3. Probar el build localmente: `npm run build`

---

## 📚 Recursos

- [Testing.md](./Testing.md) - Estrategia completa de testing y deployment
- [CLAUDE.md](./CLAUDE.md) - Información general del proyecto
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
