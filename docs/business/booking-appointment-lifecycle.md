# Ciclo De Vida De Bookings Y Appointments

## Estados

### Booking

- `CREATED`
- `CANCELLED`
- `FINISHED`
- `DELETED`

### Appointment

- `CREATED`
- `IN_PROGRESS`
- `CANCELLED`
- `FINISHED`
- `DELETED`

## Reglas De Creacion

### Al crear un booking

El backend exige:

- al menos una cita
- fecha y hora futuras
- negocio y sede validos
- cliente existente o datos suficientes para crearlo
- servicios vigentes del negocio
- empleado activo en el negocio
- horario dentro de la agenda de la sede
- ausencia de traslape del empleado en el mismo dia

Efectos:

- consume 1 cupo de booking
- crea booking `CREATED`
- crea citas `CREATED`
- recalcula revenue asociado
- programa tasks automáticas por cita
- intenta enviar WhatsApp de confirmacion
- intenta enviar push a empleados involucrados

### Al crear una cita suelta

Si llega `bookingId`:

- la cita se agrega al booking existente
- el booking debe estar en `CREATED`

Si no llega `bookingId`:

- el sistema crea primero un booking `CREATED`
- luego crea la cita
- despues sincroniza tasks, metricas y notificaciones igual que en booking nuevo

## Reglas De Edicion

### Booking

No puede editarse si esta:

- `CANCELLED`
- `FINISHED`
- `DELETED`

Cambios permitidos sobre booking en `CREATED`:

- cambiar sede
- cambiar cliente
- cambiar medio de pago
- cambiar `paidAmount`
- agregar, cancelar o editar citas mediante `operations`

Restricciones:

- no puede quedar sin citas salvo que se este eliminando
- no puede referenciar servicios eliminados en una edicion
- no puede editar citas `IN_PROGRESS` o `DELETED`

### Appointment

No puede editarse si esta en:

- `IN_PROGRESS`
- `CANCELLED`
- `FINISHED`
- `DELETED`

Excepcion:

- una cita `CANCELLED` si puede volver a `CREATED`

Al editar una cita:

- vuelve a `CREATED`
- limpia `cancelledAt` y `deletedAt`
- reprograma sus tasks automáticas

## Pagos Y Totales

### Booking

- `paymentStatus` se calcula como `PENDING`, `PARTIALLY_PAID` o `PAID`
- `paidAmount` no puede ser mayor a `totalAmount`
- no se aceptan abonos en bookings `CANCELLED` o `DELETED`
- no se aceptan abonos superiores al saldo pendiente

### Recalculo de total

El `totalAmount` del booking se recalcula usando solo citas activas:

- se excluyen citas `CANCELLED`
- se excluyen citas `DELETED`

## Sincronizacion Entre Booking Y Citas

### Propagacion desde booking hacia citas

Cuando el booking cambia de estado manualmente:

- `CANCELLED` intenta cancelar todas las citas
- `FINISHED` intenta finalizar todas las citas
- `DELETED` elimina todas las citas
- `CREATED` solo restaura citas que esten `CANCELLED`

Restricciones importantes:

- una cita `FINISHED` no puede pasar a `CANCELLED` ni volver a `CREATED`
- una cita `DELETED` no puede volver a otros estados
- si una cita esta `FINISHED`, el booking no puede marcarse `CANCELLED`
- un booking `FINISHED` no puede volver a `CREATED`

### Propagacion desde citas hacia booking

El booking se sincroniza automaticamente solo cuando todas sus citas quedan exactamente en el mismo estado y ese estado es:

- `CREATED`
- `CANCELLED`
- `FINISHED`
- `DELETED`

Si las citas quedan en estado mixto o aparece `IN_PROGRESS`:

- el booking conserva su estado anterior
- solo se recalculan `totalAmount`, `paymentStatus` y `updatedAt`

## Matriz Rapida De Appointment

| Estado actual | Editar datos | Cancelar | Finalizar | Eliminar | Volver a `CREATED` |
| --- | --- | --- | --- | --- | --- |
| `CREATED` | Si | Si | Si | Si | Ya esta en `CREATED` |
| `IN_PROGRESS` | No | Si | Si | Si | No |
| `CANCELLED` | No | Ya esta cancelada | Si | Si | Si |
| `FINISHED` | No | No | Ya esta finalizada | Si | No |
| `DELETED` | No | No | No | Ya esta eliminada | No |

## Automatizaciones

### Tasks por cita

Cada cita programa dos tasks:

- `appointment-status-in-progress`
- `appointment-status-finished`

Objetivo:

- pasar la cita a `IN_PROGRESS` al llegar la hora de inicio
- pasarla a `FINISHED` al llegar la hora de fin

Notas de ejecucion:

- las horas se interpretan en horario de Bogota
- el scheduler agrega 30 segundos de gracia

## Reprogramacion y limpieza de tasks

- al editar una cita: se eliminan y recrean
- al restaurar una cita a `CREATED`: se eliminan y recrean
- al cancelar una cita: se eliminan
- al finalizar una cita: se eliminan
- al eliminar una cita: se eliminan

## Notificaciones

### Booking creado

Se intenta enviar:

- WhatsApp `APPOINTMENT_CONFIRMATION`
- push `BOOKING_CREATED` a los empleados de las citas

### Booking cancelado

Se intenta enviar:

- WhatsApp `APPOINTMENT_MODIFICATION`
- push `BOOKING_CANCELLED` a los empleados afectados

### Booking finalizado

Se intenta enviar WhatsApp `APPOINTMENT_COMPLETION` en dos escenarios:

1. finalizacion manual del booking
2. finalizacion automatica de la ultima cita pendiente, cuando el booking termina quedando `FINISHED`

## Metricas Y Reviews

### Metricas de appointments

Los cambios de estado afectan conteos de:

- citas
- citas completadas
- citas canceladas

### Revenue

El revenue no se toma simplemente del precio del servicio. El backend:

- captura snapshot del booking antes y despues del cambio
- distribuye `paidAmount` proporcionalmente entre citas elegibles
- actualiza `paidCompletedRevenue` y `paidCompletedAppointments` cuando aplica

### Reviews

- al eliminar una cita se eliminan reseñas ligadas a `appointmentId`
- al eliminar un booking se eliminan reseñas de sus citas

## Casos Limite Importantes

- Un booking `DELETED` no puede regresar a otro estado.
- Un appointment `DELETED` no puede regresar a otro estado.
- Un appointment `FINISHED` tampoco puede volver a `CREATED`.
- Cancelar una cita `FINISHED` esta prohibido.
- Finalizar manualmente una cita `CANCELLED` si es posible segun la logica actual.
- Finalizar manualmente un booking `CANCELLED` tambien es posible segun la logica actual.
- Si falla WhatsApp, push o tasks, el flujo principal no se revierte salvo que el error ocurra en validaciones o persistencia critica.
