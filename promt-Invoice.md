# PROMPT COMPLETO PARA DESARROLLO FRONTEND - SISTEMA DE FACTURACIÓN DE MERCADOS MUNICIPALES

## 📋 INFORMACIÓN DEL PROYECTO

**Tipo de Aplicación**: Sistema de Gestión de Facturas para Mercados Municipales  
**Plataformas**: Web (Panel Administrativo) + Móvil (Facturación de Campo)  
**Backend**: NestJS con Prisma y PostgreSQL (YA DESARROLLADO)  
**Frontend Requerido**: Angular 19 + Ionic + Tailwind CSS + Capacitor  

---

## 🛠 STACK TECNOLÓGICO FRONTEND REQUERIDO

- **Angular 19** (versión más reciente con standalone components)
- **Ionic Framework** (para aplicación híbrida web/móvil)
- **Tailwind CSS** (para estilos modernos y responsivos)
- **Capacitor** (para funcionalidades nativas móviles)
- **Plugin Bluetooth** (para impresión térmica en móvil)
- **TypeScript** (tipado fuerte obligatorio)
- **PWA** (Progressive Web App capabilities)

---

## 🔐 AUTENTICACIÓN Y SEGURIDAD

### Sistema de Autenticación
- **JWT Tokens** con HTTP-only cookies
- **BCrypt** para hash de contraseñas
- **NO usar localStorage** - solo HTTP-only cookies
- **Renovación automática** de tokens
- **Interceptores HTTP** para manejo automático de tokens

### Roles de Usuario
```typescript
enum Role {
  ADMIN = 'ADMIN',      // Acceso total al sistema
  MARKET = 'MARKET',    // Gestión de mercados específicos
  USER = 'USER',        // Operaciones básicas
  AUDITOR = 'AUDITOR'   // Solo lectura de auditoría
}
```

---

## 🌐 API BACKEND DISPONIBLE
**Base URL**: `http://localhost:3000/api`

---

## 🔐 MÓDULO DE AUTENTICACIÓN (/auth)

### 1. POST /auth/login
**Descripción**: Iniciar sesión de usuario  
**Headers**: `Content-Type: application/json`  
**Autenticación**: No requerida  

**Request Body**:
```typescript
{
  correo?: string;        // Opcional si se proporciona username
  username?: string;      // Opcional si se proporciona correo
  contrasena: string;     // Mínimo 6 caracteres
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Inicio de sesión exitoso",
  user: {
    id: string;
    correo: string;
    username: string;
    nombre: string;
    apellido: string;
    role: Role;
    telefono?: string;
    dni: string;
    gerencia?: string;
    numero_empleado?: number;
    lastLogin: Date;
    createdAt: Date;
  }
}
```

**Respuesta Error (401)**:
```typescript
{
  statusCode: 401,
  message: "Credenciales inválidas"
}
```

### 2. POST /auth/refresh
**Descripción**: Renovar token de acceso  
**Headers**: `Content-Type: application/json`  
**Autenticación**: Cookie refresh_token  

**Request Body**: Vacío (usa cookie)

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Token actualizado exitosamente"
}
```

**Respuesta Error (401)**:
```typescript
{
  statusCode: 401,
  message: "Token de refresh no encontrado"
}
```

### 3. POST /auth/logout
**Descripción**: Cerrar sesión  
**Headers**: `Content-Type: application/json`  
**Autenticación**: No requerida  

**Request Body**: Vacío

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Sesión cerrada exitosamente"
}
```

### 4. POST /auth/change-password
**Descripción**: Cambiar contraseña del usuario  
**Headers**: `Authorization: Bearer {token}`  
**Autenticación**: JWT requerido  

**Request Body**:
```typescript
{
  currentPassword: string;
  newPassword: string;        // Mínimo 6 caracteres
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Contraseña cambiada exitosamente"
}
```

**Respuesta Error (400)**:
```typescript
{
  statusCode: 400,
  message: "Contraseña actual incorrecta"
}
```

### 5. POST /auth/profile
**Descripción**: Obtener perfil del usuario autenticado  
**Headers**: `Authorization: Bearer {token}`  
**Autenticación**: JWT requerido  

