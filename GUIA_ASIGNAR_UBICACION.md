# 📍 Guía: Asignar Ubicación a Usuario

## 🎯 Endpoint para Crear/Asignar Ubicación

### **URL del Endpoint**
```
POST /api/user-stats/user-location
```

### **URL Completa**
```
http://localhost:3000/api/user-stats/user-location
```

---

## 🔐 Autenticación Requerida

- **Tipo**: JWT via HTTP-only cookies
- **Roles permitidos**: `ADMIN` y `USER-ADMIN`
- **Headers requeridos**: Cookies de autenticación

---

## 📝 Estructura del Body (JSON)

### **Campos Requeridos**
```json
{
  "userId": "string",        // ID del usuario al que asignar la ubicación
  "locationName": "string"   // Nombre de la ubicación
}
```

### **Campos Opcionales**
```json
{
  "locationCode": "string",    // Código de la ubicación (ej: "MULT_001")
  "description": "string"      // Descripción adicional de la ubicación
}
```

### **Ejemplo Completo**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "locationName": "Mall Multiplaza",
  "locationCode": "MULT_001",
  "description": "Centro comercial principal - Área de consultas EC/ICS"
}
```

---

## 🔧 Configuración en Postman

### **1. Configurar la Request**
- **Método**: `POST`
- **URL**: `http://localhost:3000/api/user-stats/user-location`
- **Headers**:
  ```
  Content-Type: application/json
  ```

### **2. Autenticación (Cookies)**
- Primero ejecuta el login:
  ```
  POST http://localhost:3000/api/auth/login
  Body:
  {
    "username": "useradmin",
    "contrasena": "admin123"
  }
  ```
- Las cookies se establecerán automáticamente
- Asegúrate de tener habilitado "Automatically follow redirects" en Postman

### **3. Body de la Request**
- Tipo: `raw`
- Formato: `JSON`
- Contenido:
```json
{
  "userId": "ID_DEL_USUARIO_AQUI",
  "locationName": "Centro Histórico",
  "locationCode": "CENTRO_001",
  "description": "Oficina principal - Centro de Tegucigalpa"
}
```

### **4. Ejemplos de Ubicaciones Comunes**

#### **Ejemplo 1: Mall Multiplaza**
```json
{
  "userId": "usuario-id-aqui",
  "locationName": "Mall Multiplaza",
  "locationCode": "MULT_001",
  "description": "Centro comercial - Consultas tributarias"
}
```

#### **Ejemplo 2: Centro Histórico**
```json
{
  "userId": "usuario-id-aqui",
  "locationName": "Centro Histórico",
  "locationCode": "CENTRO_001",
  "description": "Oficina central - Distrito histórico"
}
```

#### **Ejemplo 3: Comayagüela**
```json
{
  "userId": "usuario-id-aqui",
  "locationName": "Comayagüela",
  "locationCode": "COMA_001",
  "description": "Sucursal Comayagüela - Atención ciudadana"
}
```

---

## ✅ Respuesta Exitosa (201 Created)

```json
{
  "id": "nueva-ubicacion-id",
  "locationName": "Mall Multiplaza",
  "locationCode": "MULT_001",
  "description": "Centro comercial - Consultas tributarias",
  "isActive": true,
  "assignedAt": "2025-08-06T19:30:00.000Z",
  "assignedBy": "admin-user-id",
  "userId": "usuario-id-aqui",
  "username": "nombreusuario"
}
```

---

## ❌ Posibles Errores

### **401 Unauthorized**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
**Solución**: Verificar que estés logueado correctamente

### **403 Forbidden**
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```
**Solución**: Solo usuarios con rol `ADMIN` o `USER-ADMIN` pueden usar este endpoint

### **400 Bad Request**
```json
{
  "message": [
    "userId should not be empty",
    "locationName should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
**Solución**: Verificar que todos los campos requeridos estén presentes

---

## 🔍 Cómo Obtener el ID de Usuario

### **Opción 1: Listar todos los usuarios**
```
GET /api/users
```

### **Opción 2: Buscar usuario específico**
```
GET /api/users/{id}
```

---

## 💡 Notas Importantes

1. **Solo una ubicación activa**: El sistema automáticamente desactiva ubicaciones anteriores cuando asignas una nueva
2. **Roles requeridos**: Solo ADMIN y USER-ADMIN pueden asignar ubicaciones
3. **Tracking**: La asignación queda registrada con timestamp y usuario que la realizó
4. **Cookies**: Usar autenticación via cookies HTTP-only, no tokens en headers

---

## 🧪 Test Rápido

### **1. Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"useradmin","contrasena":"admin123"}' \
  -c cookies.txt
```

### **2. Asignar ubicación**
```bash
curl -X POST http://localhost:3000/api/user-stats/user-location \
  -H "Content-Type: application/json" \
  -d '{"userId":"ID-USUARIO","locationName":"Centro Histórico","locationCode":"CENTRO_001"}' \
  -b cookies.txt
```
