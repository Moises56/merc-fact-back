/**
 * GUÍA COMPLETA PARA PROBAR ENDPOINTS DE AUDITORÍA EN POSTMAN
 * Análisis detallado de cada endpoint con ejemplos y respuestas esperadas
 */

// ==============================================================================
// 🔐 CONFIGURACIÓN INICIAL PARA POSTMAN
// ==============================================================================

console.log(`
📋 CONFIGURACIÓN INICIAL REQUERIDA:

1. BASE URL: http://localhost:3000
2. AUTENTICACIÓN: Todos los endpoints requieren JWT cookie
3. HEADERS NECESARIOS:
   - Content-Type: application/json
   - Cookie: auth-token=JWT_TOKEN_HERE

🔑 PASOS PARA OBTENER TOKEN DE AUTENTICACIÓN:
1. POST /api/auth/login con credenciales válidas
2. Copiar el token del header "Set-Cookie" en la respuesta
3. Usar ese token en todos los endpoints de auditoría

════════════════════════════════════════════════════════════════════════════════
`);

// ==============================================================================
// 📊 ANÁLISIS DETALLADO DE CADA ENDPOINT
// ==============================================================================

const auditEndpoints = [
  {
    id: 1,
    method: 'POST',
    endpoint: '/api/audit',
    title: 'Crear Log de Auditoría Manual',
    description: 'Permite crear un registro de auditoría manualmente',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    body: {
      accion: 'CREATE',
      tabla: 'users',
      registroId: 'uuid-del-registro-opcional',
      datosAntes: null,
      datosDespues: {
        name: 'Nuevo Usuario',
        email: 'test@example.com'
      },
      ip: '192.168.1.100',
      userAgent: 'PostmanRuntime/7.29.0'
    },
    expectedResponse: {
      status: 201,
      body: {
        id: 'uuid-generado',
        accion: 'CREATE',
        tabla: 'users',
        userId: 'uuid-del-usuario-autenticado',
        registroId: 'uuid-del-registro-opcional',
        datosAntes: null,
        datosDespues: '{"name":"Nuevo Usuario","email":"test@example.com"}',
        ip: '192.168.1.100',
        userAgent: 'PostmanRuntime/7.29.0',
        createdAt: '2025-07-15T16:30:00.000Z'
      }
    },
    notes: [
      'El userId se obtiene automáticamente del token JWT',
      'Los campos datosAntes y datosDespues se serializan a JSON',
      'El registroId es opcional',
      'IP y userAgent se pueden obtener automáticamente del request'
    ]
  },

  {
    id: 2,
    method: 'GET',
    endpoint: '/api/audit/logs',
    title: 'Obtener Todos los Logs de Auditoría',
    description: 'Recupera todos los logs con filtros y paginación',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    queryParams: {
      page: 1,
      limit: 10,
      accion: 'LOGIN',
      tabla: 'users',
      userId: 'uuid-del-usuario',
      startDate: '2025-07-01T00:00:00.000Z',
      endDate: '2025-07-15T23:59:59.999Z'
    },
    url_examples: [
      'GET /api/audit/logs',
      'GET /api/audit/logs?page=1&limit=5',
      'GET /api/audit/logs?accion=LOGIN',
      'GET /api/audit/logs?tabla=users',
      'GET /api/audit/logs?userId=f199d049-f069-4a94-9ab3-5cd9fcac0c03',
      'GET /api/audit/logs?startDate=2025-07-01&endDate=2025-07-15',
      'GET /api/audit/logs?accion=CHANGE_PASSWORD&tabla=users&page=1&limit=20'
    ],
    expectedResponse: {
      status: 200,
      body: {
        data: [
          {
            id: 'uuid-del-log',
            accion: 'LOGIN',
            tabla: 'auth',
            userId: 'uuid-del-usuario',
            registroId: null,
            datosAntes: null,
            datosDespues: '{"username":"admin","success":true}',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0...',
            createdAt: '2025-07-15T16:25:00.000Z',
            user: {
              id: 'uuid-del-usuario',
              username: 'admin',
              nombre: 'Administrador'
            }
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 5,
          total_items: 50,
          items_per_page: 10,
          has_next: true,
          has_previous: false
        }
      }
    },
    notes: [
      'Todos los parámetros de query son opcionales',
      'Paginación por defecto: page=1, limit=10',
      'Fechas en formato ISO 8601',
      'Incluye información del usuario que realizó la acción'
    ]
  },

  {
    id: 3,
    method: 'GET',
    endpoint: '/api/audit/stats',
    title: 'Obtener Estadísticas de Auditoría',
    description: 'Recupera estadísticas resumidas del sistema de auditoría',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    url_examples: [
      'GET /api/audit/stats'
    ],
    expectedResponse: {
      status: 200,
      body: {
        totalLogs: 1250,
        actionStats: {
          LOGIN: 450,
          LOGOUT: 420,
          CREATE: 150,
          UPDATE: 180,
          DELETE: 50
        },
        tableStats: {
          auth: 870,
          users: 200,
          mercados: 100,
          locales: 80
        },
        userStats: {
          'f199d049-f069-4a94-9ab3-5cd9fcac0c03': 500,
          'de34d9b7-0a00-4c5d-9162-36e92141f6ad': 300,
          '12a80042-1550-4f3c-9218-668709194351': 450
        },
        recentActivity: [
          {
            accion: 'LOGIN',
            count: 25,
            lastOccurrence: '2025-07-15T16:30:00.000Z'
          }
        ],
        periodStats: {
          today: 45,
          thisWeek: 320,
          thisMonth: 1250
        }
      }
    },
    notes: [
      'No requiere parámetros',
      'Proporciona un resumen completo de la actividad',
      'Útil para dashboards y monitoreo',
      'Incluye estadísticas por acción, tabla y usuario'
    ]
  },

  {
    id: 4,
    method: 'GET',
    endpoint: '/api/audit/users/:userId',
    title: 'Obtener Logs por Usuario Específico',
    description: 'Recupera todos los logs de auditoría de un usuario específico',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    pathParams: {
      userId: 'f199d049-f069-4a94-9ab3-5cd9fcac0c03'
    },
    queryParams: {
      page: 1,
      limit: 10
    },
    url_examples: [
      'GET /api/audit/users/f199d049-f069-4a94-9ab3-5cd9fcac0c03',
      'GET /api/audit/users/f199d049-f069-4a94-9ab3-5cd9fcac0c03?page=2&limit=20'
    ],
    expectedResponse: {
      status: 200,
      body: {
        data: [
          {
            id: 'uuid-del-log',
            accion: 'LOGIN',
            tabla: 'auth',
            userId: 'f199d049-f069-4a94-9ab3-5cd9fcac0c03',
            registroId: null,
            datosAntes: null,
            datosDespues: '{"username":"mougrind","loginTime":"2025-07-15T16:25:00.000Z"}',
            ip: '127.0.0.1',
            userAgent: 'Mozilla/5.0...',
            createdAt: '2025-07-15T16:25:00.000Z',
            user: {
              id: 'f199d049-f069-4a94-9ab3-5cd9fcac0c03',
              username: 'mougrind',
              nombre: 'Mou'
            }
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 3,
          total_items: 25,
          items_per_page: 10
        },
        userSummary: {
          totalActions: 25,
          mostCommonAction: 'LOGIN',
          firstActivity: '2025-06-01T10:00:00.000Z',
          lastActivity: '2025-07-15T16:25:00.000Z'
        }
      }
    },
    notes: [
      'Requiere UUID válido del usuario',
      'Incluye resumen de actividad del usuario',
      'Soporta paginación',
      'Útil para auditorías específicas de usuario'
    ]
  },

  {
    id: 5,
    method: 'GET',
    endpoint: '/api/audit/entities/:entityType',
    title: 'Obtener Logs por Tipo de Entidad',
    description: 'Recupera logs de auditoría filtrados por tipo de entidad/tabla',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    pathParams: {
      entityType: 'users'
    },
    queryParams: {
      page: 1,
      limit: 10
    },
    url_examples: [
      'GET /api/audit/entities/users',
      'GET /api/audit/entities/mercados',
      'GET /api/audit/entities/facturas',
      'GET /api/audit/entities/auth',
      'GET /api/audit/entities/users?page=2&limit=15'
    ],
    expectedResponse: {
      status: 200,
      body: {
        data: [
          {
            id: 'uuid-del-log',
            accion: 'CREATE',
            tabla: 'users',
            userId: 'uuid-del-admin',
            registroId: 'uuid-del-usuario-creado',
            datosAntes: null,
            datosDespues: '{"username":"newuser","email":"new@example.com"}',
            ip: '192.168.1.100',
            userAgent: 'PostmanRuntime/7.29.0',
            createdAt: '2025-07-15T16:20:00.000Z',
            user: {
              id: 'uuid-del-admin',
              username: 'admin',
              nombre: 'Administrador'
            }
          }
        ],
        pagination: {
          current_page: 1,
          total_pages: 8,
          total_items: 75,
          items_per_page: 10
        },
        entitySummary: {
          entityType: 'users',
          totalLogs: 75,
          actionBreakdown: {
            CREATE: 20,
            UPDATE: 35,
            DELETE: 10,
            CHANGE_PASSWORD: 10
          },
          mostActiveUser: {
            userId: 'uuid-del-admin',
            username: 'admin',
            actionCount: 45
          }
        }
      }
    },
    notes: [
      'Tipos de entidad válidos: users, mercados, locales, facturas, auth',
      'Incluye resumen de actividad por entidad',
      'Muestra desglose de acciones por tipo',
      'Identifica el usuario más activo en esa entidad'
    ]
  },

  {
    id: 6,
    method: 'GET',
    endpoint: '/api/audit/logs/:id',
    title: 'Obtener Log Específico por ID',
    description: 'Recupera un log de auditoría específico con todos sus detalles',
    authRequired: true,
    roles: ['ADMIN', 'USER', 'MARKET'],
    headers: {
      'Cookie': 'auth-token=YOUR_JWT_TOKEN'
    },
    pathParams: {
      id: 'uuid-del-log-específico'
    },
    url_examples: [
      'GET /api/audit/logs/a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    ],
    expectedResponse: {
      status: 200,
      body: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        accion: 'UPDATE',
        tabla: 'users',
        userId: 'f199d049-f069-4a94-9ab3-5cd9fcac0c03',
        registroId: 'de34d9b7-0a00-4c5d-9162-36e92141f6ad',
        datosAntes: '{"nombre":"Nombre Anterior","telefono":"555-0000"}',
        datosDespues: '{"nombre":"Nombre Nuevo","telefono":"555-1111"}',
        ip: '192.168.1.150',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: '2025-07-15T15:45:30.000Z',
        user: {
          id: 'f199d049-f069-4a94-9ab3-5cd9fcac0c03',
          username: 'mougrind',
          nombre: 'Mou',
          apellido: 'Grind',
          email: 'mougrind@amdc.hn',
          role: 'ADMIN'
        },
        relatedLogs: [
          {
            id: 'uuid-otro-log',
            accion: 'VIEW',
            createdAt: '2025-07-15T15:44:00.000Z'
          }
        ],
        changes: {
          nombre: {
            before: 'Nombre Anterior',
            after: 'Nombre Nuevo'
          },
          telefono: {
            before: '555-0000',
            after: '555-1111'
          }
        }
      }
    },
    errorResponses: [
      {
        status: 404,
        body: {
          message: 'Audit log not found',
          error: 'Not Found',
          statusCode: 404
        }
      }
    ],
    notes: [
      'Requiere UUID válido del log',
      'Muestra información completa del usuario',
      'Incluye logs relacionados si existen',
      'Proporciona análisis de cambios para acciones UPDATE',
      'Retorna 404 si el log no existe'
    ]
  }
];

// ==============================================================================
// 📝 EJEMPLOS PRÁCTICOS PARA POSTMAN
// ==============================================================================

console.log(`
🧪 EJEMPLOS PRÁCTICOS PARA TESTING EN POSTMAN:

═══════════════════════════════════════════════════════════════════════════════
1️⃣ CONFIGURAR AUTENTICACIÓN GLOBAL
═══════════════════════════════════════════════════════════════════════════════

1. Crear una nueva Collection en Postman
2. En la pestaña "Authorization", seleccionar "No Auth" 
3. En la pestaña "Pre-request Script", agregar:

// Script para autenticación automática
pm.sendRequest({
    url: 'http://localhost:3000/api/auth/login',
    method: 'POST',
    header: {
        'Content-Type': 'application/json'
    },
    body: {
        mode: 'raw',
        raw: JSON.stringify({
            "username": "mougrind",
            "contrasena": "@Asd.456@"
        })
    }
}, function (err, response) {
    if (err) {
        console.log('Error en login:', err);
    } else {
        const cookies = response.headers.get('Set-Cookie');
        if (cookies) {
            const authCookie = cookies.split(';')[0];
            pm.globals.set('authCookie', authCookie);
        }
    }
});

4. En cada request, agregar Header:
   Key: Cookie
   Value: {{authCookie}}

═══════════════════════════════════════════════════════════════════════════════
2️⃣ SEQUENCE DE TESTING RECOMENDADA
═══════════════════════════════════════════════════════════════════════════════

🔸 Paso 1: Login para obtener token
POST http://localhost:3000/api/auth/login
{
  "username": "mougrind",
  "contrasena": "@Asd.456@"
}

🔸 Paso 2: Crear log manual
POST http://localhost:3000/api/audit
{
  "accion": "TEST_CREATE",
  "tabla": "users",
  "registroId": "test-123",
  "datosDespues": {"test": "data"}
}

🔸 Paso 3: Ver estadísticas generales
GET http://localhost:3000/api/audit/stats

🔸 Paso 4: Listar logs recientes
GET http://localhost:3000/api/audit/logs?limit=5

🔸 Paso 5: Filtrar logs por acción
GET http://localhost:3000/api/audit/logs?accion=LOGIN

🔸 Paso 6: Ver logs de usuario específico
GET http://localhost:3000/api/audit/users/f199d049-f069-4a94-9ab3-5cd9fcac0c03

🔸 Paso 7: Ver logs por entidad
GET http://localhost:3000/api/audit/entities/auth

🔸 Paso 8: Ver log específico (usar ID de paso 4)
GET http://localhost:3000/api/audit/logs/{ID_FROM_STEP_4}

═══════════════════════════════════════════════════════════════════════════════
3️⃣ CASOS DE ERROR COMUNES PARA PROBAR
═══════════════════════════════════════════════════════════════════════════════

🔸 Sin autenticación:
GET http://localhost:3000/api/audit/logs
(sin header Cookie)
Expect: 401 Unauthorized

🔸 ID inválido:
GET http://localhost:3000/api/audit/logs/invalid-uuid
Expect: 400 Bad Request

🔸 Log no encontrado:
GET http://localhost:3000/api/audit/logs/00000000-0000-0000-0000-000000000000
Expect: 404 Not Found

🔸 Entidad inválida:
GET http://localhost:3000/api/audit/entities/invalid-table
Expect: Resultados vacíos

🔸 Parámetros de paginación inválidos:
GET http://localhost:3000/api/audit/logs?page=-1&limit=0
Expect: Error de validación

═══════════════════════════════════════════════════════════════════════════════
`);

// Mostrar cada endpoint en detalle
auditEndpoints.forEach((endpoint, index) => {
  console.log(`
${'═'.repeat(80)}
${endpoint.id}️⃣ ${endpoint.method} ${endpoint.endpoint}
${'═'.repeat(80)}

📋 ${endpoint.title}
📖 ${endpoint.description}

🔐 AUTENTICACIÓN: ${endpoint.authRequired ? '✅ Requerida' : '❌ No requerida'}
👥 ROLES: ${endpoint.roles ? endpoint.roles.join(', ') : 'Todos'}

📤 CONFIGURACIÓN DEL REQUEST:
${endpoint.method} ${endpoint.endpoint}

🔑 HEADERS:
${Object.entries(endpoint.headers || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}

${endpoint.pathParams ? `🎯 PATH PARAMETERS:
${Object.entries(endpoint.pathParams).map(([key, value]) => `${key}: ${value}`).join('\n')}` : ''}

${endpoint.queryParams ? `🔍 QUERY PARAMETERS (Opcionales):
${Object.entries(endpoint.queryParams).map(([key, value]) => `${key}: ${value}`).join('\n')}` : ''}

${endpoint.body ? `📦 BODY (JSON):
${JSON.stringify(endpoint.body, null, 2)}` : ''}

🌐 EJEMPLOS DE URL:
${endpoint.url_examples.map(url => `• ${url}`).join('\n')}

✅ RESPUESTA EXITOSA (${endpoint.expectedResponse.status}):
${JSON.stringify(endpoint.expectedResponse.body, null, 2)}

${endpoint.errorResponses ? `❌ RESPUESTAS DE ERROR:
${endpoint.errorResponses.map(err => `Status ${err.status}:
${JSON.stringify(err.body, null, 2)}`).join('\n\n')}` : ''}

📝 NOTAS IMPORTANTES:
${endpoint.notes.map(note => `• ${note}`).join('\n')}
  `);
});

console.log(`
${'═'.repeat(80)}
🎯 RESUMEN DE ENDPOINTS DE AUDITORÍA
${'═'.repeat(80)}

📊 TOTAL DE ENDPOINTS: ${auditEndpoints.length}

📋 LISTA RÁPIDA:
${auditEndpoints.map(ep => `${ep.id}. ${ep.method} ${ep.endpoint} - ${ep.title}`).join('\n')}

🔒 TODOS LOS ENDPOINTS REQUIEREN AUTENTICACIÓN JWT

🚀 ¡LISTO PARA PROBAR EN POSTMAN!
${'═'.repeat(80)}
`);
