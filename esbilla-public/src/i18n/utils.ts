import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    // 1. Busca na llingua actual (lang)
    // 2. Si nun esiste (falsy), usa la de defaultLang (asturianu) 🛡️
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(url: URL, lang: string) {
  const [, , ...slug] = url.pathname.split('/');
  return `/${lang}/${slug.join('/')}`;
}
