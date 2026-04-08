# Modelo De Datos

## Convenciones

- Firestore es la base de datos principal.
- Los documentos suelen persistir `createdAt`, `updatedAt`, `cancelledAt` y `deletedAt` como `Timestamp`.
- `FirestoreService` convierte esos timestamps a ISO string al responder.
- Varias entidades usan soft delete por `status = "DELETED"` y/o `deletedAt`.

## Colecciones Principales

### `Businesses`

Representa el tenant principal del sistema.

Campos clave:

- `name`, `type`, `slug`
- `planId`
- `subscriptionStatus`
- `consecutivePrefix`
- `employees`
- `status`

Subcolecciones:

- `usage`: periodos de cupos segun plan

### `Plans`

Define capacidad por negocio:

- `billingInterval`
- `maxEmployees`
- `maxBranches`
- `maxBookings`
- `maxRoles`

### `Branches`

Sedes de un negocio.

Campos clave:

- `businessId`
- `name`, `address`, `location`
- `phone`, `phoneHasWhatsapp`
- `schedule`
- `status`

### `Services`

Catalogo de servicios por negocio.

Campos clave:

- `businessId`
- `name`
- `duration`
- `price`
- `status`

### `Users`

Usuarios internos o clientes.

Campos clave:

- `name`, `email`, `phone`
- `document`, `documentTypeId`, `documentTypeName`
- `isAuthActive`

Subcolecciones:

- `businessMemberships`: links de membresias por usuario
- `pushNotificationSubscriptions`: dispositivos push por usuario

### `DeletedUsers`

Bitacora de usuarios eliminados. Se usa al borrar un usuario para conservar trazabilidad basica.

### `BusinessMemberships`

Relacion entre usuario y negocio.

Campos clave:

- `businessId`
- `userId`
- `roleId`
- `isEmployee`
- `branchId`
- `status`
- `score`, `reviews`

Notas:

- `userId` puede contener el `id` del usuario o su `document`; el servicio maneja ambas variantes por compatibilidad.

### `Roles`

Roles globales o custom.

Campos clave:

- `type`: `GLOBAL` o `CUSTOM`
- `businessId` cuando es custom
- `permissionsCount`

Subcolecciones:

- `Permissions`: snapshot de permisos asignados al rol

### `Modules`

Catalogo funcional para agrupar permisos.

### `Permissions`

Permisos base reutilizables.

Campos clave:

- `moduleId`
- `name`
- `value`

### `Bookings`

Cabecera comercial del agendamiento.

Campos clave:

- `businessId`, `branchId`
- `consecutive`
- `appointments`
- `clientId`
- `status`
- `totalAmount`
- `paidAmount`
- `paymentStatus`
- `paymentMethod`

### `Appointments`

Unidad operativa de agenda.

Campos clave:

- `businessId`
- `bookingId`
- `date`, `startTime`, `endTime`
- `serviceId`
- `employeeId`
- `status`

Notas de compatibilidad:

- Existen citas legacy con arreglo `services[]` en lugar de `serviceId/startTime/endTime`.
- El servicio resuelve ambos formatos al leerlas.

### `Reviews`

Calificaciones de sucursal o empleado.

Campos clave:

- `businessId`, `branchId`
- `targetType`: `EMPLOYEE` o `BRANCH`
- `targetId`
- `bookingId`
- `appointmentId` opcional
- `reviewerId`, `reviewerName`
- `score`, `comment`

### `Metrics`

Documentos agregados para negocio, sede o empleado.

Campos clave:

- `type`: `BUSSINESS`, `BRANCH`, `EMPLOYEE`
- `timeFrame`: `DAILY`, `MONTHLY`
- `businessId`, `branchId`, `employeeId`
- `date` o `month`
- `revenue`
- `appointments`
- `completedAppointments`
- `cancelledAppointments`
- `paidCompletedRevenue`
- `paidCompletedAppointments`

## Relaciones Importantes

- Un `Business` tiene muchas `Branches`, `Services`, `BusinessMemberships`, `Bookings`, `Reviews` y `Metrics`.
- Un `Booking` tiene muchas `Appointments`.
- Una `Appointment` puede originar cero o una `Review`.
- Un `User` puede tener multiples `BusinessMemberships`.
- Un `Role` tiene una subcoleccion `Permissions`.

## Notas Tecnicas Y Legacy

- La subcoleccion de negocio usa nombre real `usage` en minuscula.
- La subcoleccion de usuario para membresias usa `businessMemberships` en minuscula.
- La subcoleccion de rol usa `Permissions` con P mayuscula.
- El borrado de archivos de sedes/negocios usa prefijos de storage con el texto legacy `bussinesses/`.
