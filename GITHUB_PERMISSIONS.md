# � Configuración de GitHub App - Solución al Error 403

## ❌ Error Actual

```
Error: Resource not accessible by integration
Status: 403
```

**Causa:** GitHub OAuth Apps **NO tienen permisos** para escribir en repositorios.

---

## ✅ Solución: Crear una GitHub App

### Paso 1: Crear la GitHub App

1. **Ve a:** https://github.com/settings/apps/new

2. **Configura los campos:**

```
GitHub App name: Astro-Git-CMS-App
Description: CMS para gestionar contenido Astro mediante Git
Homepage URL: http://localhost:3000
```

3. **Callback URL:**
```
http://localhost:3000/api/auth/callback/github
```

4. **Webhook:**
```
☐ Active (déjalo DESACTIVADO)
```

5. **Permisos de Repositorio:**

Scroll hasta "Repository permissions":

```
Contents: Read and write     ✅ MUY IMPORTANTE
Metadata: Read-only          ✅ Automático
```

6. **Where can this GitHub App be installed?**
```
● Only on this account
```

7. **Click "Create GitHub App"**

---

### Paso 2: Configurar Credenciales

1. **Después de crear, verás la página de configuración**

2. **Client ID:**
   - Copia el "Client ID" (está visible)

3. **Client secrets:**
   - Click "Generate a new client secret"
   - **COPIA EL SECRET INMEDIATAMENTE** (solo se muestra una vez)

4. **Private key (NO necesario para OAuth flow)**
   - No lo necesitas para este caso

---

### Paso 3: Actualizar .env.local

Actualiza tu archivo `.env.local`:

```bash
# MongoDB
MONGODB_URI=tu-mongodb-uri-aqui

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-aqui

# GitHub App (NUEVOS VALORES)
GITHUB_ID=tu_nuevo_client_id_aqui
GITHUB_SECRET=tu_nuevo_client_secret_aqui
```

---

### Paso 4: Instalar la App en tu cuenta

1. **Ve a:** Settings de tu GitHub App
2. **Click en "Install App" (sidebar izquierdo)**
3. **Selecciona tu cuenta**
4. **Elige:**
   - ● All repositories (o)
   - ○ Only select repositories (selecciona los repos de Astro)
5. **Click "Install"**

---

### Paso 5: Probar

1. **Reinicia el servidor:**
```bash
npm run dev
```

2. **Cierra sesión y vuelve a iniciar**
   - Esto generará un nuevo access token con los permisos correctos

3. **Intenta hacer un commit**
   - Ahora debería funcionar ✅

---

## 🔍 Diferencias: OAuth App vs GitHub App

| Feature | OAuth App | GitHub App |
|---------|-----------|------------|
| **Permisos de escritura** | ❌ Limitado | ✅ Completo |
| **Scopes granulares** | ❌ No | ✅ Sí |
| **Rate limit** | 5,000/hora | 15,000/hora |
| **Mejor para** | Solo lectura | CMS, CI/CD |

---

## 🚨 Troubleshooting

### Error: "App is not installed"

**Solución:**
1. Ve a https://github.com/settings/installations
2. Verifica que tu App esté instalada
3. Re-instala si es necesario

### Error: "Invalid client_id"

**Solución:**
1. Verifica que copiaste el Client ID correcto
2. No confundas el Client ID con el App ID
3. Reinicia el servidor después de cambiar .env.local

### Todavía da error 403

**Solución:**
1. Verifica que los permisos sean "Read and write" (no solo "Read")
2. Asegúrate de haber instalado la app en tu cuenta
3. Cierra sesión y vuelve a iniciar sesión en el CMS

---

## 📝 Verificación de Permisos

Para verificar que todo está bien configurado:

1. **Ve a tu GitHub App:**
   - https://github.com/settings/apps/[tu-app-name]

2. **Verifica en "Permissions":**
   ```
   Repository permissions:
   ✅ Contents: Read & write
   ✅ Metadata: Read-only
   ```

3. **Verifica en "Install App":**
   - Debe aparecer instalada en tu cuenta
   - Debe tener acceso a tus repos de Astro

---

## ✅ Checklist Final

Antes de probar:

- [ ] GitHub App creada
- [ ] Client ID copiado
- [ ] Client Secret generado y copiado
- [ ] Permisos "Contents: Read & write" activados
- [ ] App instalada en tu cuenta GitHub
- [ ] .env.local actualizado con nuevas credenciales
- [ ] Servidor reiniciado
- [ ] Sesión cerrada y reiniciada en el CMS

---

## 🎯 Resultado Esperado

Después de estos pasos:

✅ Podrás importar repos  
✅ Podrás editar posts  
✅ Podrás hacer commits a GitHub  
✅ No más errores 403

---

## 💡 Nota Importante

**GitHub Apps** son la forma moderna y recomendada de integrar con GitHub. Son más seguras y tienen mejores permisos que las OAuth Apps tradicionales.

**Para producción:**
- Cambia los URLs de `localhost:3000` a tu dominio real
- Regenera el NEXTAUTH_SECRET para producción
- Considera usar variables de entorno separadas para dev/prod