**Request Body**: Vacío

**Respuesta Exitosa (200)**:
```typescript
{
  user: {
    id: string;
    correo: string;
    username: string;
    nombre: string;
    apellido: string;
    role: Role;
    telefono?: string;
    dni: string;
    gerencia?: string;
    numero_empleado?: number;
    ultimo_login?: Date;
    created_at: Date;
  }
}
```

---

## 👥 MÓDULO DE USUARIOS (/users)

### 1. GET /users
**Descripción**: Listar usuarios con paginación  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Query Parameters**:
```typescript
{
  page?: number;          // Página actual (default: 1)
  limit?: number;         // Elementos por página (default: 10)
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: User[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 2. GET /users/:id
**Descripción**: Obtener usuario por ID  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  id: string;
  correo: string;
  username: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Respuesta Error (404)**:
```typescript
{
  statusCode: 404,
  message: "Usuario no encontrado"
}
```

### 3. POST /users
**Descripción**: Crear nuevo usuario  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Request Body**:
```typescript
{
  correo: string;           // Email válido
  nombre: string;
  apellido: string;
  contrasena: string;       // Mínimo 6 caracteres
  telefono?: string;
  dni: string;
  gerencia?: string;
  numero_empleado?: number;
  role?: Role;              // Default: ADMIN
  username: string;         // Mínimo 3 caracteres, único
}
```

**Respuesta Exitosa (201)**:
```typescript
{
  message: "Usuario creado exitosamente",
  data: User
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "El correo o DNI ya existe"
}
```

### 4. PATCH /users/:id
**Descripción**: Actualizar usuario  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Request Body** (todos opcionales):
```typescript
{
  correo?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  dni?: string;
  gerencia?: string;
  numero_empleado?: number;
  role?: Role;
  username?: string;
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Usuario actualizado exitosamente",
  data: User
}
```

### 5. DELETE /users/:id
**Descripción**: Eliminar usuario  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Usuario eliminado exitosamente"
}
```

---

## 🏪 MÓDULO DE MERCADOS (/mercados)

### 1. GET /mercados
**Descripción**: Listar mercados con paginación  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Query Parameters**:
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 10
  activo?: boolean;       // Filtrar por estado activo
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: Mercado[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 2. GET /mercados/stats
**Descripción**: Obtener estadísticas de mercados  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  total_mercados: number;
  total_locales: number;
  locales_ocupados: number;
  locales_libres: number;
  ocupacion_percentage: number;
}
```

### 3. GET /mercados/:id
**Descripción**: Obtener mercado por ID  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Respuesta Exitosa (200)**:
```typescript
{
  id: string;
  nombre_mercado: string;
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  locales: Local[];
  _count: {
    locales: number;
  }
}
```

### 4. POST /mercados
**Descripción**: Crear nuevo mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Request Body**:
```typescript
{
  nombre_mercado: string;
  direccion: string;
  latitud: number;
  longitud: number;
  descripcion?: string;
}
```

**Respuesta Exitosa (201)**:
```typescript
{
  message: "Mercado creado exitosamente",
  data: Mercado
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "Ya existe un mercado con ese nombre"
}
```

### 5. PATCH /mercados/:id
**Descripción**: Actualizar mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Request Body** (todos opcionales):
```typescript
{
  nombre_mercado?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  descripcion?: string;
  activo?: boolean;         // Se mapea a isActive
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Mercado actualizado exitosamente",
  data: Mercado
}
```

### 6. DELETE /mercados/:id
**Descripción**: Desactivar mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Mercado desactivado exitosamente",
  data: {
    id: string;
    isActive: boolean;
  }
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "No se puede eliminar un mercado con locales ocupados"
}
```

