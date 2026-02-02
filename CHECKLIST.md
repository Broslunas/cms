# ✅ Checklist de Configuración

Sigue estos pasos para poner en marcha el CMS:

## 1️⃣ MongoDB Atlas (5 minutos)

- [ ] Ir a https://www.mongodb.com/cloud/atlas/register
- [ ] Crear cuenta gratuita
- [ ] Crear cluster M0 (gratis)
- [ ] Crear usuario de base de datos
- [ ] Permitir acceso desde tu IP (o 0.0.0.0/0 para desarrollo)
- [ ] Copiar connection string

## 2️⃣ GitHub OAuth (3 minutos)

- [ ] Ir a https://github.com/settings/developers
- [ ] Crear nueva OAuth App
- [ ] Configurar callback URL: `http://localhost:3000/api/auth/callback/github`
- [ ] Guardar Client ID
- [ ] Generar y guardar Client Secret

## 3️⃣ Variables de Entorno (2 minutos)

- [ ] Crear archivo `.env.local` en la raíz
- [ ] Copiar el contenido de `.env.example`
- [ ] Rellenar `MONGODB_URI` con tu connection string
- [ ] Rellenar `GITHUB_ID` y `GITHUB_SECRET`
- [ ] Generar `NEXTAUTH_SECRET` (ver SETUP.md)

## 4️⃣ Ejecutar (1 minuto)

```bash
npm run dev
```

- [ ] Abrir http://localhost:3000
- [ ] Hacer clic en "Continuar con GitHub"
- [ ] ✨ ¡Listo!

---

**Tiempo total estimado**: 10-15 minutos

📖 Para instrucciones detalladas, ver: `SETUP.md`
