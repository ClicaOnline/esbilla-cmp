// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://esbilla.com', // Camuda esto pola to URL real
  i18n: {
    defaultLocale: 'ast',
    locales: ['ast', 'es', 'gl', 'eu', 'ca', 'fr'],
  },
  vite: {
    plugins: [tailwindcss()]
  }
});