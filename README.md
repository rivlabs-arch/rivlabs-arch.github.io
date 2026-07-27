# RivLabs — sitio público

Web pública de [RivLabs](https://www.instagram.com/rivlabs/): una idea tecnológica útil en menos de un minuto.

## Sitio

Cuando GitHub Pages esté activado, la web estará disponible en:

**https://rivlabs-arch.github.io/**

## Privacidad editorial

Este repositorio contiene únicamente contenido ya publicado y recursos aprobados para su difusión. No incluye el calendario editorial, borradores, datos de la aplicación interna ni rutas locales.

## Actualización del catálogo

Las publicaciones visibles se generan desde la lista explícita `content/published-content.json`. Solo se aceptan entradas con `published: true`; añadir una imagen a una carpeta no hace que aparezca automáticamente en la web.

Antes de publicar cambios, `scripts/validate-content.mjs` comprueba la lista permitida, los campos públicos y la existencia de todas las imágenes.

## Tecnología

Sitio estático sin dependencias, analítica, cookies ni fuentes externas. Está preparado para publicarse directamente desde la raíz de la rama principal con GitHub Pages.
# rivlabs-arch.github.io
