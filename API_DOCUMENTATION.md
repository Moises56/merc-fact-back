# Documentación API - Sistema de Gestión de Facturas de Mercados Municipales

## Información General

- **URL Base**: `http://localhost:3000` (desarrollo) / `https://api.facturamercados.com` (producción)
- **Formato de Respuesta**: JSON
- **Autenticación**: JWT Bearer Token + HTTP-Only Cookies
- **Roles de Usuario**: ADMIN, MARKET, USER, AUDITOR

## Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {}, // Datos solicitados
  "message": "Mensaje descriptivo"
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": "Mensaje de error",
  "statusCode": 400,
  "errors": {
    "field": ["Lista de errores específicos"]
  }
}
```

---

## 🔐 AUTENTICACIÓN

### POST /api/auth/login
**Descripción**: Iniciar sesión en el sistema
**Autenticación**: No requerida
**Roles**: Público

#### Request Body
```json
{
  "correo": "mougrind@amdc.hn",     // Opcional (requerido si no hay username)
  "username": "mougrind",           // Opcional (requerido si no hay correo)
  "contrasena": "Asd.456@"          // Requerido, mínimo 6 caracteres
}
```

#### Respuestas
- **200 OK**: Inicio de sesión exitoso
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": "uuid",
    "correo": "mougrind@amdc.hn",
    "username": "mougrind",
    "nombre": "Mou",
    "apellido": "Grind",
    "role": "ADMIN"
  }
}
```
- **401 Unauthorized**: Credenciales inválidas

---

### POST /api/auth/refresh
**Descripción**: Actualizar token de acceso
**Autenticación**: Refresh Token (Cookie)
**Roles**: Autenticado

#### Respuestas
- **200 OK**: Token actualizado exitosamente
```json
{
  "message": "Token actualizado exitosamente"
}
```
- **401 Unauthorized**: Token de refresh inválido

---

### POST /api/auth/logout
**Descripción**: Cerrar sesión
**Autenticación**: No requerida
**Roles**: Público

#### Respuestas
- **200 OK**: Sesión cerrada exitosamente
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### POST /api/auth/change-password
**Descripción**: Cambiar contraseña del usuario
**Autenticación**: Bearer Token
**Roles**: Autenticado

#### Request Body
```json
{
  "currentPassword": "Asd.456@",      // Contraseña actual
  "newPassword": "NewPassword123@"    // Nueva contraseña, mínimo 6 caracteres
}
```

#### Respuestas
- **200 OK**: Contraseña cambiada exitosamente
- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: No autorizado

---

### POST /api/auth/profile
**Descripción**: Obtener perfil del usuario autenticado
**Autenticación**: Bearer Token
**Roles**: Autenticado

#### Respuestas
- **200 OK**: Perfil obtenido exitosamente
```json
{
  "user": {
    "id": "uuid",
    "correo": "mougrind@amdc.hn",
    "username": "mougrind",
    "nombre": "Mou",
    "apellido": "Grind",
    "role": "ADMIN",
    "telefono": "+51987654321",
    "dni": "12345678",
    "gerencia": "Desarrollo Económico Local",
    "numero_empleado": 11056,
    "ultimo_login": "2025-01-15T10:30:00.000Z",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```
- **401 Unauthorized**: No autorizado

---

## 👥 USUARIOS

### POST /api/users
**Descripción**: Crear nuevo usuario
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Request Body
```json
{
  "correo": "mougrind@amdc.hn",
  "nombre": "Mou",
  "apellido": "Grind",
  "contrasena": "Asd.456@",           // Mínimo 6 caracteres
  "telefono": "+51987654321",         // Opcional
  "dni": "12345678",
  "gerencia": "Desarrollo Económico Local",  // Opcional
  "numero_empleado": 11056,           // Opcional
  "role": "ADMIN",                    // Opcional, valores: USER, ADMIN, MARKET
  "username": "mougrind"              // Mínimo 3 caracteres
}
```

#### Respuestas
- **201 Created**: Usuario creado exitosamente
- **400 Bad Request**: Datos inválidos
- **409 Conflict**: El correo o DNI ya existe

---

### GET /api/users
**Descripción**: Obtener lista de usuarios con paginación
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Query Parameters
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)
- `role` (optional): Filtrar por rol (USER, ADMIN, MARKET)

