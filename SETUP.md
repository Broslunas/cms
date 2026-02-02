# 🎯 Guía de Configuración Rápida - Astro-Git CMS

## Paso 1: MongoDB Atlas

1. Ve a https://www.mongodb.com/cloud/atlas/register
2. Crea una cuenta gratuita
3. Click en "Build a Database" → Selecciona M0 (Free)
4. Elige un proveedor (AWS, Google Cloud, Azure)
5. Click "Create"
6. En "Security Quickstart":
   - Username: `astrocms`
   - Password: Genera una contraseña segura (guárdala!)
7. En "Where would you like to connect from?":
   - Click "Add My Current IP Address"
   - O agrega `0.0.0.0/0` para permitir todas las IPs (solo para desarrollo)
8. Click "Finish and Close"
9. Click en "Connect" → "Connect your application"
10. Copia la connection string:
    ```
    mongodb+srv://astrocms:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```
11. Reemplaza `<password>` con tu contraseña real

## Paso 2: GitHub OAuth App

1. Ve a https://github.com/settings/developers
2. Click en "OAuth Apps" → "New OAuth App"
3. Rellena el formulario:
   ```
   Application name: Astro-Git CMS Local
   Homepage URL: http://localhost:3000
   Authorization callback URL: http://localhost:3000/api/auth/callback/github
   ```
4. Click "Register application"
5. **Guarda tu Client ID** (aparece inmediatamente)
6. Click en "Generate a new client secret"
7. **Guarda tu Client Secret** (solo se muestra una vez!)

## Paso 3: Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://astrocms:TU_PASSWORD@cluster0.xxxxx.mongodb.net/astro-cms?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=TU_SECRET_GENERADO

# GitHub OAuth
GITHUB_ID=tu-github-client-id
GITHUB_SECRET=tu-github-client-secret
```

### Generar NEXTAUTH_SECRET

**En Windows (Git Bash o WSL):**
```bash
openssl rand -base64 32
```

**En Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Online (si no tienes OpenSSL):**
Ve a https://generate-secret.vercel.app/32

## Paso 4: Instalar y Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## ✅ Verificación

1. ¿Se abre la landing page? ✓
2. ¿Funciona "Continuar con GitHub"? ✓
3. ¿Te redirige al dashboard después del login? ✓
4. ¿Ves tus repositorios? ✓

## 🐛 Problemas Comunes

### Error: "MongooseServerSelectionError"
- Verifica que tu IP esté permitida en MongoDB Atlas
- Verifica que la contraseña en la URI sea correcta (sin caracteres especiales sin encodear)

### Error: "OAuthCallbackError"
- Verifica que las URLs de callback en GitHub coincidan exactamente
- Verifica que GITHUB_ID y GITHUB_SECRET sean correctos

### Error: "No se encontraron repositorios"
- Verifica que tengas repositorios en tu cuenta de GitHub
- Los repositorios privados requieren el scope `repo` (ya configurado)

## 📞 Soporte

Si tienes problemas, verifica:
1. Los logs del servidor en la terminal
2. La consola del navegador (F12)
3. El README.md principal para documentación completa
