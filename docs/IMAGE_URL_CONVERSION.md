# 🖼️ Conversión Automática de Rutas de Imágenes

## Descripción
El editor ahora convierte automáticamente las rutas relativas de imágenes a URLs completas de GitHub raw durante la vista previa.

## ¿Cómo funciona?

Cuando escribes markdown con imágenes usando rutas relativas en tu repositorio, el editor las convierte automáticamente para mostrarlas en el preview.

### Ejemplos de conversión:

#### 1. **Ruta absoluta desde la raíz del repo**
```markdown
![Stats](/src/assets/img/posts/stats.webp)
```
Se convierte a:
```
https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/main/src/assets/img/posts/stats.webp
```

#### 2. **Ruta relativa sin barra inicial**
```markdown
![Example](src/assets/img/posts/example.png)
```
Se convierte a:
```
https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/main/src/assets/img/posts/example.png
```

#### 3. **URLs absolutas (no se modifican)**
```markdown
![Remote](https://example.com/image.jpg)
```
Permanece igual:
```
https://example.com/image.jpg
```

#### 4. **Rutas relativas con ./ o ../ (no se modifican)**
```markdown
![Local](./images/test.png)
```
Permanece igual (relativa al documento actual):
```
./images/test.png
```

## Características

✅ **Dinámico por repositorio**: El `owner` y `repo` se obtienen automáticamente del repositorio actual
✅ **No invasivo**: Solo afecta la vista previa, no modifica tu markdown
✅ **Inteligente**: Detecta qué tipo de ruta es y solo convierte las que necesitan conversión
✅ **Compatible**: Funciona en las vistas Preview y Split del editor de contenido
✅ **Metadata**: También funciona en los campos de metadata que contienen imágenes (coverImage, avatar, etc.)

## Detalles técnicos

### Componentes afectados
- `components/post-editor/ContentEditor.tsx` - Para el contenido markdown
- `components/post-editor/MetadataField.tsx` - Para los campos de metadata con imágenes

### Función principal
```typescript
const convertToGitHubRawUrl = (
  src: string, 
  repoId?: string
): string
```

### Parámetros
- `src`: La ruta original de la imagen
- `repoId`: ID del repositorio en formato `"owner/repo"` (ejemplo: `"Broslunas/portfolio-old"`)

### Lógica de conversión
1. Si `src` es un Blob o undefined → No hace nada
2. Si `src` es una URL completa (http/https) → No hace nada
3. Si `src` empieza con `/` → Añade `https://raw.githubusercontent.com/{repoId}/refs/heads/main{src}`
4. Si `src` no empieza con `/`, `./`, o `../` → Añade `https://raw.githubusercontent.com/{repoId}/refs/heads/main/{src}`
5. Si `src` empieza con `./` o `../` → No hace nada (mantiene ruta relativa)

## Uso

No requiere ninguna acción adicional. Simplemente escribe tu markdown con las rutas de imágenes como lo harías normalmente:

```markdown
# Mi Post

Aquí está mi gráfico de estadísticas:

![Estadísticas](/src/assets/img/posts/stats.webp)

Y aquí otra imagen:

![Ejemplo](assets/images/example.png)
```

El editor se encargará automáticamente de convertir las rutas para que las imágenes se visualicen correctamente en el preview.

## Uso en Metadata

La conversión también funciona automáticamente en los campos de metadata que contienen imágenes. Por ejemplo:

### Campo `coverImage`:
```yaml
---
title: Mi Artículo
coverImage: /src/assets/img/posts/calc.webp
---
```

La imagen de preview se mostrará automáticamente usando:
```
https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/main/src/assets/img/posts/calc.webp
```

### Otros campos compatibles:
- `coverImage`, `cover`, `image`
- `avatar`, `thumbnail`, `banner`
- `poster`, `logo`, `icon`, `bg`
- Cualquier campo con "image" o "img" en el nombre

## Notas
- La conversión solo ocurre en la vista previa del editor
- El contenido markdown guardado **no se modifica**
- Esto permite que las rutas funcionen tanto en el CMS como cuando el contenido se renderiza en tu sitio web
