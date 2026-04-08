# Vista General Del Sistema

## Resumen

El backend expone una API Express sin prefijo global de version. El foco del sistema es operar un modelo multiempresa para:

- autenticacion de usuarios internos
- administracion de negocios, sedes, servicios, planes y roles
- agenda de bookings y appointments
- metricas operativas
- notificaciones por WhatsApp y push

## Stack Runtime

- Runtime: Node.js 22
- Lenguaje: TypeScript con modulos ESM
- Servidor HTTP: Express 5
- Persistencia principal: Firestore
- Autenticacion: Firebase Auth via Firebase Admin
- Cola de automatizaciones: Google Cloud Tasks
- WhatsApp: Infobip
- Push web: Firebase Cloud Messaging

## Estructura Del Codigo

- `src/config`: variables de entorno y configuraciones estaticas
- `src/domain`: interfaces, errores y utilidades puras
- `src/data`: inicializacion de Firestore Admin
- `src/infrastructure`: middlewares, logger, clientes de integracion
- `src/presentation`: rutas, controladores, DTOs y servicios de aplicacion

## Bootstrap

El arranque ocurre en `src/app.ts`:

1. Lee `FIREBASE_CREDENTIALS_PATH`.
2. Inicializa Firebase Admin y Firestore.
3. Construye `Server` con `AppRoutes.routes`.
4. Levanta Express en `PORT`.

## Pipeline HTTP

El orden actual de middlewares es:

1. `cors({ origin: "*" })`
2. `helmet()`
3. `express.json()` y `express.urlencoded()`
4. `requestLogger`
5. `rateLimitMiddleware`
6. `authMiddleware`
7. `businessIdHeaderMiddleware`
8. rutas de la aplicacion
9. `notFoundRoute`
10. `errorHandler`

## Comportamientos Globales

### Rate limit

- Limite en memoria por `origen + metodo + path`
- Ventana: 1 segundo
- Maximo: 10 requests por segundo
- Respuesta: `429` con header `Retry-After`

### Logging

- Cada request registra metodo, URL, usuario solicitante y duracion
- Los errores controlados usan `CustomError`
- Winston escribe en consola y en `logs/error.log` / `logs/combined.log`

### Errores

Errores controlados responden con:

```json
{
  "error": "mensaje",
  "code": "CODIGO_OPCIONAL",
  "timestamp": "2026-04-06T12:00:00.000Z"
}
```

La ruta no encontrada responde con otro formato:

```json
{
  "message": "Recurso no encontrado",
  "method": "GET",
  "path": "/ruta"
}
```

## Autenticacion Y Contexto Multiempresa

### Token de sesion

- Las rutas no publicas exigen `Authorization: Bearer <FirebaseIdToken>`
- El middleware valida el token con Firebase Admin
- Si valida, inyecta `req.uid` y `req.decodedIdToken`

### Header `businessId`

En rutas privadas que no esten exentas:

- el header `businessId` es obligatorio
- el negocio debe existir
- el negocio debe tener `planId`
- `subscriptionStatus` del negocio debe ser `ACTIVE`
- el plan referenciado debe existir y estar `ACTIVE`

## Observaciones Relevantes

- No existe endpoint de healthcheck.
- No existe Swagger/OpenAPI.
- El script `test` aun no representa una suite real de pruebas.
- Hay nombres legacy que siguen vigentes en el codigo, por ejemplo `bigopets-backend` y el tipo de metrica `BUSSINESS`.
