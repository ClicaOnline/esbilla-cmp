// src/i18n/ui.ts
import { ast } from './languages/ast';
import { es } from './languages/es';
import { gl } from './languages/gl';
import { eu } from './languages/eu';
import { ca } from './languages/ca';
import { en } from './languages/en';
import { fr } from './languages/fr';
import { pt } from './languages/pt';
import { it } from './languages/it';
import { de } from './languages/de';

export const site = 'https://esbilla.com';

export const languages = {
  ast: 'Asturianu',
  es: 'Español',
  gl: 'Galego',
  eu: 'Euskara',
  ca: 'Català',
  en: 'English',
  fr: 'Français',
  pt: 'Portugués',
  it: 'Italiano',
  de: 'Deutsch',
};

// Establecemos l'asturianu como llingua por defeutu 🔑
export const defaultLang = 'ast'; 

export const ui = {
  ast,
  es,
  gl,
  eu,
  ca,
  en,
  fr,
  pt,
  it,
  de
} as const;



