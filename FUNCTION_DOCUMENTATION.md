# Documentación de Funciones del Backend

Este documento describe las funciones más importantes de los servicios del backend, explicando su propósito, parámetros y lo que retornan.

## Módulo de Autenticación (`AuthService`)

Maneja la autenticación de usuarios, la validación y la gestión de contraseñas.

### `login(loginDto: LoginDto)`
- **Propósito**: Autenticar a un usuario utilizando su correo electrónico/nombre de usuario y contraseña.
- **Parámetros**: `loginDto` - Un objeto que contiene `correo` o `username`, y `contrasena`.
- **Retorna**: Un objeto `AuthResponse` con los datos del usuario y los tokens `access_token` y `refresh_token`.
- **Validaciones**:
    - Verifica si el usuario existe.
    - Comprueba si la cuenta está activa.
    - Valida que la contraseña sea correcta usando `bcrypt`.
- **Acciones Adicionales**: Actualiza el campo `lastLogin` del usuario.

### `refreshToken(refreshTokenDto: RefreshTokenDto)`
- **Propósito**: Generar un nuevo `access_token` a partir de un `refresh_token` válido.
- **Parámetros**: `refreshTokenDto` - Un objeto que contiene el `refreshToken`.
- **Retorna**: Un objeto con un nuevo `access_token`.
- **Validaciones**: Verifica la validez del `refreshToken` y que el usuario asociado siga activo.

### `changePassword(userId: string, changePasswordDto: ChangePasswordDto)`
- **Propósito**: Permitir a un usuario cambiar su contraseña.
- **Parámetros**:
    - `userId`: El ID del usuario.
    - `changePasswordDto`: Un objeto con `currentPassword` y `newPassword`.
- **Retorna**: Un mensaje de confirmación.
- **Validaciones**:
    - Verifica que la contraseña actual sea correcta.
    - Asegura que la nueva contraseña sea diferente a la actual.

---

## Módulo de Usuarios (`UsersService`)

Gestiona el ciclo de vida de los usuarios (CRUD) y sus estadísticas.

### `create(createUserDto: CreateUserDto)`
- **Propósito**: Registrar un nuevo usuario en el sistema.
- **Parámetros**: `createUserDto` - Un objeto con los datos del nuevo usuario.
- **Retorna**: El objeto del usuario creado sin la contraseña.
- **Validaciones**:
    - Previene la duplicación de `correo`, `username`, `dni` y `numero_empleado`.
- **Acciones Adicionales**: Hashea la contraseña antes de guardarla.

### `findAll(page: number, limit: number, role?: Role)`
- **Propósito**: Obtener una lista paginada de todos los usuarios.
- **Parámetros**:
    - `page`: Número de página.
    - `limit`: Cantidad de resultados por página.
    - `role` (opcional): Filtra los usuarios por su rol.
- **Retorna**: Un objeto con la lista de usuarios y metadatos de paginación.

### `update(id: string, updateUserDto: UpdateUserDto)`
- **Propósito**: Actualizar los datos de un usuario existente.
- **Parámetros**:
    - `id`: El ID del usuario a actualizar.
    - `updateUserDto`: Un objeto con los campos a modificar.
- **Retorna**: El objeto del usuario actualizado.
- **Validaciones**: Previene conflictos si se actualizan campos únicos como `correo` o `username`.

### `remove(id: string)`
- **Propósito**: Desactivar la cuenta de un usuario (borrado lógico).
- **Parámetros**: `id` - El ID del usuario a desactivar.
- **Retorna**: Un mensaje de confirmación.
- **Nota**: No elimina el registro, solo cambia el campo `isActive` a `false`.

### `getUserStats()`
- **Propósito**: Obtener estadísticas sobre los usuarios.
- **Retorna**: Un objeto con:
    - `total_users`: Total de usuarios activos.
    - `active_last_month`: Usuarios que iniciaron sesión en el último mes.
    - `by_role`: Conteo de usuarios agrupados por rol.

---

## Módulo de Mercados (`MercadosService`)

Gestiona la información de los mercados, sus locales y estadísticas asociadas.

### `create(createMercadoDto: CreateMercadoDto)`
- **Propósito**: Crear un nuevo mercado.
- **Parámetros**: `createMercadoDto` - Datos del nuevo mercado.
- **Retorna**: Un mensaje de éxito y el objeto del mercado creado.
- **Validaciones**: Evita la creación de mercados con nombres duplicados.

