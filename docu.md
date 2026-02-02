Documentación Técnica: Astro-Git CMS

1. Resumen Ejecutivo

Astro-Git CMS es una plataforma de gestión de contenidos (CMS) basada en Git diseñada específicamente para el ecosistema Astro. Permite a los usuarios gestionar sus Content Collections mediante una interfaz visual intuitiva, sincronizando los datos directamente con sus repositorios de GitHub sin necesidad de bases de datos externas de contenido, pero utilizando MongoDB como capa de caché y persistencia de estado intermedio.

2. Arquitectura del Sistema

El flujo de información se basa en un modelo de Sincronización Bidireccional:

Capa de Autenticación: NextAuth.js gestiona el flujo OAuth con GitHub y persiste la sesión en MongoDB.

Capa de Persistencia (Caché/Estado): MongoDB almacena una copia de los archivos de texto (Markdown/MDX) parseados en formato JSON para búsquedas rápidas y edición fluida.

Capa de Comunicación (Git): Octokit actúa como el puente entre el servidor de Next.js y la API de GitHub para realizar operaciones de lectura y escritura (commits).

3. Modelo de Datos (MongoDB)

Para soportar la flexibilidad de Astro, utilizaremos un esquema que divida el "Frontmatter" del "Contenido".

Colección: posts

{
  _id: ObjectId,
  userId: ObjectId,      // Relación con el usuario de NextAuth
  repoId: String,        // ID o nombre completo del repo (owner/repo)
  filePath: String,      // Ruta relativa en el repo: "src/content/blog/post.md"
  sha: String,           // El SHA actual del archivo en GitHub (vital para updates)
  
  // Frontmatter Estructurado
  metadata: {
    title: String,
    slug: String,
    tags: [String],
    episodeUrl: String,
    transcription: [{
      time: String,
      text: String
    }]
  },
  
  content: String,       // El cuerpo del Markdown (después del segundo ---)
  status: "synced" | "draft" | "modified",
  lastCommitAt: Date,
  createdAt: Date,
  updatedAt: Date
}


4. Flujos Lógicos Principales

A. Sincronización Inicial (Importación)

Cuando un usuario vincula un repositorio:

Escaneo: La aplicación recorre src/content/ buscando archivos .md o .mdx.

Parsing: Por cada archivo, se descarga el contenido raw.

Extracción: Se usa la librería gray-matter para separar el Frontmatter del contenido.

Upsert: Se guarda/actualiza el documento en MongoDB con el sha proporcionado por la API de GitHub.

B. Proceso de Edición y Guardado

Edición en UI: El usuario modifica el array de transcription en un formulario dinámico.

Guardado en DB: Se actualiza el documento en MongoDB inmediatamente (estado modified).

Serialización (JSON to Markdown):

Se toma el objeto metadata y se convierte a YAML.

Se concatena con el content.

Commit a GitHub:

Se envía el nuevo contenido base64 a la API de GitHub.

GitHub devuelve un nuevo sha.

Se actualiza el documento en MongoDB con el nuevo sha y estado synced.

5. Implementación con Next.js

Integración de NextAuth.js

Es fundamental configurar los scopes necesarios para que la aplicación pueda realizar commits.

// Scope requerido: 'repo' o 'public_repo'
GitHubProvider({
  clientId: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  authorization: { params: { scope: 'repo' } },
})


Serializador de Markdown (Lógica Core)

Dado que quieres manejar tipos de datos complejos, el serializador debe ser robusto:

import matter from 'gray-matter';

/**
 * Convierte los datos de MongoDB al formato de archivo físico de Astro
 */
function serializePost(postData) {
  const { metadata, content } = postData;
  
  // matter.stringify genera el bloque --- de frontmatter y lo une al contenido
  return matter.stringify(content, metadata);
}


6. Desafíos Técnicos y Soluciones

Desafío

Solución Sugerida

Conflictos de Edición

Al hacer el commit, enviar siempre el sha almacenado en MongoDB. Si GitHub devuelve un error 409 (Conflict), significa que alguien editó el archivo fuera del CMS; se debe pedir al usuario que refresque los datos.

Rate Limits de GitHub

Usar MongoDB para todas las lecturas de la interfaz de usuario. Solo consultar la API de GitHub en la importación inicial o al forzar una sincronización.

Tipado de Astro

Implementar validación con Zod en el servidor de Next.js que replique el config.ts de las Content Collections del usuario para evitar errores de build en producción.

Manejo de Imágenes

Permitir la subida de imágenes a una carpeta /public/assets/cms/ del repo mediante el mismo flujo de commits, devolviendo la ruta relativa para el Markdown.

7. Roadmap de Desarrollo

Fase 1: MVP (2-3 semanas)

[ ] Configuración de Next.js, NextAuth y MongoDB.

[ ] Conexión con Octokit y listado de repositorios.

[ ] Importación básica de archivos Markdown a MongoDB.

[ ] Editor de texto simple + Edición de metadatos básicos (title, slug).

Fase 2: Funcionalidad Avanzada

[ ] Implementación de formularios dinámicos para transcription y tags.

[ ] Lógica de commits automáticos al guardar.

[ ] Dashboard de estado de sincronización.

Fase 3: UX y Optimización

[ ] Webhooks de GitHub para actualización en tiempo real.

[ ] Media Library (gestión de imágenes).

[ ] Previsualización en vivo (integración con Vercel/Netlify previews).