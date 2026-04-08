# Panorama De Negocio

## Conceptos Base

### Business

Es el tenant principal. Todo lo demas cuelga de un negocio:

- sedes
- servicios
- membresias
- bookings
- citas
- metricas
- reseñas

Cada negocio ademas tiene:

- plan
- estado operativo
- estado de suscripcion
- prefijo de consecutivos
- slug para links externos

### Plan

El plan define capacidad operativa maxima por periodo:

- empleados
- sedes
- bookings
- roles custom

El sistema no solo guarda el plan asignado; tambien mantiene subcolecciones `usage` para el consumo disponible por periodo.

### BusinessMembership

Relaciona un usuario con un negocio. Una membresia controla:

- si la persona pertenece al negocio
- si puede actuar como empleado
- que rol tiene
- a que sede queda asignada

Estados relevantes:

- `PENDING`
- `ACTIVE`
- `INACTIVE`
- `DELETED`

## Flujos Principales

### Creacion de negocio

- Se hace por `POST /business`.
- El email autenticado debe estar en `ROOT_USER_EMAILS`.
- El flujo crea negocio completo, servicios y sedes iniciales.
- El creador recibe o recupera una membresia `SUPER_ADMIN`.

### Registro de usuario interno

`POST /auth/register`:

- busca un negocio activo por `businessName`
- crea usuario en Firebase Auth
- crea usuario interno en `Users`
- crea membresia `PENDING`
- enlaza la membresia en la subcoleccion del usuario

### Cliente nuevo al crear booking/cita

Si el cliente no existe aun:

- se crea en `Users` con `isAuthActive = false`
- se normaliza su telefono al codigo de Colombia
- se crea una membresia `PENDING` en el negocio
- se le asigna el rol base de cliente

## Reglas De Operacion

### Membresias, roles y empleados

- Una membresia no puede activarse sin `roleId`.
- Solo una membresia `ACTIVE` puede marcarse como empleado.
- Solo un empleado `ACTIVE` puede recibir `branchId`.
- Quitar `isEmployee` o inactivar una membresia verifica que no existan citas activas asociadas.
- No se puede degradar al ultimo `SUPER_ADMIN` de un negocio.

### Sedes y servicios

- Los nombres de sedes son unicos dentro de cada negocio.
- Los nombres de servicios son unicos dentro de cada negocio.
- No se puede eliminar una sede con bookings activos.
- No se puede eliminar un servicio con citas activas.

### Usuarios

- El email debe ser unico.
- El documento debe ser unico.
- Al eliminar un usuario:
  - se elimina en Firebase Auth si existe
  - sus membresias pasan a `DELETED`
  - se guarda copia basica en `DeletedUsers`

### Planes y cupos

- Crear sedes consume cupo de `branches`.
- Marcar una membresia como empleado consume cupo de `employees`.
- Crear booking consume cupo de `bookings`.
- Crear roles custom consume cupo de `roles`.
- Al eliminar o deshacer ciertos recursos, el sistema libera cupos.
- Un plan no puede eliminarse si un negocio no eliminado lo sigue usando.

### Reseñas

- Una reseña puede apuntar a `EMPLOYEE` o `BRANCH`.
- Si trae `appointmentId`, el sistema impide reseñas duplicadas para la misma cita.
- Crear o borrar reseñas ajusta acumulados de score/reviews del objetivo.

### Negocios

- Inactivar un negocio marca sus membresias como `INACTIVE`.
- Reactivarlo garantiza de nuevo la membresia del creador como `SUPER_ADMIN`.
- El borrado de negocio es cascada operativa: memberships, roles, citas, bookings, metricas, reseñas, usage y archivos de storage.

## Metricas De Negocio

El backend calcula metricas para:

- negocio
- sede
- empleado

Indicadores soportados:

- revenue
- numero de citas
- average ticket
- cancellation rate
- completion rate
- productividad por empleado
- crecimiento del negocio

## Notificaciones

- Booking creado: WhatsApp de confirmacion + push a empleados
- Booking cancelado: WhatsApp de modificacion + push a empleados
- Booking finalizado: WhatsApp de cierre/finalizacion

Las notificaciones se intentan de forma best effort; un fallo de WhatsApp o push no revierte el booking.
