# Sistema de Logs y Estadísticas de Usuarios - Documentación Completa

## 📋 Resumen del Sistema

El sistema implementado incluye:

1. **Nuevo rol USER-ADMIN**: Acceso limitado solo a consultas EC/ICS
2. **Sistema de logging automático**: Registra todas las consultas con detalles completos
3. **Estadísticas de usuario**: Agregaciones por usuario, tipo de consulta y ubicación
4. **Endpoints autenticados**: Versiones seguras de las consultas con logging automático
5. **Control de acceso basado en roles**: Diferentes niveles de acceso según el rol

## 🛠️ Cambios Implementados

### 1. Base de Datos (Prisma Schema)

```prisma
// Nuevo rol agregado
enum Role {
  ADMIN
  USER
  USER-ADMIN  // 🆕 Acceso limitado a consultas EC/ICS
}

// Nueva tabla para logs de consulta
model ConsultaLog {
  id                Int      @id @default(autoincrement())
  userId            Int
  consultaType      String   // "EC" o "ICS"
  consultaSubtype   String   // "normal" o "amnistia"
  parametros        Json
  resultado         String   // "SUCCESS", "NOT_FOUND", "ERROR"
  totalEncontrado   Float?
  errorMessage      String?
  ip                String?
  userAgent         String?
  duracionMs        Int?
  createdAt         DateTime @default(now())
  user              User     @relation(fields: [userId], references: [id])
}

// Nueva tabla para ubicaciones de usuario
model UserLocation {
  id           Int      @id @default(autoincrement())
  userId       Int
  locationName String
  locationCode String
  description  String?
  isActive     Boolean  @default(true)
  assignedBy   Int?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])
  assignedByUser User?  @relation("UserLocationAssignedBy", fields: [assignedBy], references: [id])
  
  @@unique([userId, isActive], name: "userId_isActive")
}
```

### 2. Módulo UserStats

#### DTOs:
- `CreateUserLocationDto`: Para asignar ubicaciones
- `UserStatsResponseDto`: Respuesta de estadísticas de usuario
- `AllUsersStatsResponseDto`: Estadísticas globales (solo ADMIN)
- `ConsultaLogResponseDto`: Logs de consulta con paginación

#### Servicios:
- `UserStatsService`: Lógica de negocio para estadísticas y logs
- `UserStatsSeederService`: Datos de prueba y usuarios iniciales

#### Controlador:
- `GET /user-stats/my-stats`: Estadísticas del usuario actual
- `GET /user-stats/all-users-stats`: Estadísticas de todos los usuarios (solo ADMIN)
- `GET /user-stats/consulta-logs`: Logs de consulta con filtros (solo ADMIN)
- `POST /user-stats/assign-location/:userId`: Asignar ubicación (solo ADMIN)

### 3. Interceptor de Logging

```typescript
@Injectable()
export class ConsultaLogInterceptor implements NestInterceptor {
  // Registra automáticamente todas las consultas EC/ICS
  // Captura: parámetros, resultado, duración, IP, user agent
}
```

### 4. Endpoints Autenticados

#### Consulta EC:
- `POST /consultaEC/auth`: Consulta normal con autenticación
- `POST /consultaEC/auth/amnistia`: Consulta amnistía con autenticación

#### Consulta ICS:
- `POST /consultaICS/auth`: Consulta normal con autenticación
- `POST /consultaICS/auth/amnistia`: Consulta amnistía con autenticación

## 🚀 Instrucciones de Uso

### 1. Aplicar Migración de Base de Datos

```bash
# Aplicar los cambios de schema
npm run prisma:migrate

# O manualmente
npx prisma migrate dev --name add-user-admin-logging-system
```

### 2. Ejecutar Seed de Datos

```bash
# Crear usuarios USER-ADMIN y datos de prueba
npm run seed:user-admin
```

Esto creará:
- 1 usuario USER-ADMIN (`useradmin` / `admin123`)
- 4 usuarios USER con ubicaciones asignadas
- 50 logs de consulta de ejemplo

### 3. Probar el Sistema

```bash
# Ejecutar tests completos
node test-user-stats-system.js

# O probar manualmente con los endpoints
```

### 4. Usuarios de Prueba Creados

| Usuario | Contraseña | Rol | Acceso |
|---------|------------|-----|---------|
| `useradmin` | `admin123` | USER-ADMIN | Solo consultas EC/ICS |
| `jperez` | `admin123` | USER | Consultas + estadísticas propias |
| `mrodriguez` | `admin123` | USER | Consultas + estadísticas propias |
| `cmartinez` | `admin123` | USER | Consultas + estadísticas propias |
| `agarcia` | `admin123` | USER | Consultas + estadísticas propias |

