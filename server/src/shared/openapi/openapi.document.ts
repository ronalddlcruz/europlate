type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type RouteGroup = {
  tag: string
  basePath: string
  source: string
  routes: string[]
}

// Inventario explícito: la prueba de cobertura compara estas rutas con los routers Express.
export const API_GROUPS: RouteGroup[] = [
  {
    tag: 'Auth',
    basePath: '/api/auth',
    source: 'auth/routes/auth.routes.ts',
    routes: ['POST /login', 'GET /session'],
  },
  {
    tag: 'Dashboard',
    basePath: '/api/dashboard',
    source: 'dashboard/routes/dashboard.routes.ts',
    routes: ['GET /summary'],
  },
  {
    tag: 'Productos',
    basePath: '/api/products',
    source: 'products/routes/product.routes.ts',
    routes: [
      'GET /',
      'POST /',
      'GET /units',
      'GET /categories',
      'GET /attributes',
      'POST /units',
      'POST /categories',
      'POST /variable-subcategories/:id/products',
      'POST /attributes',
      'PATCH /units/:id',
      'DELETE /units/:id',
      'PATCH /categories/:id',
      'DELETE /categories/:id',
      'PATCH /attributes/:id',
      'DELETE /attributes/:id',
      'GET /:id',
      'PATCH /:id',
      'DELETE /:id',
    ],
  },
  {
    tag: 'Almacén e inventario',
    basePath: '/api/inventory',
    source: 'inventory/routes/inventory.routes.ts',
    routes: [
      'GET /stock',
      'GET /movements',
      'GET /transfers',
      'GET /adjustments',
      'GET /warehouses',
      'GET /warehouse-responsibles',
      'GET /catalog',
      'POST /transfers',
      'POST /adjustments',
      'POST /warehouses',
      'PATCH /warehouses/:id',
      'DELETE /warehouses/:id',
    ],
  },
  {
    tag: 'Compras nacionales',
    basePath: '/api/purchases',
    source: 'purchases/routes/purchase.routes.ts',
    routes: [
      'GET /',
      'GET /catalog',
      'POST /documents',
      'DELETE /documents',
      'POST /',
      'GET /:id',
      'PATCH /:id',
      'POST /:id/receive',
      'DELETE /:id',
    ],
  },
  {
    tag: 'Importaciones',
    basePath: '/api/imports',
    source: 'imports/routes/import.routes.ts',
    routes: [
      'GET /',
      'GET /catalog',
      'POST /documents',
      'DELETE /documents',
      'POST /',
      'GET /:id',
      'PATCH /:id',
      'POST /:id/receive',
      'DELETE /:id',
    ],
  },
  {
    tag: 'Producción',
    basePath: '/api/production',
    source: 'production/routes/production.routes.ts',
    routes: [
      'GET /',
      'GET /catalog',
      'POST /',
      'GET /:id',
      'PATCH /:id',
      'POST /:id/materials/:materialId/consume',
      'POST /:id/complete',
      'DELETE /:id',
    ],
  },
  {
    tag: 'Clientes',
    basePath: '/api/customers',
    source: 'customers/routes/customer.routes.ts',
    routes: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'DELETE /:id'],
  },
  {
    tag: 'Proveedores',
    basePath: '/api/suppliers',
    source: 'suppliers/routes/supplier.routes.ts',
    routes: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'DELETE /:id'],
  },
  {
    tag: 'Agentes de aduana',
    basePath: '/api/customs-agents',
    source: 'customs-agents/routes/customs-agent.routes.ts',
    routes: ['GET /', 'POST /', 'GET /:id', 'PATCH /:id', 'DELETE /:id'],
  },
  {
    tag: 'Usuarios y permisos',
    basePath: '/api/users',
    source: 'users/routes/user.routes.ts',
    routes: [
      'GET /',
      'GET /catalog',
      'GET /audit',
      'POST /',
      'PATCH /:id',
      'DELETE /:id',
      'PUT /roles/:id/permissions',
    ],
  },
  {
    tag: 'Tipo de cambio',
    basePath: '/api/exchange-rates',
    source: 'exchange-rates/routes/exchange-rate.routes.ts',
    routes: ['GET /', 'GET /current', 'POST /', 'POST /refresh', 'PATCH /:id', 'DELETE /:id'],
  },
  {
    tag: 'Reportes',
    basePath: '/api/reports',
    source: 'reports/routes/report.routes.ts',
    routes: ['GET /dashboard', 'GET /stock', 'GET /movements', 'GET /purchases', 'GET /production'],
  },
]

