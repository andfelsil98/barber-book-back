# Integraciones Y Operacion

## Integraciones Externas

### Firebase Admin

Se usa para:

- inicializar Firestore
- validar tokens de Firebase Auth
- crear, actualizar y eliminar usuarios en Auth
- enviar push web con FCM
- borrar archivos de storage en algunos flujos de limpieza

Dependencia critica:

- `FIREBASE_CREDENTIALS_PATH`

### Firestore

Es la persistencia principal del dominio. `FirestoreService` centraliza:

- CRUD basico
- consultas paginadas
- manejo de subcolecciones
- conversion de timestamps
- logging de queries lentas

### Google Cloud Tasks

Se usa para automatizaciones diferidas de citas.

Comportamiento actual:

- por cada cita creada o reprogramada se crean dos tasks:
  - `appointment-status-in-progress`
  - `appointment-status-finished`
- el proveedor sincroniza `maxAttempts` de la cola al arrancar el flujo
- los task ids son deterministicos para evitar duplicados accidentales

Endpoint interno de ejecucion:

- `POST /whatsapp/send-message/:type`

Header requerido:

```text
x-internal-task-token: <CLOUD_TASKS_INTERNAL_TOKEN>
```

### Infobip WhatsApp API

Proveedor actual para plantillas.

Plantillas configuradas:

- `APPOINTMENT_CONFIRMATION` -> `book_confirmation`
- `APPOINTMENT_MODIFICATION` -> `book_cancellation`
- `APPOINTMENT_COMPLETION` -> `book_finished`

Validaciones relevantes:

- el telefono se normaliza a formato internacional sin `+`
- si Infobip devuelve rechazo o mensaje no entregable, se levanta `INFOBIP_MESSAGE_REJECTED`

### Firebase Cloud Messaging

Se usa para push web a empleados con suscripciones activas.

Comportamiento relevante:

- las suscripciones viven en `Users/{userId}/pushNotificationSubscriptions`
- un `deviceId` se desasocia de otros usuarios antes de registrar la nueva suscripcion
- los tokens invalidos se limpian automaticamente
- el link final de la notificacion se construye con `FRONTEND_APP_BASE_URL`

## Variables De Entorno

### Base

- `PORT`
- `FIREBASE_CREDENTIALS_PATH`
- `FIREBASE_STORAGE_BUCKET`
- `ENV`

### WhatsApp / Infobip

- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_WHATSAPP_SENDER`

### Cloud Tasks

- `CLOUD_TASKS_PROJECT_ID`
- `CLOUD_TASKS_LOCATION`
- `CLOUD_TASKS_QUEUE`
- `CLOUD_TASKS_MAX_ATTEMPTS`
- `CLOUD_TASKS_TARGET_BASE_URL`
- `CLOUD_TASKS_INTERNAL_TOKEN`

### Outbox

- El procesamiento del outbox se ejecuta por HTTP en `POST /outbox/process`.
- Las eliminaciones de negocio programan una Cloud Task inmediata contra ese endpoint.
- En dev existe el Cloud Scheduler `outbox-process-dev`, que llama `/outbox/process?limit=20` cada minuto como respaldo.
- El runner en memoria queda desactivado para no depender de CPU idle en Cloud Run.

### Frontend / Push

- `FRONTEND_APP_BASE_URL`
- `PUSH_NOTIFICATIONS_ENABLED`

## Flujos Operativos Importantes

### Alta de booking

1. Se valida negocio, sede, cliente, servicios, horarios y conflictos.
2. Se consume cupo de booking del plan.
3. Se crean booking y citas.
4. Se sincronizan metricas de revenue.
5. Se programan tasks automáticas.
6. Se intenta enviar WhatsApp de confirmacion.
7. Se intenta enviar push a empleados involucrados.

### Finalizacion de cita

Puede ocurrir por flujo manual o task programada.

Cuando una cita termina:

- se actualiza su estado
- se sincroniza el booking si aplica
- se actualizan metricas
- se eliminan tasks pendientes
- si el booking queda `FINISHED`, se envia WhatsApp de finalizacion

### Reconciliacion de cupos

Endpoint interno:

- `POST /business/usage/reconcile-today`

Objetivo:

- activar o desactivar periodos `usage`
- recalcular `subscriptionStatus`
- corregir cupos restantes con base en recursos realmente consumidos

## Operacion Diaria

- Desarrollo: `npm run dev`
- Revision de tipos: `npm run typecheck`
- Build: `npm run build`
- Ejecucion build: `npm run start`

## Riesgos Operativos A Tener Presentes

- No hay test suite automatizada para regresiones.
- El rate limit es en memoria; no se comparte entre replicas.
- No hay healthcheck dedicado.
- Varias automatizaciones dependen de que `CLOUD_TASKS_INTERNAL_TOKEN` y `CLOUD_TASKS_TARGET_BASE_URL` esten correctos.
