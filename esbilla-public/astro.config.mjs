// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Camuda esto pola to URL real
  site: 'https://esbilla.com',

  i18n: {
    defaultLocale: 'ast',
    locales: ['ast', 'es', 'gl', 'eu', 'ca', 'fr'],
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});