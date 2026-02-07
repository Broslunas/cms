import matter from "gray-matter";

/**
 * Parsea un archivo Markdown y separa el frontmatter del contenido
 */
export function parseMarkdown(rawContent: string) {
  const { data: metadata, content } = matter(rawContent);
  return { metadata, content };
}

/**
 * Serializa metadata y contenido de vuelta a formato Markdown
 */
export function serializeMarkdown(metadata: Record<string, any>, content: string) {
  // Serializar usando gray-matter
  const stringified = matter.stringify(content, metadata);

  // Post-procesar para quitar comillas a fechas con formato "YYYY-MM-DD"
  // Solo lo hacemos en el bloque de frontmatter para evitar tocar el contenido.
  // El frontmatter está delimitado por ---
  return stringified.replace(/^---([\s\S]*?)\n---/m, (match, frontmatter) => {
    const cleanFrontmatter = frontmatter.replace(/([:-]\s*)["'](\d{4}-\d{2}-\d{2})["']/g, '$1$2');
    return `---${cleanFrontmatter}\n---`;
  });
}

/**
 * Valida que el metadata tenga la estructura esperada
 * (Esto se puede extender con Zod para validación más robusta)
 */
export function validateMetadata(metadata: any): boolean {
  // Validación básica - se puede mejorar con Zod
  if (!metadata.title || typeof metadata.title !== "string") {
    return false;
  }
  if (!metadata.slug || typeof metadata.slug !== "string") {
    return false;
  }
  return true;
}
