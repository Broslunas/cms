# 🚀 Astro-Git CMS

Un sistema de gestión de contenidos (CMS) basado en Git diseñado específicamente para el ecosistema Astro. Permite gestionar tus Content Collections mediante una interfaz visual intuitiva, sincronizando los datos directamente con tus repositorios de GitHub.

![Astro-Git CMS](https://img.shields.io/badge/Status-MVP-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

## ✨ Características

- 🔐 **Autenticación con GitHub OAuth** - Conexión segura con tu cuenta de GitHub
- 📦 **Importación automática** - Escanea y importa archivos Markdown de tus repositorios
- ✏️ **Editor visual** - Interfaz moderna para editar metadata y contenido
- 🎙️ **Campos dinámicos** - Soporte para transcripciones y campos complejos
- 🔄 **Sincronización bidireccional** - MongoDB como caché + Git como fuente de verdad
- ✅ **Validación con Zod** - Type-safety en todo el proceso
- 📝 **Commits automáticos** - Guarda cambios directamente en GitHub

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Autenticación**: NextAuth.js v5 con GitHub OAuth
- **Base de datos**: MongoDB (Atlas)
- **Git API**: Octokit
- **Parsing Markdown**: gray-matter
- **Validación**: Zod
- **Estilos**: Tailwind CSS v4

## 📋 Requisitos Previos

- Node.js 20+ y npm
- Cuenta de MongoDB Atlas (gratuita)
- Cuenta de GitHub
- GitHub OAuth App configurada

## 🚀 Instalación

### 1. Clonar el repositorio

\`\`\`bash
git clone <tu-repo>
cd cms
npm install
\`\`\`

### 2. Configurar MongoDB Atlas

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un nuevo cluster (M0 - gratuito)
3. Crea un usuario de base de datos
4. Obtén tu connection string

### 3. Configurar GitHub OAuth App

1. Ve a [GitHub Developer Settings](https://github.com/settings/developers)
2. Click en "New OAuth App"
3. Configura:
   - **Application name**: Astro-Git CMS
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Guarda el **Client ID** y **Client Secret**

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`bash
# MongoDB
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/astro-cms?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secret-aleatorio-aqui

# GitHub OAuth
GITHUB_ID=tu-github-client-id
GITHUB_SECRET=tu-github-client-secret
\`\`\`

**Generar NEXTAUTH_SECRET:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 5. Ejecutar el proyecto

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📖 Uso

### 1. Autenticación

1. Haz clic en "Continuar con GitHub"
2. Autoriza la aplicación
3. Serás redirigido al dashboard

### 2. Importar contenido

1. En el dashboard, selecciona un repositorio
2. Haz clic en "Importar"
3. El sistema escaneará `src/content/` buscando archivos `.md` y `.mdx`
4. Los posts se importarán a MongoDB

### 3. Editar posts

1. Haz clic en un post de la lista
2. Edita metadata (título, slug, tags, etc.)
3. Edita transcripciones si las hay
4. Edita el contenido en Markdown
5. **Guardar**: Guarda solo en MongoDB (estado: "modified")
6. **Guardar y Commitear**: Guarda en MongoDB y hace commit a GitHub (estado: "synced")

## 🏗️ Arquitectura

```
┌─────────────┐
│   Next.js   │
│  (Frontend) │
└──────┬──────┘
       │
       ├────────────┐
       │            │
       v            v
┌─────────┐  ┌──────────┐
│ MongoDB │  │  GitHub  │
│ (Caché) │  │ (Source) │
└─────────┘  └──────────┘
```

**Flujo de datos:**

1. **Importación**: GitHub → MongoDB
2. **Edición**: UI → MongoDB
3. **Commit**: MongoDB → GitHub (con serialización a Markdown)

## 📦 Estructura del proyecto

\`\`\`
app/
├── api/
│   ├── auth/[...nextauth]/ # Endpoints de autenticación
│   ├── repos/              # Listar repositorios
│   ├── import/             # Importar contenido
│   └── posts/              # CRUD de posts
├── dashboard/
│   ├── page.tsx            # Dashboard principal
│   ├── repos/              # Lista de posts
│   └── editor/[id]/        # Editor de posts
components/
├── LoginButton.tsx
├── RepoSelector.tsx
└── PostEditor.tsx
lib/
├── auth.ts                 # Configuración NextAuth
├── mongodb.ts              # Cliente MongoDB
├── octokit.ts              # Utilidades GitHub API
├── markdown.ts             # Parsing/serialización
└── schemas.ts              # Validación Zod
\`\`\`

## 🔍 Modelo de datos (MongoDB)

\`\`\`typescript
{
  _id: ObjectId,
  userId: string,              // ID del usuario de NextAuth
  repoId: string,              // "owner/repo"
  filePath: string,            // "src/content/blog/post.md"
  sha: string,                 // SHA del archivo en GitHub
  
  metadata: {
    title: string,
    slug: string,
    tags: string[],
    episodeUrl?: string,
    transcription?: [{
      time: string,
      text: string
    }]
  },
  
  content: string,             // Cuerpo del Markdown
  status: "synced" | "draft" | "modified",
  lastCommitAt: Date,
  createdAt: Date,
  updatedAt: Date
}
\`\`\`

## 🐛 Solución de problemas

### Error: "No GitHub access token found"

- Verifica que los scopes de GitHub incluyan `repo`
- Cierra sesión y vuelve a autenticarte

### Error de conflicto (409) al commitear

- El archivo fue modificado externamente
- Sincroniza los cambios desde GitHub o sobrescribe manualmente

### Posts no se importan

- Verifica que el repositorio tenga una carpeta `src/content/`
- Verifica que los archivos tengan frontmatter válido

## 🗺️ Roadmap

- [x] Fase 1: MVP (Autenticación, importación, editor básico)
- [ ] Fase 2: Formularios dinámicos avanzados
- [ ] Fase 3: Webhooks para sync en tiempo real
- [ ] Fase 4: Media library (gestión de imágenes)
- [ ] Fase 5: Previsualización en vivo

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor abre un issue o PR.

---

Hecho con ❤️ para el ecosistema Astro