### `findOne(id: string)`
- **Propósito**: Obtener los detalles completos de un mercado, incluyendo sus locales y facturas recientes.
- **Parámetros**: `id` - El ID del mercado.
- **Retorna**: El objeto del mercado con detalles anidados.

### `remove(id: string)`
- **Propósito**: Desactivar un mercado (borrado lógico).
- **Parámetros**: `id` - El ID del mercado.
- **Retorna**: Un mensaje de confirmación.
- **Validaciones**: Impide la desactivación si el mercado tiene locales activos/ocupados.

### `getMercadoStats()`
- **Propósito**: Obtener estadísticas globales de todos los mercados.
- **Retorna**: Un objeto con:
    - `total_mercados`: Cantidad de mercados activos.
    - `total_locales`: Suma de todos los locales.
    - `locales_ocupados` y `locales_libres`.
    - `ocupacion_percentage`: Porcentaje de ocupación.
    - `total_recaudado`: Suma total de los montos de facturas pagadas.

### `getLocalesByMercado(id: string, estado?: string, tipo?: string)`
- **Propósito**: Obtener una lista de locales pertenecientes a un mercado específico, con filtros opcionales.
- **Parámetros**:
    - `id`: ID del mercado.
    - `estado` (opcional): Filtra por estado del local (`ACTIVO`, `INACTIVO`, etc.).
    - `tipo` (opcional): Filtra por tipo de local.
- **Retorna**: Un objeto con la información del mercado y la lista de locales filtrados.

---

## Módulo de Locales (`LocalesService`)

Administra la información de los locales comerciales dentro de los mercados.

### `create(createLocaleDto: CreateLocaleDto)`
- **Propósito**: Crear un nuevo local y asociarlo a un mercado.
- **Parámetros**: `createLocaleDto` - Datos del nuevo local, incluyendo `mercadoId`.
- **Retorna**: El objeto del local creado.
- **Validaciones**:
    - Asegura que el `mercadoId` exista.
    - Evita duplicados en `numero_local` y `permiso_operacion`.

### `findAll(page, limit, estado?, tipo?, mercadoId?)`
- **Propósito**: Obtener una lista paginada de locales con filtros opcionales.
- **Parámetros**: Permite paginación y filtrado por `estado`, `tipo` y `mercadoId`.
- **Retorna**: Un objeto con la lista de locales y datos de paginación.

### `remove(id: string)`
- **Propósito**: Eliminar un local de forma permanente.
- **Parámetros**: `id` - El ID del local.
- **Retorna**: Un mensaje de confirmación.
- **Validaciones**: No permite eliminar un local si tiene facturas asociadas.

### `getLocalStats()`
- **Propósito**: Obtener estadísticas sobre los locales.
- **Retorna**: Un objeto con el conteo de locales por estado (`activos`, `inactivos`, etc.), estadísticas por tipo y el monto promedio de alquiler.

---

## Módulo de Facturas (`FacturasService`)

Se encarga de la creación, gestión y seguimiento de las facturas de los locales.

### `create(createFacturaDto: CreateFacturaDto)`
- **Propósito**: Crear una factura individual para un local.
- **Parámetros**: `createFacturaDto` - Datos de la factura, incluyendo `localId`.
- **Retorna**: El objeto de la factura creada.
- **Validaciones**:
    - Verifica que el local exista.
    - Impide crear facturas duplicadas para el mismo local, mes y año.
- **Acciones Adicionales**: Genera un número `correlativo` único para la factura.

### `generateMassiveInvoices(mercadoId, mes, anio, createdByUserId)`
- **Propósito**: Generar facturas de forma masiva para todos los locales activos de un mercado en un mes y año específicos.
- **Parámetros**:
    - `mercadoId`: ID del mercado.
    - `mes`, `anio`: Período de facturación.
    - `createdByUserId`: ID del usuario que genera las facturas.
- **Retorna**: Un mensaje con la cantidad de facturas generadas.
- **Validaciones**:
    - Confirma que no existan facturas previas para ese período en el mercado.

### `markAsPaid(id: string)`
- **Propósito**: Marcar una factura como pagada.
- **Parámetros**: `id` - El ID de la factura.
- **Retorna**: El objeto de la factura actualizada.
- **Acciones Adicionales**: Establece el estado a `PAGADA` y registra la `fecha_pago`.

### `getFacturaStats()`
- **Propósito**: Obtener estadísticas sobre todas las facturas.
- **Retorna**: Un objeto con:
    - Conteo de facturas por estado (`pendientes`, `pagadas`, `vencidas`).
    - `monto_total` y `monto_recaudado`.
    - `porcentaje_recaudacion`.
