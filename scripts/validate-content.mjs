import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifestPath = resolve(root, "content", "published-content.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

const allowedPostKeys = new Set([
  "id", "published", "number", "series", "seriesLabel", "title", "subtitle",
  "topic", "pillar", "publishedDate", "readingTime", "summary", "takeaway",
  "tags", "slides", "publicUrl"
]);
const forbiddenTerms = [
  "fechaPrevista", "notes", "notas", "briefing", "caption", "hashtags",
  "checklist", "localPath", "draft", "borrador"
];
const errors = [];

if (!Array.isArray(manifest.posts) || manifest.posts.length === 0) {
  errors.push("El manifiesto debe contener al menos una publicación.");
}

for (const [index, post] of (manifest.posts || []).entries()) {
  const label = post.id || `posts[${index}]`;
  if (post.published !== true) errors.push(`${label}: solo se permiten publicaciones con published: true.`);
  if (!post.id || !post.series || !post.title || !post.publishedDate) errors.push(`${label}: faltan campos públicos obligatorios.`);
  if (!Array.isArray(post.slides) || post.slides.length === 0) errors.push(`${label}: no contiene diapositivas.`);
  if (!post.publicUrl?.startsWith("./") || !post.publicUrl.endsWith("/")) errors.push(`${label}: publicUrl no es una ruta pública válida.`);

  for (const key of Object.keys(post)) {
    if (!allowedPostKeys.has(key)) errors.push(`${label}: el campo no permitido "${key}" debe eliminarse.`);
  }

  const serialized = JSON.stringify(post).toLocaleLowerCase("es");
  for (const term of forbiddenTerms) {
    if (serialized.includes(term.toLocaleLowerCase("es"))) errors.push(`${label}: contiene el término privado "${term}".`);
  }

  for (const [slideIndex, slide] of (post.slides || []).entries()) {
    if (!slide.src?.startsWith("./assets/posts/") || !slide.alt) {
      errors.push(`${label}, slide ${slideIndex + 1}: ruta o texto alternativo no válido.`);
      continue;
    }
    try {
      await access(resolve(root, slide.src.slice(2)));
    } catch {
      errors.push(`${label}, slide ${slideIndex + 1}: no existe ${slide.src}.`);
    }
  }

  if (post.publicUrl?.startsWith("./")) {
    try {
      await access(resolve(root, post.publicUrl.slice(2), "index.html"));
    } catch {
      errors.push(`${label}: no existe la página pública ${post.publicUrl}.`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Contenido público validado: ${manifest.posts.length} publicación, ${manifest.posts.reduce((total, post) => total + post.slides.length, 0)} diapositivas.`);
}
