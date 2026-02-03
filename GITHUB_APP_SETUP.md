# 🔧 Configuración de GitHub App - Guía Paso a Paso

## 📝 Antes de Comenzar

Esta guía es para **crear la GitHub App por primera vez**. Si ya la tienes creada, solo necesitas el slug para `GITHUB_APP_NAME`.

---

## 1️⃣ Crear la GitHub App

### Paso 1: Ir a la página de creación

**URL**: https://github.com/settings/apps/new

### Paso 2: Llenar el formulario

#### **Información Básica**

| Campo | Valor |
|-------|-------|
| **GitHub App name** | `Broslunas CMS` (o el nombre que prefieras) |
| **Description** | `Sistema de gestión de contenido para sitios estáticos` |
| **Homepage URL** | `http://localhost:3000` (dev) o `https://tu-dominio.com` (prod) |

#### **Identifying and authorizing users**

| Campo | Valor |
|-------|-------|
| **Callback URL** | `http://localhost:3000/api/auth/callback/github` |
| **Request user authorization (OAuth) during installation** | ✅ **MARCAR** |
| **Enable Device Flow** | ❌ Dejar sin marcar |

#### **Post installation**

| Campo | Valor |
|-------|-------|
| **Setup URL (optional)** | Dejar vacío |
| **Redirect on update** | ❌ Dejar sin marcar |

#### **Webhook**

| Campo | Valor |
|-------|-------|
| **Active** | ❌ **DESMARCAR** (no necesitamos webhooks por ahora) |

---

## 2️⃣ Configurar Permisos

### Permisos de Repositorio (Repository permissions)

Scroll hasta la sección **"Permissions"** y configura:

| Permiso | Acceso | ¿Por qué? |
|---------|--------|-----------|
| **Contents** | `Read and write` | Para leer y escribir archivos en repos |
| **Metadata** | `Read-only` | (Se activa automáticamente) |

**⚠️ IMPORTANTE**: Asegúrate de que **Contents** esté en **Read and write**, no solo Read.

### Permisos de Cuenta (Account permissions)

Todos en **No access** (no son necesarios).

---

## 3️⃣ Configurar Instalación

### Where can this GitHub App be installed?

Opciones:
- ✅ **Any account** (si quieres que otros instalen tu app)
- ✅ **Only on this account** (solo para ti - **RECOMENDADO para dev**)

Selecciona: **Only on this account**

---

## 4️⃣ Crear la App

Click en el botón verde **"Create GitHub App"** al final del formulario.

---

## 5️⃣ Obtener Credenciales

Después de crear la app, verás la página de configuración:

### Client ID

Está visible en la página:
```
Client ID: Iv23liABCDEFGHIJKL (ejemplo)
```

**Acción**: Copiarlo.

### Client Secret

1. Scroll hasta la sección **"Client secrets"**
2. Click en **"Generate a new client secret"**
3. **⚠️ IMPORTANTE**: Copia el secret **INMEDIATAMENTE** (solo se muestra una vez)

```
Secret: ghp_abcdefgh123456789... (ejemplo)
```

### App Slug

El slug está en la URL de la página:

```
https://github.com/settings/apps/broslunas-cms
                                    ^^^^^^^^^^^^
                                    Este es el slug
```

**O** está visible en la sección **"Basic information"** como **"App slug"**.

---

## 6️⃣ Actualizar .env

Copia las credenciales a tu archivo `.env`:

```bash
# MongoDB
MONGODB_URI="mongodb+srv://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-aleatorio"

# GitHub App
GITHUB_ID="Iv23liABCDEFGHIJKL"           # ← Client ID
GITHUB_SECRET="ghp_abcdefgh123456789..."  # ← Client Secret
GITHUB_APP_NAME="broslunas-cms"           # ← App Slug
```

---

## 7️⃣ Instalar la App en tu Cuenta

### Opción A: Desde la página de la app

1. En la página de configuración de tu GitHub App
2. Sidebar izquierdo → **"Install App"**
3. Click en **"Install"** junto a tu cuenta
4. Selecciona repositorios:
   - ✅ **All repositories** (todos)
   - ⭕ **Only select repositories** (específicos)
5. Click en **"Install"**

### Opción B: Desde la URL directa

Visita: `https://github.com/apps/[tu-app-slug]/installations/new`

Ejemplo: `https://github.com/apps/broslunas-cms/installations/new`

