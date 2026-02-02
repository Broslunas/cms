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
  // Configurar las opciones de opciones de dump de js-yaml a través de gray-matter
  // para forzar el estilo "flow" (inline) en los arrays.
  // forceQuotes puede ser útil pero no es estrictamente lo pedido.
  const options = {
    // Estas opciones se pasan a js-yaml.dump
    // flowLevel: -1 (default, block), 0, 1 etc.
    // Un valor de 2 o 3 suele forzar arrays simples a ser inline si son cortos.
    // Sin embargo, js-yaml a veces es caprichoso.
    // 'styles': { '!!seq': 'flow' } podría funcionar en versiones viejas.
  };

  // Hack temporal: gray-matter con js-yaml a veces no expone bien el estilo flow específico por tipo.
  // Pero podemos intentar pasar flowLevel.
  return matter.stringify(content, metadata, {
     // @ts-ignore - gray-matter types might not include js-yaml dump options
     flowLevel: 1 
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
