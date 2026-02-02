/**
 * Parsea el archivo config.ts de Astro Content Collections
 * Extrae las definiciones de schemas para cada colección
 */

import { getFileContent } from "./octokit";

export interface CollectionSchema {
  name: string; // Nombre de la colección (blog, projects, etc.)
  fields: {
    [key: string]: {
      type: string; // string, number, boolean, array, date, etc.
      optional: boolean;
      description?: string;
    };
  };
  rawSchema?: string; // Schema de Zod original (opcional)
}

/**
 * Extrae las colecciones del config.ts
 */
export async function parseContentConfig(
  accessToken: string,
  owner: string,
  repo: string
): Promise<CollectionSchema[]> {
  try {
    // Leer el archivo config.ts
    const configData = await getFileContent(
      accessToken,
      owner,
      repo,
      "src/content/config.ts"
    );

    if (!configData) {
      console.log("No config.ts found, using default schema");
      return [getDefaultSchema()];
    }

    const content = configData.content;

    // Parsear las colecciones definidas
    const collections = extractCollections(content);

    if (collections.length === 0) {
      console.log("No collections found in config.ts, using default");
      return [getDefaultSchema()];
    }

    return collections;
  } catch (error) {
    console.error("Error parsing content config:", error);
    return [getDefaultSchema()];
  }
}

/**
 * Extrae las definiciones de colecciones del contenido del config.ts
 */
function extractCollections(configContent: string): CollectionSchema[] {
  const collections: CollectionSchema[] = [];

  // Regex para encontrar defineCollection
  // Ejemplo: blog: defineCollection({ ... })
  const collectionRegex = /(\w+):\s*defineCollection\s*\(\s*\{([\s\S]*?)\}\s*\)/g;

  let match;
  while ((match = collectionRegex.exec(configContent)) !== null) {
    const collectionName = match[1];
    const collectionBody = match[2];

    // Extraer el schema del body
    const schema = extractSchemaFromBody(collectionBody);

    collections.push({
      name: collectionName,
      fields: schema,
    });
  }

  return collections;
}

/**
 * Extrae los campos del schema de una colección
 */
function extractSchemaFromBody(body: string): CollectionSchema["fields"] {
  const fields: CollectionSchema["fields"] = {};

  // Buscar z.object({ ... })
  const schemaMatch = body.match(/schema:\s*z\.object\s*\(\s*\{([\s\S]*?)\}\s*\)/);

  if (!schemaMatch) {
    return fields;
  }

  const schemaContent = schemaMatch[1];

  // Parsear cada campo del schema
  // Ejemplo: title: z.string()
  // Ejemplo: tags: z.array(z.string()).optional()
  const fieldRegex = /(\w+):\s*z\.([\w.()]+)/g;

  let fieldMatch;
  while ((fieldMatch = fieldRegex.exec(schemaContent)) !== null) {
    const fieldName = fieldMatch[1];
    const fieldDefinition = fieldMatch[2];

    fields[fieldName] = parseFieldDefinition(fieldDefinition);
  }

  return fields;
}

/**
 * Parsea una definición de campo de Zod
 */
function parseFieldDefinition(definition: string): CollectionSchema["fields"][string] {
  const optional = definition.includes("optional()");
  
  // Detectar tipo base
  let type = "string";
  
  if (definition.startsWith("string")) type = "string";
  else if (definition.startsWith("number")) type = "number";
  else if (definition.startsWith("boolean")) type = "boolean";
  else if (definition.startsWith("date")) type = "date";
  else if (definition.startsWith("array")) type = "array";
  else if (definition.startsWith("object")) type = "object";

  return {
    type,
    optional,
  };
}

/**
 * Schema por defecto si no se encuentra config.ts
 */
function getDefaultSchema(): CollectionSchema {
  return {
    name: "blog",
    fields: {
      title: { type: "string", optional: false },
      slug: { type: "string", optional: false },
      tags: { type: "array", optional: true },
      episodeUrl: { type: "string", optional: true },
      transcription: { type: "array", optional: true },
    },
  };
}

/**
 * Convierte un archivo markdown a un objeto validado
 * usando el schema de la colección correspondiente
 */
export function validateAgainstSchema(
  metadata: any,
  schema: CollectionSchema
): { valid: boolean; data?: any; errors?: string[] } {
  const errors: string[] = [];
  const validatedData: any = {};

  // Validar cada campo del schema
  for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
    const value = metadata[fieldName];

    // Campo requerido pero faltante
    if (!fieldDef.optional && (value === undefined || value === null)) {
      errors.push(`Campo requerido faltante: ${fieldName}`);
      continue;
    }

    // Campo opcional y no presente
    if (value === undefined || value === null) {
      continue;
    }

    // Validar tipo
    const typeValid = validateFieldType(value, fieldDef.type);
    if (!typeValid) {
      errors.push(`Campo ${fieldName} debe ser de tipo ${fieldDef.type}`);
      continue;
    }

    validatedData[fieldName] = value;
  }

  // Agregar campos extra que no están en el schema (permisivo)
  for (const [key, value] of Object.entries(metadata)) {
    if (!(key in schema.fields)) {
      validatedData[key] = value;
    }
  }

  return {
    valid: errors.length === 0,
    data: validatedData,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Valida si un valor coincide con un tipo
 */
function validateFieldType(value: any, type: string): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return value instanceof Date || typeof value === "string";
    case "array":
      return Array.isArray(value);
    case "object":
      return typeof value === "object" && !Array.isArray(value);
    default:
      return true; // Permitir cualquier tipo desconocido
  }
}

/**
 * Detecta a qué colección pertenece un archivo basándose en su ruta
 */
export function detectCollectionFromPath(filePath: string): string {
  // Ejemplo: src/content/blog/post.md -> "blog"
  // Ejemplo: src/content/projects/project.md -> "projects"
  const match = filePath.match(/src\/content\/([^/]+)\//);
  return match ? match[1] : "blog";
}