### 7. PATCH /mercados/:id/activate
**Descripción**: Activar mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Mercado activado exitosamente",
  data: {
    id: string;
    isActive: boolean;
  }
}
```

### 8. GET /mercados/:id/locales
**Descripción**: Obtener locales de un mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Query Parameters**:
```typescript
{
  estado?: EstadoLocal;     // ACTIVO, INACTIVO, SUSPENDIDO, PENDIENTE, OCUPADO, LIBRE
  tipo?: TipoLocal;         // COMIDA, ROPA, ELECTRODOMESTICOS, FARMACIA, SERVICIOS, CARNICERIA, OTROS
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  mercado: {
    id: string;
    nombre_mercado: string;
    isActive: boolean;
  },
  locales: Local[],
  total_locales: number,
  filtros_aplicados: {
    estado: string | null;
    tipo: string | null;
  }
}
```

---

## 🏬 MÓDULO DE LOCALES (/locales)

### 1. GET /locales
**Descripción**: Listar locales con paginación y filtros  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Query Parameters**:
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  estado?: EstadoLocal;       // ACTIVO, INACTIVO, SUSPENDIDO, PENDIENTE, OCUPADO, LIBRE
  tipo?: TipoLocal;           // COMIDA, ROPA, ELECTRODOMESTICOS, FARMACIA, SERVICIOS, CARNICERIA, OTROS
  mercadoId?: string;         // Filtrar por mercado
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: Local[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 2. GET /locales/stats
**Descripción**: Obtener estadísticas de locales  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  total_locales: number;
  locales_activos: number;
  locales_ocupados: number;
  locales_libres: number;
  ingresos_mensuales: number;
}
```

### 3. GET /locales/:id
**Descripción**: Obtener local por ID  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Respuesta Exitosa (200)**:
```typescript
{
  id: string;
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local: EstadoLocal;
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  mercadoId: string;
  mercado: Mercado;
  facturas: Factura[];
  _count: {
    facturas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. GET /locales/:id/facturas
**Descripción**: Obtener facturas de un local específico  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Query Parameters**:
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 10
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: Factura[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 5. POST /locales
**Descripción**: Crear nuevo local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Request Body**:
```typescript
{
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local?: EstadoLocal;     // Default: PENDIENTE
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  mercadoId: string;              // REQUERIDO
}
```

**Respuesta Exitosa (201)**:
```typescript
{
  message: "Local creado exitosamente",
  data: Local
}
```

### 6. PATCH /locales/:id
**Descripción**: Actualizar local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Request Body** (todos opcionales):
```typescript
{
  nombre_local?: string;
  numero_local?: string;
  permiso_operacion?: string;
  tipo_local?: TipoLocal;
  direccion_local?: string;
  estado_local?: EstadoLocal;
  monto_mensual?: number;
  propietario?: string;
  dni_propietario?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Local actualizado exitosamente",
  data: Local
}
```

### 7. PATCH /locales/:id/activate
**Descripción**: Activar un local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Local activado exitosamente",
  data: Local
}
```

### 8. PATCH /locales/:id/deactivate
**Descripción**: Desactivar un local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Local desactivado exitosamente",
  data: Local
}
```

### 9. PATCH /locales/:id/suspend
**Descripción**: Suspender un local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Local suspendido exitosamente",
  data: Local
}
```

