# Testing & Deployment Strategy

Sistema de despliegue automático con entornos de desarrollo y producción para Esbilla CMP.

## 📋 Índice

1. [Estrategia de Ramas](#estrategia-de-ramas)
2. [Entornos](#entornos)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Variables de Entorno](#variables-de-entorno)
5. [Flujo de Trabajo](#flujo-de-trabajo)
6. [Comandos Útiles](#comandos-útiles)

---

## 🌳 Estrategia de Ramas

### Ramas Principales

```
main (production)
  ↑
  merge cuando está listo
  ↑
develop (development/staging)
  ↑
  merge features aquí
  ↑
feature/* (nuevas funcionalidades)
```

### Nomenclatura de Ramas

- **`main`**: Producción - siempre estable, deployable
- **`develop`**: Development/Staging - testing de nuevas features
- **`feature/*`**: Features individuales (ej: `feature/user-search`, `feature/pagination`)
- **`hotfix/*`**: Fixes urgentes para producción (ej: `hotfix/critical-bug`)
- **`release/*`**: Preparación de releases (ej: `release/v1.2.0`)

### Reglas de Protección

#### Rama `main` (Production)
- ✅ Requiere Pull Request
- ✅ Requiere revisión de al menos 1 persona
- ✅ Requiere CI/CD pasando (tests + build)
- ✅ No permite force push
- ✅ Solo admite merges desde `develop` o `hotfix/*`

#### Rama `develop` (Development)
- ✅ Requiere Pull Request
- ✅ Requiere CI/CD pasando
- ✅ No permite force push
- ✅ Admite merges desde `feature/*` y `hotfix/*`

---

## 🌍 Entornos

### Production (main)

**Dominio**: `https://esbilla.com`

| Componente | URL | Servicio |
|------------|-----|----------|
| Landing Page | `https://esbilla.com` | Firebase Hosting |
| API | `https://api.esbilla.com` | Google Cloud Run |
| Dashboard | `https://app.esbilla.com` | Firebase Hosting |

**Firebase Project**: `esbilla-production`
**GCP Project**: `esbilla-production`
**Region**: `europe-west4` (Netherlands)

### Development (develop)

**Dominio**: `https://dev.esbilla.com`

| Componente | URL | Servicio |
|------------|-----|----------|
| Landing Page | `https://dev.esbilla.com` | Firebase Hosting |
| API | `https://api-dev.esbilla.com` | Google Cloud Run |
| Dashboard | `https://app-dev.esbilla.com` | Firebase Hosting |

**Firebase Project**: `esbilla-development`
**GCP Project**: `esbilla-development`
**Region**: `europe-west4` (Netherlands)

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Development Deployment (`deploy-dev.yml`)

**Trigger**: Push a `develop`

```yaml
name: Deploy Development

on:
  push:
    branches:
      - develop

jobs:
  deploy-landing:
    name: Deploy Landing to Firebase (Dev)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build Landing
        run: npm run build:public
        env:
          VITE_ENV: development
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --only hosting:dev --project esbilla-development
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_DEV }}

  deploy-api:
    name: Deploy API to Cloud Run (Dev)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_DEV }}
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      - name: Build and Push Docker
        run: |
          cd esbilla-api
          gcloud builds submit --tag gcr.io/esbilla-development/esbilla-api:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy esbilla-api-dev \
            --image gcr.io/esbilla-development/esbilla-api:${{ github.sha }} \
            --platform managed \
            --region europe-west4 \
            --allow-unauthenticated \
            --set-env-vars NODE_ENV=development

  deploy-dashboard:
    name: Deploy Dashboard to Firebase (Dev)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build Dashboard
        working-directory: esbilla-dashboard
        run: npm run build
        env:
          VITE_ENV: development
          VITE_API_URL: https://api-dev.esbilla.com
          VITE_FIREBASE_PROJECT_ID: esbilla-development
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --only hosting:dashboard-dev --project esbilla-development
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_DEV }}
```

#### 2. Production Deployment (`deploy-prod.yml`)

**Trigger**: Push a `main` (después de merge desde `develop`)

```yaml
name: Deploy Production

on:
  push:
    branches:
      - main

jobs:
  deploy-landing:
    name: Deploy Landing to Firebase (Prod)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build Landing
        run: npm run build:public
        env:
          VITE_ENV: production
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --only hosting:prod --project esbilla-production
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_PROD }}

  deploy-api:
    name: Deploy API to Cloud Run (Prod)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_PROD }}
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      - name: Build and Push Docker
        run: |
          cd esbilla-api
          gcloud builds submit --tag gcr.io/esbilla-production/esbilla-api:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy esbilla-api \
            --image gcr.io/esbilla-production/esbilla-api:${{ github.sha }} \
            --platform managed \
            --region europe-west4 \
            --allow-unauthenticated \
            --set-env-vars NODE_ENV=production

  deploy-dashboard:
    name: Deploy Dashboard to Firebase (Prod)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Build Dashboard
        working-directory: esbilla-dashboard
        run: npm run build
        env:
          VITE_ENV: production
          VITE_API_URL: https://api.esbilla.com
          VITE_FIREBASE_PROJECT_ID: esbilla-production
      - name: Deploy to Firebase
        run: |
          npm install -g firebase-tools
          firebase deploy --only hosting:dashboard-prod --project esbilla-production
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN_PROD }}
```

#### 3. Tests & Validation (`test.yml`)

**Trigger**: Pull Request a `develop` o `main`

```yaml
name: Tests & Validation

on:
  pull_request:
    branches:
      - develop
      - main

jobs:
  test-landing:
    name: Test Landing Page
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm run test -w esbilla-public -- --run
      - name: Build check
        run: npm run build:public

  test-api:
    name: Test API
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: esbilla-api
        run: npm install
      - name: Run tests
        working-directory: esbilla-api
        run: npm test

  test-dashboard:
    name: Test Dashboard
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        working-directory: esbilla-dashboard
        run: npm install
      - name: Lint
        working-directory: esbilla-dashboard
        run: npm run lint
      - name: Type check
        working-directory: esbilla-dashboard
        run: npm run type-check || tsc --noEmit
      - name: Build check
        working-directory: esbilla-dashboard
        run: npm run build
        env:
          VITE_ENV: development
          VITE_API_URL: https://api-dev.esbilla.com
```

---

## 🔐 Variables de Entorno

### GitHub Secrets Requeridos

#### Development
- `FIREBASE_TOKEN_DEV`: Token de Firebase para deployment del entorno dev
- `GCP_SA_KEY_DEV`: Service Account Key de Google Cloud (development)
- `FIRESTORE_DEV_CONFIG`: Configuración de Firestore (development)

#### Production
- `FIREBASE_TOKEN_PROD`: Token de Firebase para deployment del entorno prod
- `GCP_SA_KEY_PROD`: Service Account Key de Google Cloud (production)
- `FIRESTORE_PROD_CONFIG`: Configuración de Firestore (production)

### Configuración por Entorno

#### Development (`.env.development`)

```bash
# Firebase
VITE_FIREBASE_API_KEY=your-dev-api-key
VITE_FIREBASE_AUTH_DOMAIN=esbilla-development.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esbilla-development
VITE_FIREBASE_STORAGE_BUCKET=esbilla-development.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# API
VITE_API_URL=https://api-dev.esbilla.com

# Environment
VITE_ENV=development
NODE_ENV=development
```

#### Production (`.env.production`)

```bash
# Firebase
VITE_FIREBASE_API_KEY=your-prod-api-key
VITE_FIREBASE_AUTH_DOMAIN=esbilla-production.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=esbilla-production
VITE_FIREBASE_STORAGE_BUCKET=esbilla-production.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# API
VITE_API_URL=https://api.esbilla.com

# Environment
VITE_ENV=production
NODE_ENV=production
```

---

## 📝 Flujo de Trabajo

### 1. Desarrollar Nueva Feature

```bash
# Asegurarse de estar en develop actualizado
git checkout develop
git pull origin develop

# Crear rama de feature
git checkout -b feature/nombre-feature

# Desarrollar y hacer commits
git add .
git commit -m "feat: descripción del cambio"

# Pushear la rama
git push origin feature/nombre-feature
```

### 2. Crear Pull Request a `develop`

1. Ir a GitHub → Pull Requests → New Pull Request
2. Base: `develop` ← Compare: `feature/nombre-feature`
3. Descripción clara del cambio
4. Esperar a que pasen los tests (CI/CD)
5. Solicitar review si es necesario
6. Merge cuando esté aprobado

**Resultado**: Se despliega automáticamente a desarrollo

### 3. Testear en Development

1. Acceder a `https://dev.esbilla.com`
2. Testear la funcionalidad
3. Verificar logs en Firebase/GCP Console
4. Si hay problemas, hacer fix en `develop` directamente o crear `hotfix/`

### 4. Promover a Production

```bash
# Asegurarse de que develop está estable
git checkout develop
git pull origin develop

# Crear Pull Request de develop → main
git checkout main
git pull origin main
```

1. Crear PR en GitHub: `develop` → `main`
2. Review obligatorio
3. Esperar tests
4. Merge a `main`

**Resultado**: Se despliega automáticamente a producción

### 5. Hotfix Urgente en Production

```bash
# Crear hotfix desde main
git checkout main
git pull origin main
git checkout -b hotfix/descripcion-fix

# Hacer el fix
git add .
git commit -m "fix: descripción del hotfix urgente"
git push origin hotfix/descripcion-fix
```

1. Crear PR: `hotfix/` → `main`
2. Review express
3. Merge a `main` (deploy automático a prod)
4. **Importante**: Hacer merge de `main` → `develop` para sincronizar

```bash
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

---

## 🛠️ Comandos Útiles

### Testing Local

```bash
# Landing page
npm run dev:public                    # Dev server (puerto 4321)
npm run test -w esbilla-public -- --run  # Tests
npm run build:public                  # Build de producción

# API
npm run start -w esbilla-api          # Dev server (puerto 3000)
npm run test -w esbilla-api           # Tests
docker build -t esbilla-api .         # Build Docker local

# Dashboard
cd esbilla-dashboard
npm run dev                           # Dev server (puerto 5173)
npm run build                         # Build de producción
npm run preview                       # Preview del build
```

### Firebase

```bash
# Login
firebase login

# Ver proyectos
firebase projects:list

# Deploy manual a development
firebase deploy --only hosting:dev --project esbilla-development

# Deploy manual a production
firebase deploy --only hosting:prod --project esbilla-production

# Ver logs
firebase functions:log --project esbilla-development
```

### Google Cloud Run

```bash
# Autenticación
gcloud auth login

# Ver servicios
gcloud run services list --project esbilla-development

# Ver logs del API dev
gcloud run logs read esbilla-api-dev --project esbilla-development --region europe-west4

# Ver logs del API prod
gcloud run logs read esbilla-api --project esbilla-production --region europe-west4

# Deploy manual API dev
cd esbilla-api
gcloud builds submit --tag gcr.io/esbilla-development/esbilla-api:manual
gcloud run deploy esbilla-api-dev \
  --image gcr.io/esbilla-development/esbilla-api:manual \
  --platform managed \
  --region europe-west4 \
  --project esbilla-development

# Deploy manual API prod
gcloud builds submit --tag gcr.io/esbilla-production/esbilla-api:manual
gcloud run deploy esbilla-api \
  --image gcr.io/esbilla-production/esbilla-api:manual \
  --platform managed \
  --region europe-west4 \
  --project esbilla-production
```

### Git

```bash
# Ver estado de ramas
git branch -a
git status

# Actualizar develop desde main (después de hotfix)
git checkout develop
git pull origin develop
git merge main
git push origin develop

# Limpiar ramas mergeadas
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Ver diferencias entre develop y main
git diff develop main

# Ver commits en develop que no están en main
git log main..develop --oneline
```

---

## 📊 Monitoring & Logs

### Firebase Console
- **Development**: https://console.firebase.google.com/project/esbilla-development
- **Production**: https://console.firebase.google.com/project/esbilla-production

### Google Cloud Console
- **Development**: https://console.cloud.google.com/run?project=esbilla-development
- **Production**: https://console.cloud.google.com/run?project=esbilla-production

### GitHub Actions
- **Workflows**: https://github.com/[tu-usuario]/esbilla-cmp/actions

---

## ⚠️ Mejores Prácticas

### DO ✅
- Desarrollar siempre en ramas `feature/*`
- Testear en development antes de promover a producción
- Escribir mensajes de commit descriptivos (conventional commits)
- Hacer PR pequeños y enfocados
- Mantener `develop` siempre deployable
- Sincronizar `develop` después de hotfixes en `main`

### DON'T ❌
- NO hacer push directo a `main` o `develop`
- NO mergear sin que pasen los tests
- NO hacer force push a `main` o `develop`
- NO deployar manualmente sin razón (confiar en CI/CD)
- NO dejar ramas feature sin mergear por mucho tiempo

---

## 🔄 Rollback en Caso de Emergencia

### Firebase Hosting

```bash
# Ver deploys recientes
firebase hosting:releases --project esbilla-production

# Rollback al deploy anterior
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

### Cloud Run

```bash
# Ver revisiones
gcloud run revisions list --service esbilla-api --region europe-west4 --project esbilla-production

# Rollback a revisión anterior
gcloud run services update-traffic esbilla-api \
  --to-revisions REVISION_NAME=100 \
  --region europe-west4 \
  --project esbilla-production
```

### Git Revert

```bash
# Revertir último commit en main (crea nuevo commit)
git checkout main
git pull origin main
git revert HEAD
git push origin main

# Esto triggerea un nuevo deploy automático con el código revertido
```

---

## 📚 Recursos Adicionales

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
