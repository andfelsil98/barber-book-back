# Booking and Appointment Status Logic

Este documento resume la logica actual del backend para `bookings` (agendamientos) y `appointments` (citas).

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

## Tabla rapida de acciones por estado de cita

| Estado de la cita | Editar | Cancelar | Finalizar | Eliminar | Volver a `CREATED` |
| --- | --- | --- | --- | --- | --- |
| `CREATED` | Si | Si | Si | Si | Ya esta en `CREATED` |
| `IN_PROGRESS` | No | Si | Si | Si | No |
| `CANCELLED` | No | Ya esta cancelada | Si | Si | Si |
| `FINISHED` | No | No | Ya esta finalizada | Si | No |
| `DELETED` | No | No | No | Ya esta eliminada | No |

## Reglas importantes para citas

- Una cita en `IN_PROGRESS` no se puede editar.
- Una cita en `IN_PROGRESS` si se puede:
  - marcar como `CANCELLED`
  - marcar como `FINISHED`
  - marcar como `DELETED`
- Una cita en `FINISHED` no se puede cancelar ni volver a `CREATED`.
- Una cita en `CANCELLED` si se puede restaurar a `CREATED`.
- Una cita en `DELETED` no se puede seguir cambiando.

## Que pasa con una cita `IN_PROGRESS` si cambias el booking

| Cambio en el booking | Resultado de una cita `IN_PROGRESS` |
| --- | --- |
| Booking -> `CANCELLED` | La cita pasa a `CANCELLED` |
| Booking -> `FINISHED` | La cita pasa a `FINISHED` |
| Booking -> `DELETED` | La cita pasa a `DELETED` |

## Restricciones del booking

- Un booking no se puede marcar en `CANCELLED` si alguna de sus citas esta en `FINISHED`.
- Un booking si se puede marcar en `CANCELLED` aunque tenga citas en `IN_PROGRESS`.
- Un booking si se puede marcar en `FINISHED` aunque tenga citas en `IN_PROGRESS`.
- Un booking `FINISHED` no se puede devolver a `CREATED`.

## Tasks automaticas por cita

Cada cita crea dos tasks automaticas:

- `appointment-status-in-progress`
- `appointment-status-finished`

Estas tasks sirven para cambiar automaticamente la cita cuando llega la hora de inicio o la hora de fin.

## Que pasa con las tasks si la cita cambia manualmente

- Si la cita se cancela, se eliminan las tasks pendientes.
- Si la cita se finaliza manualmente, se eliminan las tasks pendientes.
- Si la cita se elimina, se eliminan las tasks pendientes.
- Si la cita vuelve a `CREATED`, las tasks se reprograman otra vez con la fecha y hora actuales de la cita.

## WhatsApp de finalizacion / calificacion

No existe una task separada solo para "pedir calificacion". El envio sale del flujo de finalizacion.

Hay dos caminos:

1. Finalizacion automatica por task:
   - corre la task `appointment-status-finished`
   - la cita pasa a `FINISHED`
   - si el booking queda `FINISHED`, se envia el WhatsApp `APPOINTMENT_COMPLETION`

2. Finalizacion manual:
   - la cita o el booking pasan a `FINISHED`
   - se eliminan las tasks pendientes para no duplicar ejecuciones futuras
   - el WhatsApp de finalizacion se envia inmediatamente desde el flujo manual

## Resumen practico

- `IN_PROGRESS` no bloquea cancelar, finalizar o eliminar.
- `IN_PROGRESS` si bloquea editar.
- Si finalizas manualmente, no se espera a la task futura: el mensaje se envia en ese momento.
- Si cancelas, la task pendiente se elimina y el mensaje de finalizacion ya no se envia.

