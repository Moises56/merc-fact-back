// Ejemplos de las respuestas mejoradas del API de Mercados

/**
 * RESPUESTAS DE ÉXITO MEJORADAS
 */

// 1. CREAR MERCADO (POST /api/mercados)
// ANTES: Solo retornaba el objeto mercado
// AHORA: Incluye mensaje de éxito
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

// 2. ACTUALIZAR MERCADO (PATCH /api/mercados/:id)
// ANTES: Solo retornaba el objeto mercado actualizado
// AHORA: Incluye mensaje de éxito + field mapping activo -> isActive
{
  "message": "Mercado actualizado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "nombre_mercado": "Mercado Central San Juan - Actualizado",
    "direccion": "Av. Principal 123, San Juan de Lurigancho - Actualizada",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "descripcion": "Mercado municipal con 350 puestos comerciales",
    "isActive": false, // ← Campo mapeado correctamente desde "activo: false"
    "createdAt": "2025-06-04T16:33:19.097Z",
    "updatedAt": "2025-06-04T16:40:35.772Z",
    "_count": {
      "locales": 0
    }
  }
}

// 3. ACTIVAR MERCADO (PATCH /api/mercados/:id/activate)
// ANTES: Solo mensaje simple
// AHORA: Mensaje + datos de confirmación
{
  "message": "Mercado activado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "isActive": true
  }
}

// 4. DESACTIVAR MERCADO (DELETE /api/mercados/:id)
// ANTES: Solo mensaje simple
// AHORA: Mensaje + datos de confirmación
{
  "message": "Mercado desactivado exitosamente",
  "data": {
    "id": "ae028cdc-94ec-42c9-ae7e-296fc1d915a5",
    "isActive": false
  }
}

/**
 * RESPUESTAS DE ERROR MEJORADAS
 */

// 1. ERROR AL CREAR MERCADO CON NOMBRE DUPLICADO
// ANTES: String simple con el error
// AHORA: Objeto estructurado con más información
{
  "message": "No se puede crear el mercado",
  "error": "Ya existe un mercado con ese nombre",
  "statusCode": 409
}

// 2. ERROR AL ACTUALIZAR MERCADO CON NOMBRE DUPLICADO
// ANTES: String simple con el error
// AHORA: Objeto estructurado con más información
{
  "message": "No se puede actualizar el mercado",
  "error": "Ya existe un mercado con ese nombre",
  "statusCode": 409
}

// 3. ERROR AL BUSCAR MERCADO NO EXISTENTE
// ANTES: String simple
// AHORA: Objeto estructurado con más información
{
  "message": "Mercado no encontrado",
  "error": "El mercado solicitado no existe en el sistema",
  "statusCode": 404
}

// 4. ERROR AL DESACTIVAR MERCADO CON LOCALES OCUPADOS
// ANTES: Mensaje genérico
// AHORA: Mensaje específico con detalles
{
  "message": "No se puede desactivar el mercado",
  "error": "El mercado tiene 15 locales ocupados. Debe liberar todos los locales antes de desactivarlo",
  "statusCode": 409
}

/**
 * PRUEBAS EN POSTMAN
 */

// Para probar el mapeo de campo activo -> isActive:
// POST/PATCH con este JSON body:
{
  "nombre_mercado": "Test Market",
  "direccion": "Test Address",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "activo": false  // ← Este campo ahora se mapea correctamente a isActive
}

/**
 * FIELD MAPPING SOLUCIONADO
 * 
 * El problema original era que el API recibía el campo "activo" 
 * pero Prisma esperaba "isActive", causando PrismaClientValidationError.
 * 
 * SOLUCIÓN IMPLEMENTADA:
 * - En el servicio se hace destructuring del campo "activo"
 * - Se transforma a "isActive" antes de enviar a Prisma
 * - Se mantiene compatibilidad con la API existente
 * - Los mensajes ahora son más informativos
 */
