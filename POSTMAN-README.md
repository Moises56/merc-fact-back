# Invoice-Fact API - Postman Collection

## 📋 Descripción

Esta colección de Postman contiene pruebas completas para la API Invoice-fact del sistema de gestión de mercados municipales desarrollado en NestJS. La colección incluye más de 50 endpoints organizados en carpetas lógicas con scripts automatizados para manejo de autenticación y validación de respuestas.

## 🚀 Características

- ✅ **Autenticación automatizada** con manejo de tokens JWT
- ✅ **Variables dinámicas** para IDs de entidades
- ✅ **Scripts de pre-request** para renovación de tokens
- ✅ **Scripts de test** para validación de respuestas
- ✅ **Operaciones CRUD completas** para todas las entidades
- ✅ **Pruebas de control de acceso basado en roles**
- ✅ **Escenarios de manejo de errores**
- ✅ **Flujos de trabajo completos**

## 📁 Estructura de la Colección

### 🔐 Authentication (6 endpoints)
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Inicio de sesión
- `POST /auth/logout` - Cierre de sesión
- `POST /auth/change-password` - Cambio de contraseña
- `GET /auth/profile` - Perfil del usuario
- `POST /auth/refresh` - Renovación de token

### 👥 Users Management (6 endpoints)
- `GET /users` - Listar usuarios
- `POST /users` - Crear usuario
- `GET /users/:id` - Obtener usuario por ID
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario
- `GET /users/stats` - Estadísticas de usuarios

### 🏪 Markets/Mercados (6 endpoints)
- `GET /mercados` - Listar mercados
- `POST /mercados` - Crear mercado
- `GET /mercados/:id` - Obtener mercado por ID
- `PATCH /mercados/:id` - Actualizar mercado
- `DELETE /mercados/:id` - Eliminar mercado
- `GET /mercados/stats` - Estadísticas de mercados

### 🏬 Locals/Locales (6 endpoints)
- `GET /locales` - Listar locales
- `POST /locales` - Crear local
- `GET /locales/:id` - Obtener local por ID
- `PATCH /locales/:id` - Actualizar local
- `DELETE /locales/:id` - Eliminar local
- `GET /locales/by-market/:marketId` - Locales por mercado

### 🧾 Invoices/Facturas (8 endpoints)
- `GET /facturas` - Listar facturas
- `POST /facturas` - Crear factura
- `GET /facturas/:id` - Obtener factura por ID
- `PATCH /facturas/:id` - Actualizar factura
- `DELETE /facturas/:id` - Eliminar factura
- `GET /facturas/stats` - Estadísticas de facturas
- `POST /facturas/:id/pay` - Procesar pago
- `GET /facturas/by-local/:localId` - Facturas por local

### 📊 Audit (5 endpoints)
- `GET /audit/logs` - Registros de auditoría
- `GET /audit/logs/:id` - Registro específico
- `GET /audit/stats` - Estadísticas de auditoría
- `GET /audit/users/:userId` - Logs por usuario
- `GET /audit/entities/:entityType` - Logs por tipo de entidad

### 🌱 Seed Data (2 endpoints)
- `POST /seed` - Ejecutar seed de datos
- `DELETE /seed` - Limpiar datos de prueba

### 🧪 Test Scenarios
- **Complete Workflow** - Flujo completo de negocio
- **Error Handling** - Manejo de errores

## 🛠️ Instalación y Configuración

### 1. Importar la Colección

1. Abre Postman
2. Click en "Import"
3. Selecciona el archivo `Invoice-Fact-API.postman_collection.json`
4. Importa también el archivo de entorno `Invoice-Fact-API.postman_environment.json`

### 2. Configurar el Entorno

1. Selecciona el entorno "Invoice-Fact API Environment"
2. Verifica que la variable `baseUrl` apunte a tu servidor local:
   ```
   http://localhost:3000/api
   ```
3. Las demás variables se llenarán automáticamente durante las pruebas

### 3. Configurar Credenciales por Defecto

