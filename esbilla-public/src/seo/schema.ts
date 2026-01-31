// src/seo/schema.ts
export const getEsbillaSchema = (lang: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Esbilla CMP",
    "inLanguage": lang,
    "applicationCategory": "PrivacySoftware",
    "license": "https://github.com/ClicaOnline/esbilla-cmp/blob/main/LICENSE",
    "author": {
      "@type": "Organization",
      "name": "Clica Online"
    },
    // ... restu de los datos que te di antes
  };
};