# Archivos de Traducción / Translation Files

Este directorio contiene las traducciones del plugin Esbilla CMP.

## Idiomas Disponibles / Available Languages

- **Español (es_ES)**: Idioma por defecto / Default language
- **Asturianu (ast)**: Traducciones al asturiano
- **English (en_US)**: English translations

## Cambiar el Idioma / Change Language

El idioma del plugin se puede cambiar desde:
**WordPress Admin → Configuración → Esbilla CMP → Idioma del Plugin**

The plugin language can be changed from:
**WordPress Admin → Settings → Esbilla CMP → Plugin Language**

## Generar Archivos .mo / Generate .mo Files

Para generar los archivos binarios .mo desde los archivos .po:

```bash
cd languages/
msgfmt -o esbilla-cmp-ast.mo esbilla-cmp-ast.po
msgfmt -o esbilla-cmp-en_US.mo esbilla-cmp-en_US.po
```

Si no tienes `msgfmt` instalado:
- **Ubuntu/Debian**: `sudo apt-get install gettext`
- **macOS**: `brew install gettext`
- **Windows**: Usa Poedit (https://poedit.net/)

## Contribuir con Traducciones / Contribute Translations

Para añadir un nuevo idioma:

1. Copia `esbilla-cmp-es_ES.po` a `esbilla-cmp-{locale}.po`
2. Traduce los strings (msgstr)
3. Genera el archivo .mo: `msgfmt -o esbilla-cmp-{locale}.mo esbilla-cmp-{locale}.po`
4. Añade el idioma al selector en `includes/class-esbilla-admin.php`
5. Envía un Pull Request

---

© 2026 Clica Online Soluciones S.L. - GPL v3 License