En el entorno, puedes configurar las credenciales por defecto:
- `admin_email`: admin@mercados.com
- `admin_password`: admin123
- `test_email`: test@example.com
- `test_password`: test123

## 📝 Roles de Usuario

La API maneja 4 roles de usuario:

- **ADMIN**: Acceso completo al sistema
- **MARKET**: Gestión de mercados específicos
- **USER**: Acceso básico de usuario
- **AUDITOR**: Solo lectura para auditoría

## 🔄 Flujo de Trabajo Recomendado

### Prueba Completa del Sistema:

1. **Inicialización**:
   - Ejecutar "🌱 Seed Data > Execute Seed Data" para crear datos de prueba

2. **Autenticación**:
   - Ejecutar "🔐 Authentication > Login Admin" para autenticarse

3. **Gestión de Entidades**:
   - Crear un mercado con "🏪 Markets > Create Market"
   - Crear un local con "🏬 Locals > Create Local"
   - Crear una factura con "🧾 Invoices > Create Invoice"

4. **Pruebas de Funcionalidad**:
   - Listar entidades creadas
   - Actualizar información
   - Procesar pagos de facturas

5. **Auditoría**:
   - Revisar logs con "📊 Audit > Get Audit Logs"

## 🧪 Ejecutar Pruebas Automatizadas

### Prueba Individual
- Selecciona cualquier request y haz click en "Send"
- Los scripts automáticamente manejarán la autenticación y validación

### Prueba de Carpeta Completa
1. Click derecho en cualquier carpeta
2. Selecciona "Run collection"
3. Configura las opciones de ejecución
4. Ejecuta las pruebas

### Prueba de Colección Completa
1. Click en "Runner" en Postman
2. Selecciona la colección "Invoice-Fact API"
3. Configura iteraciones y delay
4. Ejecuta todas las pruebas

## 🔧 Variables Automáticas

La colección maneja automáticamente las siguientes variables:

- `access_token`: Token JWT de autenticación
- `token_expiry`: Tiempo de expiración del token
- `user_id`: ID del usuario actual
- `market_id`: ID del mercado creado
- `local_id`: ID del local creado
- `invoice_id`: ID de la factura creada
- `created_user_id`: ID del usuario creado en pruebas

## 📊 Scripts de Validación

Cada endpoint incluye scripts de test que validan:

- ✅ Código de respuesta HTTP
- ✅ Estructura de la respuesta JSON
- ✅ Presencia de campos requeridos
- ✅ Tipos de datos correctos
- ✅ Almacenamiento automático de variables

## 🚨 Manejo de Errores

La colección incluye pruebas específicas para:

- 🔴 Autenticación fallida
- 🔴 Acceso no autorizado
- 🔴 Recursos no encontrados
- 🔴 Datos inválidos
- 🔴 Duplicación de datos

## 🛡️ Seguridad

- Los tokens se manejan automáticamente
- Las contraseñas se almacenan como variables secretas
- Se incluyen pruebas de autorización por roles
- Manejo seguro de cookies HTTP-only

## 🐛 Troubleshooting

### El token expira constantemente
- Verifica que el servidor esté ejecutándose
- Revisa la configuración de expiración en el backend

### Variables no se actualizan
- Asegúrate de ejecutar el login antes que otros endpoints
- Verifica que el entorno esté seleccionado correctamente

### Errores de conexión
- Confirma que el `baseUrl` sea correcto
- Verifica que el servidor NestJS esté ejecutándose en el puerto 3000

## 📞 Soporte

Para reportar problemas o sugerencias:
1. Revisa los logs de la consola de Postman
2. Verifica la configuración del entorno
3. Consulta la documentación de la API

---

## 📋 Checklist de Verificación

Antes de ejecutar las pruebas, verifica:

- [ ] Servidor NestJS ejecutándose en puerto 3000
- [ ] Base de datos configurada y accesible
- [ ] Entorno de Postman seleccionado
- [ ] Variables de entorno configuradas
- [ ] Datos de seed inicializados (opcional)

¡La colección está lista para usar! 🚀