#### Respuestas
- **200 OK**: Lista de usuarios obtenida exitosamente
```json
{
  "data": [
    {
      "id": "uuid",
      "correo": "mougrind@amdc.hn",
      "username": "mougrind",
      "nombre": "Mou",
      "apellido": "Grind",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/users/stats
**Descripción**: Obtener estadísticas de usuarios
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Estadísticas obtenidas exitosamente
```json
{
  "totalUsers": 10,
  "activeUsers": 8,
  "inactiveUsers": 2,
  "usersByRole": {
    "ADMIN": 2,
    "MARKET": 3,
    "USER": 5
  },
  "recentUsers": 3
}
```

---

### GET /api/users/:id
**Descripción**: Obtener usuario por ID
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Usuario encontrado
- **404 Not Found**: Usuario no encontrado

---

### PATCH /api/users/:id
**Descripción**: Actualizar usuario
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Request Body
```json
{
  "nombre": "Nuevo Nombre",           // Opcional
  "apellido": "Nuevo Apellido",       // Opcional
  "telefono": "+51987654321",         // Opcional
  "gerencia": "Nueva Gerencia",       // Opcional
  "isActive": true                    // Opcional
}
```

#### Respuestas
- **200 OK**: Usuario actualizado exitosamente
- **404 Not Found**: Usuario no encontrado
- **409 Conflict**: El correo o DNI ya existe

---

### DELETE /api/users/:id
**Descripción**: Desactivar usuario
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Usuario desactivado exitosamente
- **404 Not Found**: Usuario no encontrado

---

### PATCH /api/users/:id/activate
**Descripción**: Activar usuario
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Usuario activado exitosamente
- **404 Not Found**: Usuario no encontrado

---

## 🏪 MERCADOS

### POST /api/mercados
**Descripción**: Crear nuevo mercado
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Request Body
```json
{
  "nombre_mercado": "Mercado Central San Juan",
  "direccion": "Av. Principal 123, San Juan de Lurigancho",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "descripcion": "Mercado municipal con 150 puestos comerciales"  // Opcional
}
```

#### Respuestas
- **201 Created**: Mercado creado exitosamente
```json
{
  "message": "Mercado creado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "nombre_mercado": "Mercado Central San Juan",
    "direccion": "Av. Principal 123, San Juan de Lurigancho",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "descripcion": "Mercado municipal con 350 puestos comerciales",
    "isActive": true,
    "createdAt": "2025-06-04T16:33:19.097Z",
    "updatedAt": "2025-06-04T16:33:19.097Z",
    "_count": {
      "locales": 0
    }
  }
}
```
- **400 Bad Request**: Datos inválidos
- **409 Conflict**: Ya existe un mercado con ese nombre
```json
{
  "message": "No se puede crear el mercado",
  "error": "Ya existe un mercado con ese nombre",
  "statusCode": 409
}
```

---

### GET /api/mercados
**Descripción**: Obtener lista de mercados con paginación
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Query Parameters
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)
- `activo` (optional): Filtrar por estado activo (true/false)

#### Respuestas
- **200 OK**: Lista de mercados obtenida exitosamente
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre_mercado": "Mercado Central San Juan",
      "direccion": "Av. Principal 123",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "descripcion": "Mercado municipal",
      "isActive": true,
			"createdAt": "2025-06-04T21:12:46.550Z",
			"updatedAt": "2025-06-04T21:12:46.550Z",
			"_count": {
				"locales": 1
			}
    }
  ],
  "pagination": {
		"current_page": 1,
		"total_pages": 1,
		"total_items": 5,
		"items_per_page": 10
	}
}
```

---

### GET /api/mercados/stats
**Descripción**: Obtener estadísticas de mercados
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Estadísticas obtenidas exitosamente
```json
{
  "totalMercados": 5,
  "mercadosActivos": 4,
  "mercadosInactivos": 1,
  "totalLocales": 150,
  "localesOcupados": 120,
  "ingresosMensuales": 45000.00
}
```

---

### GET /api/mercados/:id
**Descripción**: Obtener mercado por ID
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Respuestas
- **200 OK**: Mercado encontrado
- **404 Not Found**: Mercado no encontrado

---