### 10. DELETE /locales/:id
**Descripción**: Eliminar un local  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Local eliminado exitosamente"
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "No se puede eliminar: tiene facturas asociadas"
}
```

---

## 🧾 MÓDULO DE FACTURAS (/facturas)

### 1. GET /facturas
**Descripción**: Listar facturas con paginación y filtros  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Query Parameters**:
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  estado?: EstadoFactura;     // PENDIENTE, PAGADA, VENCIDA, ANULADA
  localId?: string;           // Filtrar por local
  mercadoId?: string;         // Filtrar por mercado
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: Factura[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 2. GET /facturas/stats
**Descripción**: Obtener estadísticas de facturas  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Respuesta Exitosa (200)**:
```typescript
{
  total_facturas: number;
  facturas_pendientes: number;
  facturas_pagadas: number;
  facturas_vencidas: number;
  total_monto: number;
  monto_recaudado: number;
  monto_pendiente: number;
  porcentaje_recaudacion: number;
}
```

### 3. GET /facturas/:id
**Descripción**: Obtener factura por ID  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Respuesta Exitosa (200)**:
```typescript
{
  id: string;
  numero_factura: string;
  correlativo: string;
  concepto: string;
  mes: string;                    // "2025-01"
  anio: number;
  monto: number;
  estado: EstadoFactura;
  fecha_vencimiento: Date;
  fecha_pago?: Date;
  observaciones?: string;
  mercado_nombre: string;
  local_nombre?: string;
  local_numero?: string;
  propietario_nombre?: string;
  propietario_dni?: string;
  localId: string;
  local: Local;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### 4. POST /facturas
**Descripción**: Crear nueva factura  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET, USER  

**Request Body**:
```typescript
{
  concepto: string;
  mes: string;                    // Formato "YYYY-MM"
  anio: number;
  monto: number;
  estado?: EstadoFactura;         // Default: PENDIENTE
  fecha_vencimiento: string;      // ISO Date string
  fecha_pago?: string;            // ISO Date string
  observaciones?: string;
  localId: string;                // REQUERIDO
  createdByUserId: string;        // REQUERIDO
}
```

**Respuesta Exitosa (201)**:
```typescript
{
  message: "Factura creada exitosamente",
  data: Factura
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "Ya existe una factura para este local/mes/año"
}
```

### 5. PATCH /facturas/:id
**Descripción**: Actualizar factura  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Request Body** (todos opcionales):
```typescript
{
  concepto?: string;
  mes?: string;
  anio?: number;
  monto?: number;
  estado?: EstadoFactura;
  fecha_vencimiento?: string;
  fecha_pago?: string;
  observaciones?: string;
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Factura actualizada exitosamente",
  data: Factura
}
```

### 6. PATCH /facturas/:id/pay
**Descripción**: Marcar factura como pagada  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Request Body**: Vacío

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Factura marcada como pagada",
  data: Factura
}
```

**Respuesta Error (400)**:
```typescript
{
  statusCode: 400,
  message: "La factura ya está pagada"
}
```

### 7. POST /facturas/massive
**Descripción**: Generar facturas masivas para un mercado  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, MARKET  

**Request Body**:
```typescript
{
  mercadoId: string;
  mes: string;                    // Formato "YYYY-MM"
  anio: number;
}
```

**Respuesta Exitosa (201)**:
```typescript
{
  message: "Facturas generadas exitosamente",
  data: {
    facturas_creadas: number;
    mercado: string;
    periodo: string;
  }
}
```

**Respuesta Error (409)**:
```typescript
{
  statusCode: 409,
  message: "Ya existen facturas para el período especificado"
}
```

### 8. DELETE /facturas/:id
**Descripción**: Eliminar factura  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN  

**Respuesta Exitosa (200)**:
```typescript
{
  message: "Factura eliminada exitosamente"
}
```

---

## 📊 MÓDULO DE AUDITORÍA (/audit)

### 1. GET /audit
**Descripción**: Listar registros de auditoría  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, AUDITOR  

**Query Parameters**:
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10
  accion?: string;            // Filtrar por acción
  tabla?: string;             // Filtrar por tabla
  userId?: string;            // Filtrar por usuario
  startDate?: string;         // Fecha inicio (ISO string)
  endDate?: string;           // Fecha fin (ISO string)
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: AuditLog[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

### 2. GET /audit/stats
**Descripción**: Obtener estadísticas de auditoría  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, AUDITOR  

**Respuesta Exitosa (200)**:
```typescript
{
  total_logs: number;
  logs_today: number;
  logs_by_action: {
    [action: string]: number;
  },
  most_active_users: Array<{
    userId: string;
    _count: { id: number };
    user: {
      id: string;
      nombre: string;
      apellido: string;
      correo: string;
    }
  }>
}
```

### 3. GET /audit/:id
**Descripción**: Obtener registro de auditoría específico  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, AUDITOR  

**Respuesta Exitosa (200)**:
```typescript
{
  id: string;
  accion: string;
  tabla: string;
  registro_id?: string;
  datos_anteriores?: object;
  datos_nuevos?: object;
  ip_address?: string;
  user_agent?: string;
  userId: string;
  user: User;
  createdAt: Date;
}
```

### 4. GET /audit/user/:userId
**Descripción**: Obtener registros de auditoría por usuario  
**Headers**: `Authorization: Bearer {token}`  
**Roles Permitidos**: ADMIN, AUDITOR  

**Query Parameters**:
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 10
}
```

