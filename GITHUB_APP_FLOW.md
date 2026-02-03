# 🔐 Flujo de Instalación de GitHub App - Nuevos Usuarios

## 📋 Resumen

Cuando un nuevo usuario se registra en el CMS, primero obtiene acceso básico a su cuenta (email, nombre, foto) mediante GitHub OAuth. Sin embargo, para poder gestionar contenido, **debe instalar la GitHub App** que otorga los permisos necesarios para leer y escribir en sus repositorios.

---

## 🔄 Flujo Completo de Usuario Nuevo

### 1. **Inicio de Sesión (GitHub OAuth)**

```
Usuario → Hace clic en "Login con GitHub"
    ↓
NextAuth → Autentica con GitHub OAuth
    ↓
Usuario → Obtiene sesión con:
    - ✅ Email
    - ✅ Nombre
    - ✅ Foto de perfil
    - ✅ Access Token
    - ❌ GitHub App NO instalada (appInstalled: false)
```

### 2. **Verificación Automática**

```
Sesión creada
    ↓
auth.ts (callback) → Verifica si tiene la app instalada
    ↓
checkAppInstalled() → Consulta GitHub API
    ↓
session.appInstalled = false
```

### 3. **Redirección a Setup**

```
Usuario intenta acceder a /dashboard
    ↓
Dashboard page → Verifica session.appInstalled
    ↓
appInstalled === false → redirect("/setup")
```

### 4. **Página de Setup (/setup)**

El usuario ve una página guiada con:

- **Instrucciones paso a paso** para instalar la app
- **Botón para instalar** que abre GitHub en nueva pestaña
- **Verificación automática** cada 3 segundos

```tsx
Setup Page muestra:
  1. Instala la GitHub App
  2. Selecciona tus repositorios  
  3. ¡Comienza a trabajar!

Botón: "Instalar GitHub App"
  → Abre: https://github.com/apps/{GITHUB_APP_NAME}/installations/new
```

### 5. **Instalación en GitHub**

```
Usuario hace clic en "Instalar GitHub App"
    ↓
GitHub → Muestra página de instalación
    ↓
Usuario selecciona:
    - [ ] All repositories (todos)
    - [ ] Only select repositories (específicos)
    ↓
Usuario hace clic en "Install"
    ↓
GitHub → Instala la app
    ↓
Usuario cierra la pestaña / vuelve al CMS
```

### 6. **Detección Automática**

Mientras el usuario está en `/setup`:

```
InstallationChecker (component)
    ↓
Cada 3 segundos:
    → fetch('/api/check-installation')
    → checkAppInstalled(access_token)
    → Consulta GitHub API
    ↓
Si installed === true:
    → router.push('/dashboard')
    → router.refresh() // Actualiza la sesión
```

### 7. **Acceso al Dashboard**

```
Usuario redirigido a /dashboard
    ↓
auth() → Nueva sesión con appInstalled: true
    ↓
Dashboard → Muestra proyectos
    ↓
Usuario puede:
    ✅ Importar repositorios
    ✅ Editar posts
    ✅ Hacer commits a GitHub
```

---

## 🏗️ Arquitectura Implementada

### **Archivos Creados/Modificados**

#### 1. **lib/github-app.ts** (Nuevo)
Utilidades para verificar la instalación:

```typescript
- checkAppInstalled(accessToken: string): Promise<boolean>
  → Verifica si el usuario tiene la app instalada
  
- getAppInstallUrl(): string
  → Genera la URL de instalación
  
- getInstallationId(accessToken: string): Promise<number | null>
  → Obtiene el ID de instalación (para uso futuro)
```

#### 2. **app/setup/page.tsx** (Nuevo)
Página de configuración inicial:

- Muestra instrucciones paso a paso
- Botón para instalar la app
- Componente de verificación automática
- Diseño premium y claro

#### 3. **components/InstallationChecker.tsx** (Nuevo)
Componente client-side que:

- Hace polling cada 3 segundos
- Verifica el endpoint `/api/check-installation`
- Redirige automáticamente cuando detecta instalación
- Muestra indicador de "Verificando instalación..."

#### 4. **app/api/check-installation/route.ts** (Nuevo)
Endpoint API:

```typescript
GET /api/check-installation
Response: {
  installed: boolean,
  message: string
}
```

#### 5. **lib/auth.ts** (Modificado)
Callback de sesión actualizado:

```typescript
async session({ session, token }) {
  // ... código existente ...
  
  // Verificar instalación de la app
  if (session.access_token) {
    session.appInstalled = await checkAppInstalled(session.access_token);
  }
  
  return session;
}
```

#### 6. **app/dashboard/page.tsx** (Modificado)
Verificación agregada:

```typescript
if (!session.appInstalled) {
  redirect("/setup");
}
```

#### 7. **types/next-auth.d.ts** (Modificado)
Tipo extendido:

```typescript
interface Session {
  user: { id: string } & DefaultSession["user"];
  access_token?: string;
  appInstalled?: boolean; // 🆕
}
```

#### 8. **.env + .env.example** (Modificado)
Nueva variable:

```bash
GITHUB_APP_NAME=broslunas-cms
```

---

## 🔍 Verificaciones Técnicas

### **¿Cómo se verifica la instalación?**

```typescript
// lib/github-app.ts
const { data: installations } = await octokit.request('GET /user/installations');

const ourApp = installations.installations.find(
  (installation) => installation.app_slug === process.env.GITHUB_APP_NAME
);

return !!ourApp; // true si está instalada
```

