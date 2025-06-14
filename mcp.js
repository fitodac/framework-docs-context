const fs = require("fs");
const path = require("path");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

// Directorios de documentación locales
const DOCS_DIRS = [
  path.resolve(__dirname, "twill"),
  path.resolve(__dirname, "laravel"),
  path.resolve(__dirname, "next"),
  path.resolve(__dirname, "inertia"),
  path.resolve(__dirname, "tailwind")
].filter(dir => fs.existsSync(dir));

// Palabras clave para detección automática de frameworks
const FRAMEWORK_KEYWORDS = {
  laravel: [
    'laravel', 'eloquent', 'artisan', 'blade', 'composer', 'php artisan',
    'migrations', 'seeder', 'middleware', 'route', 'controller', 'model',
    'facade', 'service provider', 'tinker', 'homestead', 'valet', 'forge',
    'nova', 'horizon', 'telescope', 'sanctum', 'passport', 'breeze',
    'jetstream', 'livewire', 'inertia laravel', 'sail', 'octane'
  ],
  twill: [
    'twill', 'cms', 'twill cms', 'block editor', 'media library',
    'form fields', 'modules', 'capsules', 'buckets', 'settings sections',
    'user management', 'dashboard twill', 'global search', 'revisions',
    'previewing', 'nested modules', 'singletons', 'repeater'
  ],
  next: [
    'next.js', 'nextjs', 'next', 'react', 'app router', 'pages router',
    'server components', 'client components', 'api routes', 'middleware next',
    'image optimization', 'font optimization', 'static generation',
    'server side rendering', 'ssr', 'ssg', 'isr', 'vercel'
  ],
  inertia: [
    'inertia.js', 'inertia', 'spa', 'single page application',
    'inertia laravel', 'inertia vue', 'inertia react', 'inertia svelte',
    'server side adapter', 'client side adapter', 'shared data',
    'partial reloads', 'progress indicator'
  ],
  tailwind: [
    'tailwind', 'tailwind css', 'utility classes', 'responsive design',
    'dark mode', 'custom colors', 'spacing', 'typography', 'forms',
    'components', 'plugins', 'purge css', 'jit', 'arbitrary values'
  ]
};

function detectFrameworkFromQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Buscar coincidencias exactas primero
  for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword.toLowerCase())) {
        return framework;
      }
    }
  }
  
  return null;
}

// Sistema de prioridades para archivos
function getFilePriority(filePath) {
  const path = filePath.toLowerCase();
  
  // Prioridad alta (10 puntos)
  if (path.includes('index.md') || path.includes('getting-started') || 
      path.includes('installation') || path.includes('configuration')) {
    return 10;
  }
  
  // Prioridad media-alta (8 puntos)  
  if (path.includes('1_index.md') || path.includes('2_installation') ||
      path.includes('modules') || path.includes('routing') || 
      path.includes('controllers') || path.includes('models')) {
    return 8;
  }
  
  // Prioridad media (5 puntos)
  if (path.includes('forms') || path.includes('database') ||
      path.includes('authentication') || path.includes('components')) {
    return 5;
  }
  
  // Prioridad baja (2 puntos)
  return 2;
}

// Extraer fragmentos relevantes del contenido
function extractRelevantFragment(content, query, maxLength = 800) {
  const lines = content.split('\n');
  const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2);
  
  let bestFragment = '';
  let bestScore = 0;
  
  // Buscar el fragmento con más coincidencias
  for (let i = 0; i < lines.length; i++) {
    const fragment = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 10)).join('\n');
    
    if (fragment.length > maxLength) continue;
    
    const fragmentLower = fragment.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      return acc + (fragmentLower.includes(word) ? 1 : 0);
    }, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestFragment = fragment;
    }
  }
  
  return bestFragment || content.substring(0, maxLength) + '...';
}

function log(msg) {
  console.error("🔧", msg);
}

function walkMdFiles(dirs = DOCS_DIRS) {
  const files = [];
  
  for (const baseDir of dirs) {
    if (!fs.existsSync(baseDir)) continue;
    
    const frameworkName = path.basename(baseDir);
    const dirFiles = walkMdFilesRecursive(baseDir, baseDir, frameworkName);
    files.push(...dirFiles);
  }
  
  return files;
}

function walkMdFilesRecursive(dir, baseDir, frameworkName) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const res = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMdFilesRecursive(res, baseDir, frameworkName));
    } else if (entry.name.endsWith(".md")) {
      const relativePath = path.relative(baseDir, res);
      files.push({
        path: `${frameworkName}/${relativePath}`,
        fullPath: res,
        framework: frameworkName,
      });
    }
  }
  
  return files;
}

