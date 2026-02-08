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
- **SDK**: Cookie consent banner (v2.0.0) at `public/pegoyu.js` with configurable templates in `public/templates/`
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
  - `GET /pegoyu.js` - Consent SDK delivery (Pegoyu)
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
  src="https://[api-url]/pegoyu.js"
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
- [esbilla-api/public/pegoyu.js](esbilla-api/public/pegoyu.js) - Consent banner SDK (Pegoyu v2.0.0)
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

## Authentication & Onboarding System (Sprints 1-4)

### Features Implemented

**Sprint 1-2: Email/Password Authentication**
- Firebase Auth with email/password + Google SSO
- Email verification required for email/password users
- Password reset flow with Firebase action codes
- Feature flags: `VITE_ESBILLA_MODE` (saas | selfhosted)

**Sprint 3: Onboarding Wizard**
- 3-step wizard: Organization → First Site → Installation Code
- Plan-based organizations (Free, Pro, Enterprise)
- Auto-creation of user document with orgAccess
- Real-time approval detection (onSnapshot)

**Sprint 4: Invitation System**
- Email invitations with HTML templates (3 languages)
- API endpoints: `/api/invitations/send`, `/api/invitations/:id`, `/api/invitations/:id/accept`
- Invitation expiration (7 days)
- Auto-application of orgAccess on acceptance

### Key Files

**Authentication:**
- [esbilla-dashboard/src/context/AuthContext.tsx](esbilla-dashboard/src/context/AuthContext.tsx) - Complete auth context with email/password support
- [esbilla-dashboard/src/components/ProtectedRoute.tsx](esbilla-dashboard/src/components/ProtectedRoute.tsx) - Three-tier route protection (Public, Onboarding, Protected)
- [esbilla-dashboard/src/pages/Login.tsx](esbilla-dashboard/src/pages/Login.tsx) - Login with email/password and Google
- [esbilla-dashboard/src/pages/Register.tsx](esbilla-dashboard/src/pages/Register.tsx) - Registration with plan selection
- [esbilla-dashboard/src/pages/VerifyEmail.tsx](esbilla-dashboard/src/pages/VerifyEmail.tsx) - Email verification with polling
- [esbilla-dashboard/src/pages/ForgotPassword.tsx](esbilla-dashboard/src/pages/ForgotPassword.tsx) - Password recovery
- [esbilla-dashboard/src/pages/AuthAction.tsx](esbilla-dashboard/src/pages/AuthAction.tsx) - Firebase action handler (verify/reset)

**Onboarding:**
- [esbilla-dashboard/src/pages/OnboardingSetup.tsx](esbilla-dashboard/src/pages/OnboardingSetup.tsx) - 3-step wizard with batch writes
- [esbilla-dashboard/src/pages/PendingApproval.tsx](esbilla-dashboard/src/pages/PendingApproval.tsx) - Real-time approval detection

**Invitations:**
- [esbilla-api/src/routes/invitations.js](esbilla-api/src/routes/invitations.js) - API routes for invitations
- [esbilla-api/src/services/email.js](esbilla-api/src/services/email.js) - Email service with Nodemailer
- [esbilla-dashboard/src/pages/AcceptInvite.tsx](esbilla-dashboard/src/pages/AcceptInvite.tsx) - Invitation acceptance page
- [esbilla-dashboard/src/pages/Users.tsx](esbilla-dashboard/src/pages/Users.tsx) - Invite modal (lines 513-527, 1184-1293)

**Configuration:**
- [esbilla-dashboard/src/utils/featureFlags.ts](esbilla-dashboard/src/utils/featureFlags.ts) - SaaS vs self-hosted mode
- [esbilla-dashboard/src/config/plans.ts](esbilla-dashboard/src/config/plans.ts) - Plan definitions and limits
- [docs/FIREBASE-AUTH-SETUP.md](docs/FIREBASE-AUTH-SETUP.md) - Firebase Console setup guide
- [docs/INVITATIONS-SYSTEM.md](docs/INVITATIONS-SYSTEM.md) - Complete invitations documentation

### Environment Variables (Additional)

**API SMTP Configuration (esbilla-api/.env):**
```bash
SMTP_HOST=smtp.gmail.com          # SMTP server
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_USER=user@example.com        # SMTP username
SMTP_PASS=app-password            # SMTP password/app password
FROM_EMAIL=Esbilla CMP <noreply@esbilla.com>  # From address
FRONTEND_URL=https://app.esbilla.com           # Dashboard URL for invite links
```

**Dashboard Mode (esbilla-dashboard/.env):**
```bash
VITE_ESBILLA_MODE=saas           # "saas" or "selfhosted"
```

### Firestore Collections (New)

**invitations:**
```javascript
{
  id: "auto-generated",
  email: "user@example.com",
  type: "organization",
  targetId: "org_xxx",
  targetName: "Organization Name",
  role: "org_admin",
  organizationId: "org_xxx",
  invitedBy: "uid",
  invitedByName: "Admin Name",
  status: "pending" | "accepted" | "expired" | "revoked",
  createdAt: Timestamp,
  expiresAt: Timestamp (+7 days),
  acceptedAt: Timestamp | null,
  acceptedBy: "uid" | null
}
```

### Routes (Dashboard)

**Public Routes (Authentication):**
- `/login` - Login with email/password or Google
- `/register` - Registration with plan selection (SaaS only)
- `/verify-email` - Email verification with resend
- `/forgot-password` - Password recovery
- `/__/auth/action` - Firebase action handler
- `/invite/:inviteId` - Accept invitation

**Onboarding Routes:**
- `/onboarding/setup` - 3-step wizard (requires email verified)
- `/pending` - Pending approval (real-time listener)

**Protected Routes:**
- All dashboard routes require: auth + email verified + onboarding complete + orgAccess

### API Endpoints (New)

**Invitations:**
- `POST /api/invitations/send` - Send invitation (requires auth, org_owner/org_admin)
- `GET /api/invitations/:id` - Get invitation details (public)
- `POST /api/invitations/:id/accept` - Accept invitation (requires auth, email match)

### Authentication Flow

```
User Registration (SaaS)
  ↓
Email Verification
  ↓
Onboarding Wizard (3 steps)
  ├─ Step 1: Create Organization (with plan)
  ├─ Step 2: Create First Site
  └─ Step 3: Installation Code
  ↓
Dashboard Access (with orgAccess)
```

```
User Invitation
  ↓
Admin sends invitation
  ↓
Email sent with unique link
  ↓
User accepts (login or register)
  ↓
orgAccess auto-applied
  ↓
Dashboard Access
```

### Security Considerations

**Firestore Rules:**
- `invitations` collection: Read/write based on email match and org permissions
- Email verification required for email/password users
- Auto-promotion to superadmin (first user in self-hosted mode only)

**Email Templates:**
- HTML with inline CSS (email client compatibility)
- 3 languages: Spanish, English, Asturian
- 7-day expiration clearly stated
- Responsive design with Esbilla branding (#FFBF00)

### Testing

**Unit Tests:**
- [esbilla-api/src/routes/invitations.test.js](esbilla-api/src/routes/invitations.test.js) - Invitation API tests

**Manual Testing Flows:**
1. Auto-registration with plan (SaaS)
2. Invitation to organization
3. Invitation + new user registration
4. Login existing user
5. Pending approval detection

See [docs/SPRINT-5-CHECKLIST.md](docs/SPRINT-5-CHECKLIST.md) for complete verification checklist.