**Respuesta Exitosa (200)**:
```typescript
{
  data: AuditLog[],
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }
}
```

---

## 📶 MÓDULO DE CONFIGURACIÓN BLUETOOTH (Frontend Only)

### Descripción General
Este módulo se encarga de la gestión completa de dispositivos Bluetooth para impresión térmica en la aplicación móvil. **No requiere endpoints del backend** ya que la comunicación es directa entre el dispositivo móvil y la impresora Bluetooth.

### Plugin Requerido
```bash
npm install @capacitor-community/bluetooth-le
npx cap sync
```

### Interfaces TypeScript

```typescript
// Interfaz para dispositivo Bluetooth detectado
interface BluetoothDevice {
  deviceId: string;
  name?: string;
  localName?: string;
  rssi?: number;
  manufacturerData?: { [key: string]: DataView };
  serviceData?: { [key: string]: DataView };
  uuids?: string[];
  isConnected: boolean;
  isPrinter: boolean;
  lastSeen: Date;
}

// Estados de conexión Bluetooth
enum BluetoothConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING', 
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// Configuración de impresora
interface PrinterConfig {
  deviceId: string;
  name: string;
  paperWidth: 58 | 80; // mm
  characterSet: 'CP437' | 'ISO8859-1' | 'CP850';
  autoReconnect: boolean;
  timeout: number; // segundos
  isDefault: boolean;
}

// Resultado de impresión
interface PrintResult {
  success: boolean;
  error?: string;
  timestamp: Date;
  deviceId: string;
}
```

### Funcionalidades del Servicio Bluetooth

#### 1. Escaneo de Dispositivos
```typescript
// Iniciar escaneo de dispositivos Bluetooth
startScan(): Observable<BluetoothDevice[]>

// Detener escaneo
stopScan(): Promise<void>

// Verificar si el escaneo está activo
isScanning(): boolean
```

#### 2. Gestión de Conexiones
```typescript
// Conectar a dispositivo específico
connect(deviceId: string): Promise<boolean>

// Desconectar dispositivo
disconnect(deviceId: string): Promise<void>

// Verificar conexión
isConnected(deviceId: string): boolean

// Obtener estado de conexión
getConnectionState(deviceId: string): BluetoothConnectionState

// Reconexión automática
enableAutoReconnect(deviceId: string): void
disableAutoReconnect(deviceId: string): void
```

#### 3. Configuración de Impresoras
```typescript
// Guardar configuración de impresora
savePrinterConfig(config: PrinterConfig): Promise<void>

// Obtener configuraciones guardadas
getSavedPrinters(): PrinterConfig[]

// Eliminar configuración
removePrinterConfig(deviceId: string): Promise<void>

// Establecer impresora predeterminada
setDefaultPrinter(deviceId: string): Promise<void>

// Obtener impresora predeterminada
getDefaultPrinter(): PrinterConfig | null
```

#### 4. Funciones de Impresión
```typescript
// Imprimir ticket de factura
printInvoiceTicket(factura: FacturaCompleta, printerConfig?: PrinterConfig): Promise<PrintResult>

// Imprimir texto personalizado
printText(text: string, printerConfig?: PrinterConfig): Promise<PrintResult>

// Imprimir línea de separación
printSeparator(char: string = '-', length: number = 32): Promise<PrintResult>

// Feed de papel
feedPaper(lines: number = 3): Promise<PrintResult>
```

### Componentes UI Requeridos

#### 1. Página de Configuración Bluetooth (`BluetoothConfigPage`)
```typescript
// Funcionalidades:
- Lista de dispositivos encontrados en tiempo real
- Indicador visual de estado de escaneo
- Botones para conectar/desconectar cada dispositivo
- Configuración de parámetros de impresora
- Test de impresión para verificar conexión
- Gestión de impresora predeterminada
```

#### 2. Modal de Selección de Impresora (`PrinterSelectorModal`)
```typescript
// Funcionalidades:
- Lista rápida de impresoras configuradas
- Estado de conexión en tiempo real
- Opción de "Usar siempre esta impresora"
- Botón de escaneo rápido si no hay impresoras
```