### PATCH /api/mercados/:id
**Descripción**: Actualizar mercado
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Request Body
```json
{
  "nombre_mercado": "Nuevo Nombre",   // Opcional
  "direccion": "Nueva Dirección",     // Opcional
  "latitud": -12.0500,               // Opcional
  "longitud": -77.0400,              // Opcional
  "descripcion": "Nueva descripción", // Opcional
  "activo": true                     // Opcional
}
```

#### Respuestas
- **200 OK**: Mercado actualizado exitosamente
```json
{
  "message": "Mercado actualizado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "nombre_mercado": "Mercado Central San Juan - Actualizado",
    "direccion": "Av. Principal 123, San Juan de Lurigancho - Actualizada",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "descripcion": "Mercado municipal con 350 puestos comerciales",
    "isActive": false,
    "createdAt": "2025-06-04T16:33:19.097Z",
    "updatedAt": "2025-06-04T16:40:35.772Z",
    "_count": {
      "locales": 0
    }
  }
}
```
- **404 Not Found**: Mercado no encontrado
```json
{
  "message": "Mercado no encontrado",
  "error": "El mercado solicitado no existe en el sistema",
  "statusCode": 404
}
```
- **409 Conflict**: Ya existe un mercado con ese nombre
```json
{
  "message": "No se puede actualizar el mercado",
  "error": "Ya existe un mercado con ese nombre",
  "statusCode": 409
}
```

---

### DELETE /api/mercados/:id
**Descripción**: Desactivar mercado
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Mercado desactivado exitosamente
- **404 Not Found**: Mercado no encontrado
- **409 Conflict**: No se puede eliminar un mercado con locales ocupados

---

### PATCH /api/mercados/:id/activate
**Descripción**: Activar mercado
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Mercado activado exitosamente
```json
{
  "message": "Mercado activado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "isActive": true
  }
}
```
- **404 Not Found**: Mercado no encontrado

---

### GET /api/mercados/:id/locales
**Descripción**: Obtener locales de un mercado específico
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Query Parameters
- `estado` (optional): Filtrar por estado del local (DISPONIBLE, OCUPADO, MANTENIMIENTO, PENDIENTE)
- `tipo` (optional): Filtrar por tipo del local

