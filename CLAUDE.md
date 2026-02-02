# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Esbilla-CMP is an open-source Consent Management Platform (CMP) for GDPR/ePrivacy compliance. The name comes from the Asturian verb "esbillar" (to select/clean). Comments and documentation are primarily in Spanish/Asturian.

## Repository Structure (npm workspaces monorepo)

- **esbilla-public/**: Astro-based landing page with multi-language support (10 languages, default: Asturian)
- **esbilla-api/**: Express.js backend serving the consent SDK and API endpoints
- **esbilla-dashboard/**: Admin panel (planned)
- **esbilla-plugins/**: CMS connectors (planned)

## Common Commands

```bash
# Install all workspace dependencies
npm install

# Development
npm run dev:public          # Run landing page dev server (Astro)
npm run start -w esbilla-api    # Run API server locally

# Build
npm run build:public        # Build landing page for production

# Testing
npm run test -w esbilla-public -- --run   # Run landing page tests (Vitest)
npm run test -w esbilla-api               # Run API tests (Vitest + Supertest)
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
- **SDK**: Cookie consent banner at `public/sdk.js` with configurable templates in `public/templates/`
- **SDK i18n**: Configuration at `public/i18n/config.json`
- **Key Endpoints**:
  - `GET /api/config/:id` - Site configuration
  - `POST /api/consent/log` - Log consent choices

### Deployment
- **Landing**: Firebase Hosting via GitHub Actions (triggers on push to main)
- **API**: Google Cloud Run via Docker (triggers on changes to `esbilla-api/`)
- **Region**: europe-west4 (Netherlands)

## SDK Integration

The consent SDK is loaded via script tag:
```html
<script src="https://[api-url]/sdk.js" data-id="site-id" data-gtm="GTM-XXXXX"></script>
```

It implements Google Consent Mode V2 and blocks tracking until user consent.