#### 3. Componente de Estado Bluetooth (`BluetoothStatusComponent`)
```typescript
// Funcionalidades:
- Icono de estado de Bluetooth en toolbar
- Indicador de impresora conectada
- Acceso rápido a configuración
- Notificaciones de desconexión
```

### Comandos ESC/POS para Impresión Térmica

```typescript
// Comandos básicos de formato
const ESC_POS_COMMANDS = {
  // Inicialización
  INIT: [0x1B, 0x40],
  
  // Alineación
  ALIGN_LEFT: [0x1B, 0x61, 0x00],
  ALIGN_CENTER: [0x1B, 0x61, 0x01],
  ALIGN_RIGHT: [0x1B, 0x61, 0x02],
  
  // Tamaño de texto
  TEXT_NORMAL: [0x1B, 0x21, 0x00],
  TEXT_DOUBLE_HEIGHT: [0x1B, 0x21, 0x10],
  TEXT_DOUBLE_WIDTH: [0x1B, 0x21, 0x20],
  TEXT_DOUBLE_SIZE: [0x1B, 0x21, 0x30],
  
  // Formato
  BOLD_ON: [0x1B, 0x45, 0x01],
  BOLD_OFF: [0x1B, 0x45, 0x00],
  UNDERLINE_ON: [0x1B, 0x2D, 0x01],
  UNDERLINE_OFF: [0x1B, 0x2D, 0x00],
  
  // Separadores
  LINE_FEED: [0x0A],
  CARRIAGE_RETURN: [0x0D],
  
  // Corte de papel
  CUT_PAPER: [0x1D, 0x56, 0x42, 0x00],
  
  // Feed
  FEED_3_LINES: [0x1B, 0x64, 0x03]
};
```

### Template de Ticket de Impresión

```typescript
// Formato de ticket optimizado para impresoras térmicas
generateTicketContent(factura: FacturaCompleta): Uint8Array {
  const content = [
    ...ESC_POS_COMMANDS.INIT,
    ...ESC_POS_COMMANDS.ALIGN_CENTER,
    ...ESC_POS_COMMANDS.TEXT_DOUBLE_SIZE,
    ...stringToBytes("MUNICIPALIDAD"),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...ESC_POS_COMMANDS.TEXT_NORMAL,
    ...stringToBytes("FACTURA DE MERCADO"),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes("================================"),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...ESC_POS_COMMANDS.ALIGN_LEFT,
    ...stringToBytes(`Mercado: ${factura.local.mercado.nombre}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Local: ${factura.local.numero} - ${factura.local.nombre}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Propietario: ${factura.local.propietario}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`DNI: ${factura.local.dni_propietario}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes("--------------------------------"),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Concepto: ${factura.concepto}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Periodo: ${factura.mes}/${factura.anio}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...ESC_POS_COMMANDS.BOLD_ON,
    ...stringToBytes(`Monto: S/. ${factura.monto.toFixed(2)}`),
    ...ESC_POS_COMMANDS.BOLD_OFF,
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Vencimiento: ${formatDate(factura.fecha_vencimiento)}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Estado: ${factura.estado}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes("--------------------------------"),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Correlativo: ${factura.correlativo}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Fecha: ${formatDate(new Date())}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes(`Generado por: ${factura.generadoPor.nombre}`),
    ...ESC_POS_COMMANDS.LINE_FEED,
    ...stringToBytes("================================"),
    ...ESC_POS_COMMANDS.FEED_3_LINES,
    ...ESC_POS_COMMANDS.CUT_PAPER
  ];
  
  return new Uint8Array(content);
}
```

### Manejo de Errores Bluetooth

```typescript
enum BluetoothError {
  BLUETOOTH_DISABLED = 'BLUETOOTH_DISABLED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND', 
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PRINT_FAILED = 'PRINT_FAILED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface BluetoothErrorHandler {
  handleError(error: BluetoothError, context?: any): void;
  showErrorMessage(error: BluetoothError): string;
  suggestSolution(error: BluetoothError): string;
}
```

### Configuración de Permisos (Android)

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Para Android 12+ -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

### Estados de UI para Bluetooth