const METHODS: Record<HttpMethod, string> = {
  GET: 'Consultar',
  POST: 'Registrar',
  PATCH: 'Actualizar',
  PUT: 'Actualizar',
  DELETE: 'Eliminar',
}

function operation(group: RouteGroup, method: HttpMethod, route: string) {
  const path = `${group.basePath}${route === '/' ? '' : route}`
  const parameters = [...path.matchAll(/:([A-Za-z][A-Za-z0-9_]*)/g)].map((match) => ({
    name: match[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }))
  const isLogin = path === '/api/auth/login'
  const hasBody = method === 'POST' || method === 'PATCH' || method === 'PUT'
  const upload = method === 'POST' && path.endsWith('/documents')
  const jsonSchema = isLogin
    ? {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      }
    : {
        type: 'object',
        additionalProperties: true,
        description:
          'Esquema detallado pendiente de documentar; consultar las validaciones del módulo.',
      }
  const requestBody = !hasBody
    ? undefined
    : {
        required: isLogin || upload,
        content: upload
          ? { 'application/pdf': { schema: { type: 'string', format: 'binary' } } }
          : { 'application/json': { schema: jsonSchema } },
      }
  return {
    tags: [group.tag],
    summary: `${METHODS[method]} ${route === '/' ? group.tag.toLowerCase() : route.replaceAll('/', ' ').replaceAll(':', '').trim()}`,
    operationId: `${method.toLowerCase()}_${path.replaceAll(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    security: isLogin ? [] : [{ bearerAuth: [] }],
    ...(parameters.length && { parameters }),
    ...(requestBody && { requestBody }),
    responses: {
      '200': { description: 'Operación completada' },
      '401': { description: 'Sesión requerida o inválida' },
      '403': { description: 'Permiso insuficiente' },
      '422': { description: 'Datos inválidos' },
      '500': { description: 'Error interno' },
    },
  }
}

export function createOpenApiDocument() {
  const paths: Record<string, Record<string, ReturnType<typeof operation>>> = {}
  for (const group of API_GROUPS) {
    for (const entry of group.routes) {
      const [method, route] = entry.split(' ') as [HttpMethod, string]
      const path = `${group.basePath}${route === '/' ? '' : route}`.replaceAll(
        /:([A-Za-z][A-Za-z0-9_]*)/g,
        '{$1}',
      )
      paths[path] ??= {}
      paths[path][method.toLowerCase()] = operation(group, method, route)
    }
  }
  paths['/health'] = {
    get: {
      ...operation({ tag: 'Sistema', basePath: '', source: '', routes: [] }, 'GET', '/health'),
      summary: 'Estado del servidor',
      security: [],
    },
  }
  paths['/internal/performance'] = {
    get: {
      ...operation(
        { tag: 'Observabilidad', basePath: '/internal', source: '', routes: [] },
        'GET',
        '/performance',
      ),
      summary: 'Métricas HTTP por endpoint (administración global)',
    },
  }
  return {
    openapi: '3.0.3',
    info: {
      title: 'Europlate API (Express)',
      version: '1.0.0',
      description:
        'Inventario de rutas para pruebas y medición. Los cuerpos genéricos se precisarán módulo por módulo; Swagger no reemplaza las validaciones del servidor.',
    },
    servers: [{ url: '/', description: 'Servidor actual' }],
    tags: [
      ...API_GROUPS.map(({ tag }) => ({ name: tag })),
      { name: 'Sistema' },
      { name: 'Observabilidad' },
    ],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    paths,
  }
}
