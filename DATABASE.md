# 🗄️ Estructura de Base de Datos - MongoDB

## Database: `astro-cms`

---

## 📊 Colecciones

### 1. **Collection: `posts`**

Almacena cada archivo Markdown importado de los repositorios.

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: String,              // ID del usuario de GitHub
  repoId: String,              // "owner/repo"
  filePath: String,            // "src/content/blog/post/index.md"
  sha: String,                 // SHA del archivo en GitHub
  metadata: {
    title: String,
    slug: String,
    tags: Array<String>,
    episodeUrl: String,
    transcription: Array<{
      time: String,
      text: String
    }>
  },
  content: String,             // Contenido Markdown
  status: String,              // "synced" | "modified" | "draft"
  lastCommitAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ userId: 1, repoId: 1, filePath: 1 } // Unique
```

**Operaciones:**
- **Crear/Actualizar**: `/api/import` (importar repo)
- **Actualizar**: `/api/posts/update` (editar post)
- **Leer**: `/api/posts` (listar posts)

---

### 2. **Collection: `projects`**

Almacena información de cada repositorio importado.

**Schema:**
```javascript
{
  _id: ObjectId,
  userId: String,              // ID del usuario de GitHub
  repoId: String,              // "owner/repo" (unique por usuario)
  name: String,                // Nombre del repositorio
  description: String,         // Descripción del repo
  postsCount: Number,          // Cantidad de posts importados
  lastSync: Date,              // Última sincronización
  createdAt: Date,
  updatedAt: Date
}
```

**Índices:**
```javascript
{ userId: 1, repoId: 1 } // Unique
```

**Operaciones:**
- **Crear/Actualizar**: `/api/import` (al importar posts)
- **Leer**: `/api/projects` (listar proyectos)

---

### 3. **Collection: `users`** (NextAuth)

Creada automáticamente por NextAuth con MongoDB Adapter.

**Schema básico:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  image: String,
  emailVerified: Date
}
```

---

### 4. **Collection: `accounts`** (NextAuth)

Almacena las cuentas OAuth vinculadas.

**Schema básico:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // Referencia a users
  type: "oauth",
  provider: "github",
  providerAccountId: String,
  access_token: String,       // Token para GitHub API
  token_type: "bearer",
  scope: String
}
```

---

### 5. **Collection: `sessions`** (NextAuth)

Almacena las sesiones activas.

**Schema básico:**
```javascript
{
  _id: ObjectId,
  sessionToken: String,
  userId: ObjectId,
  expires: Date
}
```

---

## 🔗 Relaciones

```
users (NextAuth)
  ├── _id
  └── 1:N → accounts
            └── access_token (usado para GitHub API)

users._id
  └── 1:N → projects
            └── userId
            └── 1:N → posts
                      └── userId + repoId
```

---

## 📍 Flujo de Datos

### Importar Repositorio:

```
1. Usuario hace click en "Importar" en el modal
   ↓
2. POST /api/import
   ↓
3. Obtiene access_token de la sesión (NextAuth)
   ↓
4. Llama a GitHub API para listar archivos .md
   ↓
5. Por cada archivo:
   - Obtiene contenido
   - Parsea frontmatter
   - Valida con Zod
   - Upsert en collection "posts"
   ↓
6. Upsert en collection "projects"
   - Guarda metadata del repo
   - Actualiza postsCount
   - Actualiza lastSync
   ↓
7. Retorna resultado al cliente
```

### Editar Post:

```
1. Usuario edita en el editor
   ↓
2. Click en "Guardar" o "Guardar y Commitear"
   ↓
3. PUT /api/posts/update
   ↓
4. Actualiza en collection "posts"
   └─ Si commitToGitHub = true:
      ├── Llama a GitHub API (createOrUpdateFile)
      ├── Actualiza SHA
      └── Marca status = "synced"
   └─ Si commitToGitHub = false:
      └── Marca status = "modified"
```

---

## 🔍 Queries Útiles

### Ver todos los posts de un usuario:
```javascript
db.posts.find({ userId: "github_12345" })
```

### Ver posts de un repositorio específico:
```javascript
db.posts.find({ 
  userId: "github_12345",
  repoId: "Broslunas/portfolio-old"
})
```

### Ver proyectos importados por un usuario:
```javascript
db.projects.find({ userId: "github_12345" })
  .sort({ updatedAt: -1 })
```

### Contar posts pendientes de sync:
```javascript
db.posts.countDocuments({
  userId: "github_12345",
  status: "modified"
})
```

### Ver posts sin sincronizar:
```javascript
db.posts.find({
  userId: "github_12345",
  status: { $ne: "synced" }
})
```

---

## 📊 Estadísticas

### Total de posts por usuario:
```javascript
db.posts.aggregate([
  { $match: { userId: "github_12345" } },
  { $group: { 
      _id: "$userId", 
      total: { $sum: 1 } 
  }}
])
```

### Posts por proyecto:
```javascript
db.posts.aggregate([
  { $match: { userId: "github_12345" } },
  { $group: { 
      _id: "$repoId", 
      count: { $sum: 1 } 
  }}
])
```

---

## 🛠️ Mantenimiento

### Eliminar un proyecto y sus posts:
```javascript
// 1. Eliminar posts
db.posts.deleteMany({ 
  userId: "github_12345",
  repoId: "owner/repo" 
})

// 2. Eliminar proyecto
db.projects.deleteOne({ 
  userId: "github_12345",
  repoId: "owner/repo" 
})
```

### Limpiar posts huérfanos:
```javascript
// Posts sin proyecto asociado
db.posts.deleteMany({
  repoId: { 
    $nin: db.projects.distinct("repoId") 
  }
})
```

---

## ⚠️ Importante

1. **No elimines manualmente** datos de `users`, `accounts` o `sessions` - Los maneja NextAuth
2. **Usa upsert** en lugar de insert para evitar duplicados
3. **Valida con Zod** antes de guardar datos en `posts`
4. **Actualiza `postsCount`** al modificar posts en un proyecto

---

## 🔐 Seguridad

Todos los queries incluyen `userId` para asegurar que:
- Los usuarios solo vean sus propios datos
- No haya acceso cruzado entre usuarios
- Se mantenga la privacidad

```javascript
// ✅ CORRECTO
db.posts.find({ userId: session.user.id, repoId: "owner/repo" })

// ❌ INCORRECTO (sin filtro de usuario)
db.posts.find({ repoId: "owner/repo" })
```

---

## 📝 Resumen

- **`posts`**: Archivos Markdown (contenido)
- **`projects`**: Repositorios importados (metadata)
- **`users`**: Usuarios autenticados (NextAuth)
- **`accounts`**: Conexiones OAuth (NextAuth)
- **`sessions`**: Sesiones activas (NextAuth)

**Total**: 5 colecciones en la base de datos `astro-cms`