### **¿Cuándo se actualiza el estado?**

1. **Al iniciar sesión** → `auth.ts` callback verifica automáticamente
2. **Al recargar página** → Sesión se regenera, verifica nuevamente
3. **En /setup** → Polling cada 3 segundos
4. **Al navegar a /dashboard** → Server-side verifica antes de renderizar

---

## 🎯 Beneficios del Flujo

### ✅ **Seguridad**
- Permisos granulares (solo repos seleccionados)
- Token con scope correcto
- Verificación en cada request importante

### ✅ **UX Mejorada**
- Detección automática de instalación
- Sin necesidad de refrescar manualmente
- Instrucciones claras y visuales
- Feedback en tiempo real

### ✅ **Escalable**
- Fácil agregar más comprobaciones
- Reutilizable para otras features
- Separación de responsabilidades

---

## 🚨 Casos Edge

### **Usuario ya tiene la app instalada**

```
Login → auth callback verifica
  ↓
appInstalled = true
  ↓
Redirige directo a /dashboard
```

### **Usuario instala la app pero no recarga**

```
InstallationChecker → Polling activo
  ↓
Detecta instalación
  ↓
Redirige automáticamente
```

### **Usuario desinstala la app después**

```
Próximo login → checkAppInstalled() retorna false
  ↓
session.appInstalled = false
  ↓
Redirige a /setup nuevamente
```

### **Error de API de GitHub**

```
checkAppInstalled() → catch error
  ↓
return false (modo seguro)
  ↓
Usuario ve /setup
```

---

## 📊 Estados de Usuario

| Estado | appInstalled | Puede acceder a | Redirige a |
|--------|--------------|-----------------|------------|
| **Sin login** | - | `/` | `/` |
| **Login sin app** | `false` | `/setup` | `/setup` |
| **Login con app** | `true` | Todo | `/dashboard` |

---

## 🔧 Variables de Entorno Necesarias

```bash
# GitHub OAuth (para autenticación)
GITHUB_ID=your-github-app-client-id
GITHUB_SECRET=your-github-app-client-secret

# GitHub App Name (para verificar instalación)
GITHUB_APP_NAME=your-github-app-slug
```

**Importante:** El `GITHUB_APP_NAME` debe ser el **slug** de la app (el que aparece en la URL), no el display name.

Ejemplo:
- ❌ Display Name: "Broslunas CMS"
- ✅ App Slug: `broslunas-cms`

---

## 🎨 UI/UX de /setup

### **Diseño**
- Card centrado con gradiente de fondo
- Icono de GitHub prominente
- 3 pasos numerados claramente
- Sección de permisos con icono de check
- 2 botones de acción (instalar / ya instalé)

### **Comportamiento**
- Verificación automática en background
- Indicador sutil de "Verificando instalación..."
- Smooth transitions al redirigir

### **Responsive**
- Mobile-first
- Botones apilados en móvil
- Layout horizontal en desktop

---

## 🧪 Testing del Flujo

### **Test 1: Usuario Nuevo**
1. Crear cuenta nueva en GitHub (o usar modo incógnito)
2. Login en el CMS → Debe ir a `/setup`
3. No instalar app → Debe quedarse en `/setup`
4. Click "Instalar GitHub App" → Debe abrir GitHub
5. Instalar app + volver al CMS → Debe redirigir a `/dashboard` automáticamente

### **Test 2: Usuario Existente**
1. Login con cuenta que ya tiene la app
2. Debe ir directo a `/dashboard`
3. No debe ver `/setup`

### **Test 3: Desinstalación**
1. Usuario con app instalada
2. Ir a GitHub → Desinstalar la app
3. Cerrar sesión en CMS
4. Volver a hacer login → Debe ir a `/setup`

---

## 📝 Próximos Pasos Posibles

### **Mejoras Futuras**

1. **Webhook de instalación**
   - GitHub puede notificar cuando la app se instala
   - Elimina necesidad de polling
   - Más eficiente

2. **Página de configuración de permisos**
   - Mostrar qué repos tienen acceso
   - Permitir agregar/quitar repos
   - Ver installation ID

3. **Sincronización automática**
   - Detectar cuando se agregan nuevos repos
   - Auto-importar repos permitidos
   - Notificar sobre cambios de permisos

4. **Analytics**
   - Trackear cuántos usuarios completan setup
   - Tiempo promedio de instalación
   - Tasa de abandono en setup

---

## ✅ Checklist de Implementación

- [x] Variable `GITHUB_APP_NAME` en .env
- [x] Utilidades en `lib/github-app.ts`
- [x] Type `appInstalled` en NextAuth
- [x] Callback de verificación en `auth.ts`
- [x] Página `/setup` con instrucciones
- [x] Componente `InstallationChecker`
- [x] Endpoint `/api/check-installation`
- [x] Verificación en `/dashboard`
- [x] Documentación completa

---

## 🎉 Resultado Final

**Flujo completo y automático** donde:

1. ✅ Nuevos usuarios son guiados a instalar la app
2. ✅ Detección automática sin intervención manual
3. ✅ UX fluida con feedback visual
4. ✅ Verificación de permisos en cada sesión
5. ✅ Código limpio y mantenible
6. ✅ Preparado para escalar

**El CMS ahora requiere explícitamente la instalación de la GitHub App antes de permitir la gestión de contenido.** 🚀