```typescript
// Indicadores visuales requeridos
interface BluetoothUIState {
  isScanning: boolean;
  connectedDevices: BluetoothDevice[];
  availableDevices: BluetoothDevice[];
  defaultPrinter: PrinterConfig | null;
  lastPrintResult: PrintResult | null;
  connectionErrors: BluetoothError[];
  signalStrength: 'excellent' | 'good' | 'fair' | 'poor';
}
```

### Funcionalidades Avanzadas

#### 1. Reconexión Automática
- Detectar cuando se pierde conexión
- Intentar reconectar automáticamente cada 30 segundos
- Notificar al usuario sobre estado de reconexión
- Límite de 3 intentos antes de requerir intervención manual

#### 2. Gestión de Batería
- Optimizar escaneo para preservar batería
- Detener escaneo automáticamente después de 60 segundos
- Modo de bajo consumo cuando la app está en background

#### 3. Caché de Dispositivos
- Recordar dispositivos previamente conectados
- Priorizar dispositivos conocidos en el escaneo
- Limpiar caché de dispositivos antiguos (>30 días)

#### 4. Logging y Debugging
- Registrar todos los eventos de Bluetooth para debugging
- Exportar logs de conexión para soporte técnico
- Estadísticas de uso de impresión

---

## 📱 ENUMS Y TIPOS IMPORTANTES

### Estados de Factura
```typescript
enum EstadoFactura {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  ANULADA = 'ANULADA'
}
```

### Estados de Local
```typescript
enum EstadoLocal {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  PENDIENTE = 'PENDIENTE',
  OCUPADO = 'OCUPADO',
  LIBRE = 'LIBRE'
}
```

### Tipos de Local
```typescript
enum TipoLocal {
  COMIDA = 'COMIDA',
  ROPA = 'ROPA',
  ELECTRODOMESTICOS = 'ELECTRODOMESTICOS',
  FARMACIA = 'FARMACIA',
  SERVICIOS = 'SERVICIOS',
  CARNICERIA = 'CARNICERIA',
  OTROS = 'OTROS'
}
```

---

## 🎨 REQUERIMIENTOS DE UI/UX

### Paleta de Colores Municipal
```css
:root {
  --primary: #5ccedf;      /* Azul municipalidad */
  --secondary:#A4C9F5;    /* azul municipalidad 2 */
  --warning: #d97706;      /* Amarillo */
  --error: #dc2626;        /* Rojo */
  --neutral-50: #f9fafb;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-500: #6b7280;
  --neutral-900: #111827;
}
```

### Componentes UI Requeridos
- **Cards responsivos** para mercados/locales
- **Tablas con paginación** y filtros avanzados
- **Formularios reactivos** con validaciones en tiempo real
- **Modales de confirmación** para acciones críticas
- **Loaders/Spinners** para estados de carga
- **Toast notifications** (success/error/warning/info)
- **Bottom sheets** para móvil
- **Floating action buttons** para acciones principales

---

## 📱 FUNCIONALIDADES MÓVILES ESPECÍFICAS

### Impresión Bluetooth
**Plugin Requerido**: `@capacitor-community/bluetooth-le`

**Funcionalidades**:
- Escaneo automático de impresoras Bluetooth
- Conexión persistente durante uso de la app
- Formato de ticket térmico (58mm o 80mm)
- Comandos ESC/POS para impresión
- Reconexión automática si se pierde conexión
- Indicadores visuales del estado de conexión

### Contenido del Ticket de Impresión
```
================================
        MUNICIPALIDAD
     FACTURA DE MERCADO
================================
Mercado: [nombre_mercado]
Local: [numero_local] - [nombre_local]
Propietario: [propietario]
DNI: [dni_propietario]
--------------------------------
Concepto: [concepto]
Periodo: [mes]/[anio]
Monto: S/. [monto]
Vencimiento: [fecha_vencimiento]
Estado: [estado]
--------------------------------
Correlativo: [correlativo]
Fecha: [fecha_actual]
Generado por: [usuario]
================================
```

---

## 🔧 ORDEN DE DESARROLLO RECOMENDADO

