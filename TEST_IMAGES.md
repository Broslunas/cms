# Test de Imágenes con Rutas Relativas

Este archivo es para probar que las imágenes con rutas relativas se convierten correctamente a URLs de GitHub raw.

## Ejemplos de rutas:

### 1. Ruta absoluta desde la raíz del repositorio:
![Stats](/src/assets/img/posts/stats.webp)

### 2. Ruta relativa sin barra inicial:
![Example](src/assets/img/posts/example.png)

### 3. URL completa (no debería modificarse):
![Remote](https://example.com/image.jpg)

### 4. Ruta relativa con ./
![Local](./images/test.png)

## Notas:
- Las rutas que empiezan con `/` se convierten a: `https://raw.githubusercontent.com/{owner}/{repo}/refs/heads/main/ruta`
- Las rutas sin `/` también se convierten agregando `/` antes de la ruta
- Las URLs completas (http/https) no se modifican
- Las rutas con `./` o `../` tampoco se modifican (quedan relativas)
