# Servidor MCP de Documentación Twill

Este es un servidor MCP (Mode### 3. `list_fram### 5. `get_section`
Obtiene el contenido completo de una sección específica.

**Parámetros:**
- `framework` (string): Nombre del framework
- `section` (string): Nombre de la sección

## Ejemplos de Uso

### Búsqueda Inteligente
```
Usuario: "¿Cuál es la última versión de Laravel?"
🎯 Detecta automáticamente: Laravel
📁 Busca en: laravel/

Usuario: "Cómo crear un block editor en Twill"
🎯 Detecta automáticamente: Twill  
📁 Busca en: twill/
```sta todos los frameworks de documentación disponibles.

### 4. `list_sections`
Lista todas las secciones principales de documentación disponibles para un framework.

**Parámetros:**
- `framework` (string): Nombre del framework

### 5. `get_section` Protocol) que proporciona acceso a la documentación completa de Twill CMS.

## Características

- **Recursos**: Acceso a todos los archivos de documentación Markdown
- **Herramientas**: Búsqueda, navegación por secciones y consultas específicas
- **Actualización automática**: Sincroniza automáticamente con el repositorio de documentación

## Instalación

```bash
npm install
```

## Uso

### Ejecutar el servidor
```bash
npm start
```

### Configuración en tu cliente MCP
Agrega esto a tu configuración MCP:

```json
{
  "mcpServers": {
    "twill-docs": {
      "command": "node",
      "args": ["/ruta/a/tu/mcp/mcp.js"]
    }
  }
}
```

## Herramientas Disponibles

### 1. `smart_search` ⭐ **NUEVA**
Búsqueda inteligente que detecta automáticamente el framework basado en palabras clave.

**Parámetros:**
- `query` (string): Consulta natural (ej: "cuál es la última versión de Laravel")

**Ejemplos:**
```
- "¿Cuál es la última versión de Laravel?"
- "Cómo crear un módulo en Twill"
- "Next.js server components"
- "Tailwind dark mode configuration"
- "Inertia.js shared data"
```

**Palabras clave reconocidas:**
- **Laravel**: eloquent, artisan, blade, migrations, middleware, etc.
- **Twill**: cms, block editor, media library, modules, capsules, etc.
- **Next.js**: react, app router, server components, api routes, etc.
- **Inertia.js**: spa, partial reloads, shared data, etc.
- **Tailwind**: utility classes, responsive design, dark mode, etc.

### 2. `search_docs`
Busca contenido específico en toda la documentación o en un framework específico.

**Parámetros:**
- `query` (string): Término de búsqueda
- `framework` (string, opcional): Framework específico

### 3. `list_frameworks`
Lista todas las secciones principales de documentación disponibles.

**Ejemplo:**
```
Mostrar todas las secciones de documentación
```

### 3. `get_section`
Obtiene el contenido completo de una sección específica.

**Parámetros:**
- `section` (string): Nombre de la sección (ej: "getting-started", "modules")

**Ejemplo:**
```
Obtener toda la documentación de la sección "modules"
```

## Recursos

Todos los archivos de documentación están disponibles como recursos con URIs del formato:
```
twill-docs:///ruta/al/archivo.md
```

## Estructura de la Documentación

- `getting-started/` - Guías de inicio y configuración
- `modules/` - Documentación de módulos
- `form-fields/` - Campos de formulario
- `block-editor/` - Editor de bloques
- `relations/` - Relaciones entre modelos
- `media-library/` - Biblioteca de medios
- `settings-sections/` - Secciones de configuración
- `buckets/` - Sistema de buckets
- `user-management/` - Gestión de usuarios
- `dashboard/` - Panel de control
- Y muchas más...

## Desarrollo

El servidor actualiza automáticamente la documentación desde el repositorio remoto cada vez que se solicita un recurso o se ejecuta una herramienta.

## Troubleshooting

Si encuentras problemas:

1. Verifica que tienes conexión a internet para clonar/actualizar el repositorio
2. Asegúrate de que Git esté instalado en tu sistema
3. Revisa los logs del servidor para mensajes de error detallados
