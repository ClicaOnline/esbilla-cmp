# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Esbilla-CMP is an open-source Consent Management Platform (CMP) for GDPR/ePrivacy compliance. The name comes from the Asturian verb "esbillar" (to select/clean). Comments and documentation are primarily in Spanish/Asturian.

## Repository Structure (npm workspaces monorepo)

- **esbilla-public/**: Astro-based landing page with multi-language support (10 languages, default: Asturian)
- **esbilla-api/**: Express.js backend serving the consent SDK and API endpoints
- **esbilla-dashboard/**: React 19 + TypeScript admin panel with Firebase Auth and role-based access control
- **esbilla-plugins/**: CMS connectors (planned)

## Common Commands

```bash
# Install all workspace dependencies
npm install

# Development
npm run dev:public                 # Run landing page dev server (Astro)
npm run start -w esbilla-api       # Run API server locally (port 3000)
npm run dev -w esbilla-dashboard   # Run dashboard dev server (Vite, port 5173)

# Build
npm run build:public                  # Build landing page for production
npm run build -w esbilla-dashboard    # Build dashboard for production (requires Firebase env vars)

# Testing
npm run test -w esbilla-public -- --run   # Run landing page tests (Vitest)
npm run test -w esbilla-api               # Run API tests (Vitest + Supertest)
npm run test -w esbilla-dashboard         # Run dashboard tests (Vitest + Testing Library)
npm run test:watch -w esbilla-dashboard   # Run dashboard tests in watch mode

# Linting
npm run lint -w esbilla-dashboard    # Lint dashboard code (ESLint)

# Data Generation (API)
npm run generate-data -w esbilla-api         # Generate synthetic consent data
npm run generate-data:dry -w esbilla-api     # Dry run (preview without writing)
```

## Architecture

### Landing Page (esbilla-public)
- **Framework**: Astro with Tailwind CSS v4
- **i18n System**: Custom implementation in `src/i18n/`
  - `ui.ts`: Exports language map and default language
  - `utils.ts`: Translation helper functions (`useTranslations`, `getLangFromUrl`)
  - `languages/*.ts`: Individual language translation files
- **Pages**: Dynamic routes at `src/pages/[lang]/` for localized content
- **Testing**: Vitest with jsdom and Testing Library

### API (esbilla-api)
- **Framework**: Express.js (v5) with CORS
- **Entry Point**: `src/index.js` (server) / `src/app.js` (Express app, exported for testing)
- **SDK**: Cookie consent banner (v1.4.0) at `public/sdk.js` with configurable templates in `public/templates/`
- **SDK i18n**: Configuration at `public/i18n/config.json`
- **Security Features**:
  - Rate limiting: 30 requests/min per IP (in-memory store)
  - Domain whitelist: Dynamic CORS from Firestore `sites` collection (5-min cache)
  - Anti-bot validation: User-Agent checking, blocks headless clients
  - GDPR compliance: SHA256-hashed IPs and user identifiers, no PII storage
- **Key Endpoints**:
  - `GET /api/config/:id` - Site configuration (cached 5 min)
  - `POST /api/consent/log` - Log consent choices (rate limited, domain validated)
  - `GET /api/consent/history/:footprintId` - User consent history (GDPR Art. 15)
  - `POST /api/consent/sync` - Cross-domain footprint synchronization
  - `GET /api/health` - Health check
  - `GET /sdk.js` - Consent SDK delivery
  - `GET /dashboard/*` - Dashboard SPA (static fallback)

### Dashboard (esbilla-dashboard)
- **Framework**: React 19 + Vite + TypeScript
- **Routing**: React Router v7
- **Authentication**: Firebase Auth (Google SSO)
- **State Management**: React Context (AuthContext) + TanStack React Query
- **UI**: Tailwind CSS v4, Lucide icons, Recharts for analytics
- **Role-Based Access Control**:
  - **Global roles**: `superadmin` | `pending`
  - **Organization roles**: `org_owner` | `org_admin` | `org_viewer`
  - **Site roles**: `site_admin` | `site_viewer`
  - Permissions cascade: superadmin > org_owner > org_admin > org_viewer > site roles
- **Key Pages**:
  - `Dashboard.tsx` - Analytics overview with 7d/30d/90d charts
  - `Sites.tsx` - Site CRUD (domain, banner config, API keys)
  - `Organizations.tsx` - Organization management (SaaS multi-tenancy)
  - `Users.tsx` - User management and role assignment
  - `Footprint.tsx` - User consent history tracker (GDPR Art. 15)
  - `UrlStats.tsx` - Per-URL consent statistics
  - `Settings.tsx` - System configuration
  - `Login.tsx` - Google SSO authentication

### Database (Firestore)
- **Project**: esbilla-cmp
- **Named Database**: `esbilla-cmp` (separate from default)
- **Security Rules**: `firestore.rules` - Role-based access with multi-level permissions
- **Indexes**: `firestore.indexes.json` - Composite indexes for performance
- **Key Collections**:
  - `users` - Authentication and role assignments
  - `organizations` - Billing entities with plan tiers (free/pro/enterprise)
  - `sites` - Domain configurations and banner settings
  - `consents` - Immutable audit trail with 3-year TTL (`deleteAt` field)
  - `stats` - Pre-aggregated daily counters (reduces read costs)
- **Data Retention**: 3-year TTL on consent records (1095 days), automatic deletion via Firestore TTL

### Deployment
- **Landing**: Firebase Hosting via GitHub Actions (triggers on push to main)
- **API + Dashboard**: Multi-stage Docker build → Google Cloud Run (triggers on changes to `esbilla-api/` or `esbilla-dashboard/`)
  - Stage 1: Build dashboard with Vite (requires Firebase env vars at build time)
  - Stage 2: Copy API code and mount dashboard as static files at `/app/public/dashboard`
- **Region**: europe-west4 (Netherlands) for GDPR compliance

## Environment Variables

### API (esbilla-api)
- `PORT` - Server port (default: 3000)
- `GCLOUD_PROJECT` - GCP project ID (default: 'esbilla-cmp')
- `FIRESTORE_DATABASE_ID` - Named Firestore database (default: 'esbilla-cmp')
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON (for local development)
- `K_SERVICE` - Cloud Run service indicator (auto-set in production)

### Dashboard (esbilla-dashboard)
Required Vite environment variables (`.env` file):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Landing Page (esbilla-public)
May require `.env` for build-time configuration (check `.env.example` if present)

## SDK Integration

The consent SDK is loaded via script tag:
```html
<script
  src="https://[api-url]/sdk.js"
  data-id="site-id"
  data-gtm="GTM-XXXXX"
  data-api="https://custom-api-url"
></script>
```

SDK Features:
- Google Consent Mode V2 implementation
- Blocks tracking scripts until user consent
- Marketing attribution tracking (UTM params, click IDs: gclid, fbclid, etc.)
- Cross-domain footprint synchronization
- Multi-language support (dynamic loading from `i18n/config.json`)
- Configurable templates: `maiz.html` (default), `modal.html`, `bottom-bar.html`

## Key Files for Navigation

### Core Application Files
- [esbilla-api/src/app.js](esbilla-api/src/app.js) - Express app with all routes and middleware
- [esbilla-api/public/sdk.js](esbilla-api/public/sdk.js) - Consent banner SDK (v1.4.0)
- [esbilla-dashboard/src/context/AuthContext.tsx](esbilla-dashboard/src/context/AuthContext.tsx) - Role-based access control logic
- [esbilla-dashboard/src/types/index.ts](esbilla-dashboard/src/types/index.ts) - Complete TypeScript type definitions

### Configuration & Infrastructure
- [Dockerfile](Dockerfile) - Multi-stage build (dashboard + API)
- [firebase.json](firebase.json) - Firebase Hosting and API rewrites
- [firestore.rules](firestore.rules) - Firestore security rules
- [firestore.indexes.json](firestore.indexes.json) - Composite index definitions
- [.github/workflows/deploy-api.yml](.github/workflows/deploy-api.yml) - CI/CD for API + Dashboard

### Important Patterns

**Security Model:**
- Zero PII storage: All user data is SHA256-hashed before storage
- Immutable audit trail: Consent records never updated/deleted (only TTL expiration)
- Domain-based CORS: Dynamic whitelist from Firestore with caching
- Rate limiting: Per-IP throttling with automatic cleanup

**Multi-tenancy Hierarchy:**
```
PLATFORM (superadmin)
  ↓
ORGANIZATION (org_owner/org_admin/org_viewer)
  ↓
SITE (site_admin/site_viewer)
```

**Performance Optimization:**
- Pre-aggregated stats: Daily counters reduce Firestore read costs
- Cache layers: 5-min domain cache, config cache
- Composite indexes: Optimized queries for common patterns
- Static SDK caching: Browser-level caching for SDK delivery