#### Respuestas
- **200 OK**: Locales del mercado obtenidos exitosamente
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre_local": "Carnicería La Esperanza",
      "numero_local": "A-001",
      "tipo_local": "COMIDA",
      "estado_local": "OCUPADO",
      "monto_mensual": 150.00,
      "propietario": "María García"
    }
  ]
}
```
- **404 Not Found**: Mercado no encontrado

---

## 🏬 LOCALES

### POST /api/locales
**Descripción**: Crear nuevo local comercial
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Request Body
```json
{
  "nombre_local": "Carnicería La Esperanza",         // Opcional
  "numero_local": "A-001",                           // Opcional
  "permiso_operacion": "PO-2024-001",               // Opcional
  "tipo_local": "COMIDA",                            // Opcional, valores: COMIDA, ROPA, TECNOLOGIA, SERVICIOS, OTROS
  "direccion_local": "Pasillo A, Puesto 1",         // Opcional
  "estado_local": "PENDIENTE",                       // Opcional, valores: DISPONIBLE, OCUPADO, MANTENIMIENTO, PENDIENTE
  "monto_mensual": 150.0,                           // Opcional
  "propietario": "María García",                     // Opcional
  "dni_propietario": "87654321",                     // Opcional
  "telefono": "+51987654321",                        // Opcional
  "email": "maria.garcia@email.com",                 // Opcional
  "latitud": -12.0464,                              // Opcional
  "longitud": -77.0428,                             // Opcional
  "mercadoId": "uuid-del-mercado"                   // Requerido
}
```

#### Respuestas
- **201 Created**: Local creado exitosamente
- **400 Bad Request**: Datos inválidos
- **409 Conflict**: Ya existe un local con ese número o permiso

---

### GET /api/locales
**Descripción**: Obtener lista de locales con paginación y filtros
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Query Parameters
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)
- `estado` (optional): Filtrar por estado (DISPONIBLE, OCUPADO, MANTENIMIENTO, PENDIENTE)
- `tipo` (optional): Filtrar por tipo (COMIDA, ROPA, TECNOLOGIA, SERVICIOS, OTROS)
- `mercadoId` (optional): Filtrar por mercado

#### Respuestas
- **200 OK**: Lista de locales obtenida exitosamente

---

### GET /api/locales/stats
**Descripción**: Obtener estadísticas de locales
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Estadísticas obtenidas exitosamente
```json
{
  "totalLocales": 150,
  "localesOcupados": 120,
  "localesDisponibles": 25,
  "localesMantenimiento": 5,
  "ingresosMensuales": 18000.00,
  "localesPorTipo": {
    "COMIDA": 80,
    "ROPA": 40,
    "SERVICIOS": 20,
    "OTROS": 10
  }
}
```

---

### GET /api/locales/:id
**Descripción**: Obtener un local por ID
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Respuestas
- **200 OK**: Local encontrado
- **404 Not Found**: Local no encontrado

---

### GET /api/locales/:id/facturas
**Descripción**: Obtener facturas de un local específico
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Query Parameters
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)

#### Respuestas
- **200 OK**: Facturas del local obtenidas exitosamente
- **404 Not Found**: Local no encontrado

---

### PATCH /api/locales/:id
**Descripción**: Actualizar un local
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Request Body
```json
{
  "nombre_local": "Nuevo Nombre",     // Opcional
  "monto_mensual": 200.00,           // Opcional
  "propietario": "Nuevo Propietario", // Opcional
  "telefono": "+51987654321"         // Opcional
}
```

#### Respuestas
- **200 OK**: Local actualizado exitosamente
- **404 Not Found**: Local no encontrado
- **409 Conflict**: Conflicto con número de local o permiso

---

### PATCH /api/locales/:id/activate
**Descripción**: Activar un local
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Local activado exitosamente
- **404 Not Found**: Local no encontrado

---

### PATCH /api/locales/:id/deactivate
**Descripción**: Desactivar un local
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Local desactivado exitosamente
- **404 Not Found**: Local no encontrado

---

### PATCH /api/locales/:id/suspend
**Descripción**: Suspender un local
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Local suspendido exitosamente
- **404 Not Found**: Local no encontrado

---

### DELETE /api/locales/:id
**Descripción**: Eliminar un local
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Local eliminado exitosamente
- **404 Not Found**: Local no encontrado
- **409 Conflict**: No se puede eliminar: tiene facturas asociadas

---

## 🧾 FACTURAS

### POST /api/facturas
**Descripción**: Crear una nueva factura
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Request Body
```json
{
  "concepto": "Cuota mensual Enero 2025",
  "mes": "2025-01",                   // Formato YYYY-MM
  "anio": 2025,
  "monto": 150.0,
  "estado": "PENDIENTE",              // Opcional, valores: PENDIENTE, PAGADA, VENCIDA, ANULADA
  "fecha_vencimiento": "2025-02-15T00:00:00.000Z",
  "fecha_pago": "2025-01-20T00:00:00.000Z",          // Opcional
  "observaciones": "Factura generada automáticamente", // Opcional
  "localId": "uuid-del-local",
  "createdByUserId": "uuid-del-usuario"
}
```

#### Respuestas
- **201 Created**: Factura creada exitosamente
- **400 Bad Request**: Datos inválidos
- **409 Conflict**: Ya existe una factura para este local/mes/año

---

### GET /api/facturas
**Descripción**: Obtener lista de facturas con paginación
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Query Parameters
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)
- `estado` (optional): Filtrar por estado (PENDIENTE, PAGADA, VENCIDA, ANULADA)
- `localId` (optional): Filtrar por local
- `mercadoId` (optional): Filtrar por mercado

#### Respuestas
- **200 OK**: Lista de facturas obtenida exitosamente
```json
{
  "data": [
    {
      "id": "uuid",
      "concepto": "Cuota mensual Enero 2025",
      "mes": "2025-01",
      "anio": 2025,
      "monto": 150.00,
      "estado": "PENDIENTE",
      "fecha_vencimiento": "2025-02-15T00:00:00.000Z",
      "localId": "uuid-del-local",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET /api/facturas/stats
**Descripción**: Obtener estadísticas de facturas
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Estadísticas obtenidas exitosamente
```json
{
  "totalFacturas": 500,
  "facturasPendientes": 150,
  "facturasPagadas": 300,
  "facturasVencidas": 45,
  "facturasAnuladas": 5,
  "montoTotalPendiente": 22500.00,
  "montoTotalRecaudado": 45000.00,
  "montoPromedioPorFactura": 150.00
}
```

---

### GET /api/facturas/:id
**Descripción**: Obtener una factura por ID
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET, USER

#### Respuestas
- **200 OK**: Factura encontrada
- **404 Not Found**: Factura no encontrada

---

### PATCH /api/facturas/:id
**Descripción**: Actualizar una factura
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Request Body
```json
{
  "concepto": "Nuevo concepto",       // Opcional
  "monto": 200.00,                   // Opcional
  "fecha_vencimiento": "2025-03-15T00:00:00.000Z", // Opcional
  "observaciones": "Nueva observación" // Opcional
}
```

#### Respuestas
- **200 OK**: Factura actualizada exitosamente
- **404 Not Found**: Factura no encontrada

---

### PATCH /api/facturas/:id/pay
**Descripción**: Marcar factura como pagada
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Respuestas
- **200 OK**: Factura marcada como pagada
- **400 Bad Request**: La factura ya está pagada
- **404 Not Found**: Factura no encontrada

---

### POST /api/facturas/massive
**Descripción**: Generar facturas masivas para un mercado
**Autenticación**: Bearer Token
**Roles**: ADMIN, MARKET

#### Request Body
```json
{
  "mercadoId": "uuid-del-mercado",
  "mes": "2025-02",                   // Formato YYYY-MM
  "anio": 2025
}
```

#### Respuestas
- **201 Created**: Facturas generadas exitosamente
```json
{
  "message": "Facturas generadas exitosamente",
  "generatedCount": 25,
  "totalAmount": 3750.00
}
```
- **400 Bad Request**: No hay locales activos en el mercado
- **409 Conflict**: Ya existen facturas para el período especificado

---

### DELETE /api/facturas/:id
**Descripción**: Eliminar una factura
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Respuestas
- **200 OK**: Factura eliminada exitosamente
- **404 Not Found**: Factura no encontrada

---

## 📋 AUDITORÍA

### POST /audit
**Descripción**: Crear registro de auditoría manual
**Autenticación**: Bearer Token
**Roles**: ADMIN

#### Request Body
```json
{
  "accion": "CREATE",                 // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  "tabla": "users",                   // users, mercados, locales, facturas
  "userId": "uuid-del-usuario",
  "registroId": "uuid-del-registro",  // Opcional
  "datosAntes": "{\"nombre\": \"Valor anterior\"}", // Opcional
  "datosDespues": "{\"nombre\": \"Valor nuevo\"}", // Opcional
  "ip": "192.168.1.1",              // Opcional
  "userAgent": "Mozilla/5.0..."      // Opcional
}
```

#### Respuestas
- **201 Created**: Registro de auditoría creado exitosamente
- **400 Bad Request**: Datos inválidos
- **403 Forbidden**: Acceso denegado

---

### GET /audit
**Descripción**: Obtener todos los registros de auditoría
**Autenticación**: Bearer Token
**Roles**: ADMIN, AUDITOR

#### Query Parameters
- `page` (optional): Número de página
- `limit` (optional): Elementos por página
- `accion` (optional): Filtrar por acción
- `tabla` (optional): Filtrar por tabla
- `userId` (optional): Filtrar por usuario
- `startDate` (optional): Fecha de inicio (ISO string)
- `endDate` (optional): Fecha de fin (ISO string)

#### Respuestas
- **200 OK**: Lista de registros de auditoría
```json
{
  "data": [
    {
      "id": "uuid",
      "accion": "CREATE",
      "tabla": "users",
      "userId": "uuid-del-usuario",
      "registroId": "uuid-del-registro",
      "datosAntes": null,
      "datosDespues": "{\"nombre\": \"Nuevo Usuario\"}",
      "ip": "192.168.1.1",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

### GET /audit/stats
**Descripción**: Obtener estadísticas de auditoría
**Autenticación**: Bearer Token
**Roles**: ADMIN, AUDITOR

#### Respuestas
- **200 OK**: Estadísticas de auditoría
```json
{
  "totalRegistros": 1000,
  "registrosHoy": 25,
  "registrosSemana": 150,
  "accionesPorTipo": {
    "CREATE": 400,
    "UPDATE": 350,
    "DELETE": 100,
    "LOGIN": 150
  },
  "usuariosMasActivos": [
    {
      "userId": "uuid",
      "username": "admin",
      "totalAcciones": 50
    }
  ]
}
```

---

### GET /audit/user/:userId
**Descripción**: Obtener registros de auditoría por usuario
**Autenticación**: Bearer Token
**Roles**: ADMIN, AUDITOR

#### Query Parameters
- `page` (optional): Número de página
- `limit` (optional): Elementos por página

#### Respuestas
- **200 OK**: Registros de auditoría del usuario

---

### GET /audit/:id
**Descripción**: Obtener registro de auditoría específico
**Autenticación**: Bearer Token
**Roles**: ADMIN, AUDITOR

#### Respuestas
- **200 OK**: Registro de auditoría encontrado
- **404 Not Found**: Registro no encontrado

---

## 📊 CÓDIGOS DE ERROR COMUNES

### 400 Bad Request
- Datos de entrada inválidos
- Parámetros requeridos faltantes
- Formato de datos incorrecto

### 401 Unauthorized
- Token de acceso inválido o expirado
- Credenciales de login incorrectas
- No se proporcionó token de autenticación

### 403 Forbidden
- Usuario sin permisos suficientes para la operación
- Rol de usuario insuficiente

### 404 Not Found
- Recurso no encontrado
- Endpoint no existe
- ID de entidad no válido

### 409 Conflict
- Datos únicos duplicados (correo, DNI, username)
- Conflictos de integridad de datos
- Operación no permitida por estado actual

### 422 Unprocessable Entity
- Errores de validación específicos
- Datos con formato correcto pero valores inválidos

### 500 Internal Server Error
- Error interno del servidor
- Error de base de datos
- Error no controlado

---

## 🔒 CONTROL DE ACCESO POR ROLES

### ADMIN
- Acceso completo a todos los endpoints
- Gestión de usuarios, mercados, locales y facturas
- Acceso a auditoría y estadísticas
- Operaciones de eliminación y activación/desactivación

### MARKET
- Gestión de locales y facturas
- Consulta de mercados y estadísticas limitadas
- No puede gestionar usuarios ni operaciones críticas

### USER
- Consulta de información básica
- Gestión limitada de facturas
- Sin acceso a operaciones administrativas

### AUDITOR
- Acceso de solo lectura a registros de auditoría
- Consulta de estadísticas de auditoría
- Sin acceso a operaciones de modificación

---

## 📝 NOTAS IMPORTANTES

1. **Autenticación**: Todos los endpoints protegidos requieren un token JWT válido en el header `Authorization: Bearer <token>`
2. **Paginación**: Los endpoints que devuelven listas incluyen información de paginación
3. **Filtros**: Muchos endpoints GET soportan parámetros de consulta para filtrado
4. **Validación**: Todos los datos de entrada son validados según las reglas de negocio
5. **Auditoría**: Las operaciones importantes son registradas automáticamente en el sistema de auditoría
6. **Cookies**: El sistema utiliza HTTP-only cookies para mayor seguridad en la autenticación
7. **CORS**: Configurado para permitir credenciales en requests cross-origin

---

## 🛠️ EJEMPLOS DE USO

### Flujo de Autenticación Completo
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@admin.com","contrasena":"123456"}'

# 2. Usar token en headers subsecuentes
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token_recibido>"

# 3. Refresh token cuando expire
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "refresh_token=<refresh_token>"

# 4. Logout
curl -X POST http://localhost:3000/api/auth/logout
```

### Creación de Entidades Relacionadas
```bash
# 1. Crear mercado
curl -X POST http://localhost:3000/api/mercados \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre_mercado":"Mercado Central","direccion":"Av. Principal 123","latitud":-12.0464,"longitud":-77.0428}'

# 2. Crear local en el mercado
curl -X POST http://localhost:3000/api/locales \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre_local":"Carnicería La Esperanza","numero_local":"A-001","tipo_local":"COMIDA","mercadoId":"<mercado_id>"}'

# 3. Generar facturas masivas
curl -X POST http://localhost:3000/api/facturas/massive \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mercadoId":"<mercado_id>","mes":"2025-02","anio":2025}'
```

Esta documentación cubre todos los endpoints disponibles en el sistema de gestión de facturas de mercados municipales. Para más información o actualizaciones, consulte el código fuente o contacte al equipo de desarrollo.