class FrameworkDocsServer {
  constructor() {
    this.server = new Server(
      {
        name: "framework-docs-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  async initialize() {
    try {
      log(`✅ Documentación cargada desde ${DOCS_DIRS.length} frameworks locales`);
    } catch (error) {
      log(`❌ Error inicializando: ${error.message}`);
    }
  }

  setupHandlers() {
    // Lista de recursos disponibles
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      await this.initialize();
      
      const files = walkMdFiles();
      const resources = files.map(file => ({
        uri: `framework-docs:///${file.path}`,
        mimeType: "text/markdown",
        name: file.path,
        description: `Documentación de ${file.framework}: ${file.path}`,
      }));

      return {
        resources,
      };
    });

    // Leer un recurso específico
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      
      if (!uri.startsWith("framework-docs:///")) {
        throw new Error(`URI no soportada: ${uri}`);
      }

      const filePath = uri.replace("framework-docs:///", "");
      const files = walkMdFiles();
      const file = files.find(f => f.path === filePath);

      if (!file || !fs.existsSync(file.fullPath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      const content = fs.readFileSync(file.fullPath, "utf8");
      
      return {
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    });

    // Lista de herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "smart_search",
            description: "Búsqueda inteligente que detecta automáticamente el framework basado en palabras clave en la consulta",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Consulta o pregunta (ej: 'cuál es la última versión de Laravel', 'cómo crear un módulo en Twill')",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "search_docs",
            description: "Buscar en la documentación (resultados optimizados con fragmentos relevantes)",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Término de búsqueda",
                },
                framework: {
                  type: "string",
                  description: "Framework específico para buscar (opcional): twill, laravel, next, inertia, tailwind",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_full_content",
            description: "Obtener el contenido completo de un archivo específico",
            inputSchema: {
              type: "object",
              properties: {
                framework: {
                  type: "string",
                  description: "Framework: twill, laravel, next, inertia, tailwind",
                },
                file_path: {
                  type: "string",
                  description: "Ruta relativa del archivo (ej: 'modules/1_index.md')",
                },
              },
              required: ["framework", "file_path"],
            },
          },
          {
            name: "list_frameworks",
            description: "Listar todos los frameworks de documentación disponibles",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "list_sections",
            description: "Listar todas las secciones de documentación de un framework específico",
            inputSchema: {
              type: "object",
              properties: {
                framework: {
                  type: "string",
                  description: "Framework para listar secciones: twill, laravel, next, inertia, tailwind",
                },
              },
              required: ["framework"],
            },
          },
          {
            name: "get_section",
            description: "Obtener el contenido completo de una sección específica de un framework",
            inputSchema: {
              type: "object",
              properties: {
                framework: {
                  type: "string",
                  description: "Framework: twill, laravel, next, inertia, tailwind",
                },
                section: {
                  type: "string",
                  description: "Nombre de la sección",
                },
              },
              required: ["framework", "section"],
            },
          },
        ],
      };
    });

    // Ejecutar herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "smart_search":
          return await this.smartSearch(args.query);
        
        case "search_docs":
          return await this.searchDocs(args.query, args.framework);
        
        case "get_full_content":
          return await this.getFullContent(args.framework, args.file_path);
        
        case "list_frameworks":
          return await this.listFrameworks();
        
        case "list_sections":
          return await this.listSections(args.framework);
        
        case "get_section":
          return await this.getSection(args.framework, args.section);
        
        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }
    });
  }

  async getFullContent(framework, filePath) {
    await this.initialize();
    
    // Buscar el archivo
    const baseDir = DOCS_DIRS.find(dir => path.basename(dir) === framework);
    
    if (!baseDir) {
      return {
        content: [
          {
            type: "text",
            text: `❌ **Error:** Framework "${framework}" no encontrado. Usa la herramienta "list_frameworks" para ver los frameworks disponibles.`,
          },
        ],
      };
    }
    
    // Construir ruta completa
    const fullPath = path.join(baseDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        content: [
          {
            type: "text",
            text: `❌ **Error:** Archivo "${filePath}" no encontrado en el framework "${framework}".`,
          },
        ],
      };
    }
    
    // Leer contenido completo
    const content = fs.readFileSync(fullPath, "utf8");
    const fileSize = content.length;
    
    return {
      content: [
        {
          type: "text",
          text: `📄 **Contenido completo:** [${framework}] ${filePath} (${Math.round(fileSize/1024)}KB)\n\n---\n\n${content}`,
        },
      ],
    };
  }

  async smartSearch(query) {
    await this.initialize();
    
    // Detectar framework automáticamente
    const detectedFramework = detectFrameworkFromQuery(query);
    
    if (detectedFramework) {
      log(`🎯 Framework detectado automáticamente: ${detectedFramework}`);
      
      // Buscar específicamente en el framework detectado
      const results = await this.searchDocs(query, detectedFramework);
      
      // Agregar información sobre la detección automática
      return {
        content: [
          {
            type: "text",
            text: `🎯 **Framework detectado automáticamente: ${detectedFramework.toUpperCase()}**\n\n` +
              results.content[0].text,
          },
        ],
      };
    } else {
      // Si no se detecta framework específico, buscar en todos
      log(`🔍 No se detectó framework específico, buscando en todos...`);
      const results = await this.searchDocs(query);
      
      return {
        content: [
          {
            type: "text",
            text: `🔍 **Búsqueda general** (no se detectó framework específico)\n\n` +
              results.content[0].text + 
              `\n\n💡 **Tip:** Para mejores resultados, incluye palabras clave como 'Laravel', 'Twill', 'Next.js', etc.`,
          },
        ],
      };
    }
  }

  async searchDocs(query, framework = null) {
    await this.initialize();
    
    const files = walkMdFiles();
    const filteredFiles = framework 
      ? files.filter(f => f.framework === framework)
      : files;
    
    const results = [];

    for (const file of filteredFiles) {
      const content = fs.readFileSync(file.fullPath, "utf8");
      
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const priority = getFilePriority(file.path);
        const fragment = extractRelevantFragment(content, query);
        
        results.push({
          framework: file.framework,
          file: file.path,
          priority,
          fragment,
          size: content.length,
        });
      }
    }

    // Ordenar por prioridad y limitar resultados
    const sortedResults = results
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5); // Máximo 5 archivos

    const frameworkFilter = framework ? ` en ${framework}` : " en todos los frameworks";
    return {
      content: [
        {
          type: "text",
          text: `📚 **Encontrados ${sortedResults.length} resultados relevantes${frameworkFilter}:**\n\n` +
            sortedResults.map((r, index) => 
              `### ${index + 1}. **[${r.framework.toUpperCase()}]** ${r.file}\n` +
              `${r.fragment}\n` +
              `*Prioridad: ${r.priority}/10 | Tamaño: ${Math.round(r.size/1024)}KB*\n\n---\n`
            ).join('\n') +
            (results.length > 5 ? `\n💡 **Nota:** Se encontraron ${results.length} resultados, mostrando los 5 más relevantes.` : ''),
        },
      ],
    };
  }

  async listFrameworks() {
    await this.initialize();
    
    const frameworks = DOCS_DIRS.map(dir => {
      const name = path.basename(dir);
      const files = walkMdFiles([dir]);
      return {
        name,
        fileCount: files.length,
        path: dir,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: `Frameworks de documentación disponibles:\n\n` +
            frameworks.map(f => `- **${f.name}**: ${f.fileCount} archivos de documentación`).join('\n'),
        },
      ],
    };
  }

  async listSections(framework) {
    await this.initialize();
    
    const frameworkDir = DOCS_DIRS.find(dir => path.basename(dir) === framework);
    if (!frameworkDir) {
      return {
        content: [
          {
            type: "text",
            text: `Framework "${framework}" no encontrado. Usa la herramienta "list_frameworks" para ver los frameworks disponibles.`,
          },
        ],
      };
    }

    const files = walkMdFiles([frameworkDir]);
    const sections = new Set();
    
    files.forEach(file => {
      const relativePath = file.path.replace(`${framework}/`, '');
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        sections.add(parts[0]);
      }
    });

    return {
      content: [
        {
          type: "text",
          text: `Secciones disponibles en ${framework}:\n\n` +
            Array.from(sections).sort().map(section => `- ${section}`).join('\n'),
        },
      ],
    };
  }

  async getSection(framework, sectionName) {
    await this.initialize();
    
    const files = walkMdFiles();
    const sectionFiles = files.filter(file => 
      file.framework === framework && 
      file.path.startsWith(`${framework}/${sectionName}/`)
    );
    
    if (sectionFiles.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No se encontró la sección "${sectionName}" en el framework "${framework}". Usa la herramienta "list_sections" con el framework adecuado para ver las secciones disponibles.`,
          },
        ],
      };
    }

    let content = `# Sección: ${sectionName} (${framework})\n\n`;
    
    // Ordenar archivos por prioridad
    const sortedFiles = sectionFiles
      .map(file => ({
        ...file,
        priority: getFilePriority(file.path)
      }))
      .sort((a, b) => b.priority - a.priority);
    
    // Limitar a máximo 5 archivos para no sobrecargar
    for (const file of sortedFiles.slice(0, 5)) {
      const fileContent = fs.readFileSync(file.fullPath, "utf8");
      content += `## ${file.path}\n\n${fileContent}\n\n---\n\n`;
    }
    
    // Indicar si hay más archivos
    if (sortedFiles.length > 5) {
      content += `\n💡 **Nota:** Se encontraron ${sortedFiles.length} archivos en esta sección, mostrando los 5 más relevantes.`;
    }

    return {
      content: [
        {
          type: "text",
          text: content,
        },
      ],
    };
  }
}