## 📊 Funcionalidades por Rol

### ADMIN
- ✅ Acceso completo a todas las funciones
- ✅ Ver estadísticas de todos los usuarios
- ✅ Ver todos los logs de consulta
- ✅ Asignar ubicaciones a usuarios
- ✅ Realizar consultas EC/ICS

### USER-ADMIN
- ✅ Realizar consultas EC/ICS autenticadas
- ✅ Ver sus propias estadísticas
- ❌ No puede ver estadísticas de otros usuarios
- ❌ No puede ver logs globales
- ❌ No puede asignar ubicaciones

### USER
- ✅ Realizar consultas EC/ICS autenticadas
- ✅ Ver sus propias estadísticas
- ❌ No puede ver estadísticas de otros usuarios
- ❌ No puede ver logs globales
- ❌ No puede asignar ubicaciones

## 🔍 Endpoints de Estadísticas

### Mis Estadísticas (Todos los roles autenticados)
```http
GET /user-stats/my-stats
Authorization: Bearer <token>

Response:
{
  "userId": 1,
  "username": "jperez",
  "totalConsultas": 25,
  "consultasEC": 15,
  "consultasICS": 10,
  "consultasExitosas": 20,
  "consultasFallidas": 5,
  "ubicacionActual": {
    "locationName": "Mall Multiplaza",
    "locationCode": "MULT_001"
  },
  "estadisticasPorTipo": [...],
  "actividadReciente": [...]
}
```

### Todas las Estadísticas (Solo ADMIN)
```http
GET /user-stats/all-users-stats
Authorization: Bearer <admin-token>

Response:
{
  "totalUsuarios": 4,
  "totalConsultas": 100,
  "estadisticasGenerales": {...},
  "usuariosMasActivos": [...],
  "estadisticasPorUbicacion": [...]
}
```

### Logs de Consulta (Solo ADMIN)
```http
GET /user-stats/consulta-logs?page=1&limit=10&userId=1&consultaType=EC
Authorization: Bearer <admin-token>

Response:
{
  "logs": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## 🔐 Autenticación y Logging

### Flow de Consulta con Logging:

1. Usuario hace login → Recibe JWT token
2. Usuario llama endpoint `/consultaEC/auth` o `/consultaICS/auth`
3. El interceptor `ConsultaLogInterceptor` captura automáticamente:
   - Parámetros de la consulta
   - Resultado (éxito/error)
   - Duración de la consulta
   - IP del usuario
   - User Agent
   - Timestamp
4. Log se guarda en tabla `ConsultaLog`
5. Estadísticas se actualizan automáticamente

## 📈 Métricas Capturadas

- **Por Usuario**: Total de consultas, tipos, éxitos/fallos
- **Por Ubicación**: Actividad por oficina/ubicación
- **Por Tipo de Consulta**: EC vs ICS, normal vs amnistía
- **Tendencias Temporales**: Actividad por día/hora
- **Performance**: Duración promedio de consultas
- **Errores**: Tipos de errores más comunes

## 🛡️ Seguridad

- JWT Authentication en todos los endpoints autenticados
- Role-based access control (RBAC)
- Logging automático de todas las actividades
- Validación de parámetros con DTOs
- Rate limiting en endpoints públicos
- Sanitización de datos sensibles en logs

## 🧪 Testing

El archivo `test-user-stats-system.js` incluye tests para:
- ✅ Autenticación de diferentes tipos de usuario
- ✅ Consultas con logging automático
- ✅ Estadísticas por rol
- ✅ Control de acceso basado en roles
- ✅ Restricciones USER-ADMIN

## 📝 Próximos Pasos Recomendados

1. **Dashboards**: Crear interfaz web para visualizar estadísticas
2. **Alertas**: Notificaciones por actividad inusual
3. **Reportes**: Exportación de estadísticas en Excel/PDF
4. **Auditoría**: Sistema de auditoría más detallado
5. **Cache**: Implementar cache para estadísticas frecuentes
6. **Monitoreo**: Métricas de performance y disponibilidad

## 🔧 Comandos Útiles

```bash
# Regenerar cliente Prisma
npx prisma generate

# Ver base de datos
npx prisma studio

# Reset completo de base de datos
npx prisma migrate reset

# Compilar proyecto
npm run build

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar tests
npm test

# Lint código
npm run lint
```
