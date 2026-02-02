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
  return matter.stringify(content, metadata);
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