### 1. MÓDULO DE AUTENTICACIÓN (PRIMERA PRIORIDAD)
- Servicio de autenticación con Angular Signals
- Guards para protección de rutas
- Interceptors para manejo automático de tokens
- Páginas de login/logout
- Manejo de roles y permisos

### 2. MÓDULO DE USUARIOS (SEGUNDA PRIORIDAD)
- Servicio CRUD de usuarios
- Lista de usuarios con paginación
- Formularios de crear/editar usuario
- Gestión de roles
- Activar/desactivar usuarios

### 3. MÓDULO DE AUDIT-LOGS (TERCERA PRIORIDAD)
- Servicio de auditoría (solo lectura)
- Tabla de registros con filtros avanzados
- Estadísticas de auditoría
- Exportación de reportes

### 4. MÓDULO DE MERCADOS (CUARTA PRIORIDAD)
- Servicio CRUD de mercados
- Grid/lista de mercados
- Formularios de crear/editar mercado
- Vista detalle con locales asociados
- Estadísticas por mercado

### 5. MÓDULO DE LOCALES (QUINTA PRIORIDAD)
- Servicio CRUD de locales
- Lista con filtros por mercado/estado/tipo
- Formularios de crear/editar local
- Gestión de estados (activar/desactivar/suspender)
- Historial de facturas por local

### 6. MÓDULO DE FACTURAS (SEXTA PRIORIDAD)
- Servicio CRUD de facturas
- Lista con filtros avanzados
- Crear facturas individuales
- Generación masiva de facturas
- Marcar como pagada
- Impresión en web y móvil
- Exportación de reportes

### 7. MÓDULO DE CONFIGURACIÓN BLUETOOTH (SÉPTIMA PRIORIDAD)
- Servicio de gestión Bluetooth
- Escaneo y detección de impresoras
- Configuración de dispositivos
- Sistema de reconexión automática
- Componentes de UI para estado de conexión
- Templates de impresión ESC/POS
- Manejo de errores Bluetooth
- Testing en dispositivos físicos



---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Seguridad
- **NO usar localStorage** para tokens
- Implementar renovación automática de tokens
- Validar permisos en cada operación
- Sanitizar todas las entradas de usuario

### Performance
- Implementar paginación en todas las listas
- Usar lazy loading para módulos
- Optimizar imágenes y assets
- Implementar caché inteligente

### Responsive Design
- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly en móvil
- Navegación optimizada para ambas plataformas

### Offline Capabilities
- Service Worker para PWA
- Caché de datos críticos
- Sincronización cuando vuelva conexión
- Indicadores de estado de conexión

---

## 🚀 FUNCIONALIDADES ESPECÍFICAS POR PLATAFORMA

### Aplicación Web (Panel Administrativo)
- Dashboard con estadísticas generales
- Gestión completa de todos los módulos
- Reportes y gráficos avanzados
- Exportación de datos (PDF/Excel)
- Impresión de facturas en navegador

### Aplicación Móvil (Facturación de Campo)
- Dashboard móvil simplificado
- Lista de mercados → locales → facturas
- Creación rápida de facturas
- **Impresión Bluetooth** (funcionalidad principal)
- Modo offline básico
- Búsqueda optimizada para táctil

---

## 📋 ENTREGABLES ESPERADOS

1. **Aplicación Ionic completa** (web + móvil)
2. **Servicios Angular** para todos los endpoints
3. **Guards y interceptors** implementados
4. **Modelos TypeScript** con tipado fuerte
5. **Componentes reutilizables** documentados
6. **Plugin Bluetooth** configurado y funcional
7. **PWA capabilities** implementadas
8. **Build scripts** para ambas plataformas
9. **Testing básico** de funcionalidades críticas
10. **Documentación** de instalación y uso

---

## 🎯 RESULTADO FINAL ESPERADO

Una aplicación moderna, responsive y funcional que permita:
- **Gestión completa** de facturas de mercados municipales
- **Operación dual** (web administrativo + móvil de campo)
- **Impresión móvil** via Bluetooth
- **Seguridad robusta** con roles y permisos
- **Experiencia de usuario** optimizada para ambas plataformas
- **Escalabilidad** para futuras funcionalidades

**¡El backend está 100% funcional y listo para consumir!**