---

## 8️⃣ Verificar la Instalación

### En GitHub

1. Ve a: https://github.com/settings/installations
2. Deberías ver tu app listada

### En el CMS

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Cierra sesión si ya estabas logueado

3. Vuelve a hacer login

4. Deberías ir **directo al dashboard** (no a /setup) si la app está instalada

---

## 9️⃣ Testing

### Test 1: Verificar que la app está instalada

```bash
# En otra terminal, con el servidor corriendo:
curl http://localhost:3000/api/check-installation

# Necesitas estar logueado para que funcione
# Respuesta esperada:
# {"installed":true,"message":"GitHub App instalada correctamente"}
```

### Test 2: Probar el flujo completo

1. **Abrir en modo incógnito** (para simular nuevo usuario)
2. Login con GitHub
3. Si ya instalaste la app → Va a `/dashboard`
4. Si no la has instalado → Va a `/setup`

---

## 🔄 Actualizar para Producción

Cuando subas a producción:

### 1. Actualizar URLs en GitHub App

1. Ve a la configuración de tu GitHub App
2. Sección **"General"**
3. Actualiza:
   - **Homepage URL**: `https://cms.broslunas.com`
   - **Callback URL**: `https://cms.broslunas.com/api/auth/callback/github`
4. Click en **"Save changes"**

### 2. Actualizar variables de entorno

En tu plataforma de hosting (Vercel, Railway, etc.):

```bash
NEXTAUTH_URL="https://cms.broslunas.com"
NEXTAUTH_SECRET="nuevo-secret-aleatorio-para-produccion"
GITHUB_ID="Iv23li..." # (mismo que dev)
GITHUB_SECRET="ghp_..." # (mismo que dev)
GITHUB_APP_NAME="broslunas-cms" # (mismo que dev)
```

### 3. Cambiar visibilidad de la app (opcional)

Si quieres que otros usuarios instalen tu app:

1. Configuración de la app → **"General"**
2. **"Where can this GitHub App be installed?"**
3. Cambiar a: **"Any account"**
4. Click en **"Save changes"**

---

## 🚨 Troubleshooting

### Error: "App is not installed"

**Causa**: No has instalado la app en tu cuenta de GitHub.

**Solución**: Ve al paso 7 y completa la instalación.

### Error: "Invalid client_id"

**Causa**: El `GITHUB_ID` en `.env` no coincide con el Client ID de la app.

**Solución**: 
1. Ve a la configuración de tu GitHub App
2. Verifica el Client ID
3. Actualiza `.env`
4. Reinicia el servidor

### Error: "Resource not accessible by integration"

**Causa**: La app no tiene los permisos correctos.

**Solución**:
1. Ve a la configuración de tu GitHub App
2. Sección **"Permissions & events"**
3. Verifica que **Contents** esté en **Read and write**
4. Si cambiaste permisos, necesitas **re-instalar** la app:
   - GitHub → Settings → Applications → Installed Apps
   - Click en tu app → **"Configure"**
   - Scroll hasta abajo → Click en **"Uninstall"**
   - Vuelve a instalar (paso 7)

### La página /setup no redirige automáticamente

**Verifica**:
1. La app está realmente instalada en GitHub
2. El navegador tiene las DevTools abiertas (puede pausar el polling)
3. Revisa la consola del navegador por errores
4. Verifica que `/api/check-installation` funcione

---

## ✅ Checklist Final

Antes de considerar la configuración completa:

- [ ] GitHub App creada
- [ ] Permisos: **Contents: Read and write** ✅
- [ ] Client ID copiado a `.env`
- [ ] Client Secret generado y copiado a `.env`
- [ ] App Slug copiado a `.env` como `GITHUB_APP_NAME`
- [ ] App instalada en tu cuenta de GitHub
- [ ] Servidor reiniciado después de actualizar `.env`
- [ ] Login funciona correctamente
- [ ] Flujo de /setup → /dashboard funciona
- [ ] Puedes importar repositorios
- [ ] Puedes editar y guardar posts

---

## 📚 Recursos Adicionales

- [Documentación oficial de GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
- [Permisos de GitHub Apps](https://docs.github.com/en/rest/overview/permissions-required-for-github-apps)
- [NextAuth.js con GitHub](https://next-auth.js.org/providers/github)

---

**¡Listo!** Tu GitHub App está completamente configurada y lista para producción. 🚀
