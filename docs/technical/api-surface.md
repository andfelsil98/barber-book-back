# Superficie API

## Convenciones

- No existe prefijo global como `/api` o `/v1`.
- La paginacion comun usa `page` y `pageSize`.
- Defaults: `page = 1`, `pageSize = 20`.
- Maximo: `pageSize = 100`.

## Headers Relevantes

### `Authorization`

Formato:

```text
Authorization: Bearer <firebase-id-token>
```

Se exige en rutas privadas.

### `businessId`

Se exige en rutas privadas que no sean publicas ni exentas de contexto multiempresa.

### `x-internal-task-token`

Se usa para automatizaciones internas:

- `POST /whatsapp/send-message/:type`
- `POST /business/usage/reconcile-today`

## Reglas De Acceso Actuales

### Prefijos publicos

Estas rutas quedan publicas por prefijo segun `PUBLIC_ROUTE_PREFIXES`:

- `/auth`
- `/branches`
- `/services`
- `/appointments`
- `/modules`
- `/permissions`
- `/roles`

### Rutas publicas exactas o por prefijo

- `GET /business`
- `GET /business-memberships`
- `GET /users`
- `GET /reviews`
- `GET /bookings*`
- `POST /reviews`
- `POST /bookings`
- `PUT /bookings*`
- `POST /whatsapp/send-message*`
- `POST /business/usage/reconcile-today`
- `GET /plans`

### Rutas privadas exentas de `businessId`

- `POST /business`
- `POST /business-memberships/create-by-document`
- `PUT /business*`
- `PATCH /business*`
- `DELETE /business*`
- `POST /plans`
- `PUT /plans*`
- `DELETE /plans*`
- `POST /push-notifications*`
- `DELETE /push-notifications*`

## Modulos Expuestos

| Base path | Operaciones | Notas |
| --- | --- | --- |
| `/auth` | `POST /register`, `POST /login` | Publico |
| `/business` | `GET /`, `POST /`, `POST /usage/reconcile-today`, `PUT /:id`, `PATCH /:id/toggle-status`, `DELETE /:id` | `POST /` exige usuario root por email; reconcile usa token interno |
| `/branches` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | Publico por prefijo actual |
| `/services` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | Publico por prefijo actual |
| `/modules` | `GET /`, `POST /`, `DELETE /:id` | Publico por prefijo actual |
| `/permissions` | `GET /`, `POST /`, `DELETE /:id` | Publico por prefijo actual |
| `/roles` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | Publico por prefijo actual |
| `/business-memberships` | `GET /`, `POST /create-by-document`, `PATCH /:id/toggle-status`, `PATCH /:id/toggle-employee`, `POST /assign-role`, `POST /assign-branch` | `GET /` es publico; `POST /create-by-document` es privado sin `businessId` |
| `/users` | `GET /`, `PATCH /:id`, `DELETE /:document` | `GET /` es publico |
| `/appointments` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | Publico por prefijo actual |
| `/bookings` | `GET /`, `POST /`, `POST /:id/payments`, `PUT /:id`, `DELETE /:id` | `GET`, `POST` y `PUT` quedan publicos actualmente |
| `/reviews` | `GET /`, `POST /`, `DELETE /:id` | `GET` y `POST` son publicos |
| `/whatsapp` | `POST /send-message/:type` | Requiere `x-internal-task-token` aunque auth lo trate como publico |
| `/metrics` | `GET /` | Privado y normalmente requiere `businessId` |
| `/plans` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` | `GET` es publico; mutaciones privadas sin `businessId` |
| `/push-notifications` | `POST /subscriptions`, `DELETE /subscriptions/:deviceId` | Privado, sin `businessId` |

## Filtros Mas Relevantes

### `GET /appointments`

Soporta:

- `businessId`
- `id`
- `employeeId`
- `bookingId`
- `includeDeletes`
- `startDate`
- `endDate`
- `sameDate`

Reglas:

- `sameDate=true` exige `startDate`
- `sameDate=true` no permite `endDate`

### `GET /bookings`

Soporta:

- `id`
- `businessId`
- `clientId`
- `consecutive`
- `status`
- `includeDeletes`

### `GET /business`

Soporta:

- `id`
- `slug`
- `consecutivePrefix`

Cuando se consulta por `id`, el servicio tambien adjunta `usage`.

### `GET /metrics`

Parametros principales:

- `metricTypes`
- `entityType`
- `businessId`
- `branchId`
- `employeeId`
- `timeframe`
- `startDate`
- `endDate`
- `sameDate`

Notas:

- `entityType` debe ser `BUSSINESS`, `BRANCH` o `EMPLOYEE`
- `metricTypes` admite aliases como `revenue`, `appointments_count`, `average_ticket`, `business_growth`

## Restricciones De Seguridad Que Tambien Son Parte Del Contrato

- `POST /business` solo puede ejecutarlo un email listado en `ROOT_USER_EMAILS`.
- `POST /whatsapp/send-message/:type` y `POST /business/usage/reconcile-today` dependen de `x-internal-task-token`.
- El middleware de `businessId` tambien valida plan y suscripcion activa del negocio antes de entrar al controlador.
