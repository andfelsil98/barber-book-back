# Cutlyy Back

Backend de Cutlyy para autenticacion, negocios, membresias, agenda, pagos de bookings, reseñas, metricas y notificaciones.

## Stack

- Node.js 22
- TypeScript
- Express 5
- Firebase Admin / Firestore / Auth / Storage / Messaging
- Google Cloud Tasks
- Infobip WhatsApp API

## Puesta En Marcha

1. Instala dependencias con `npm install`.
2. Configura las variables de entorno descritas en [docs/technical/integrations-and-operations.md](docs/technical/integrations-and-operations.md).
3. Ejecuta `npm run dev`.
4. Valida tipos con `npm run typecheck`.
5. Genera build con `npm run build`.

## Scripts

- `npm run dev`: modo desarrollo con `tsx watch`
- `npm run typecheck`: validacion TypeScript sin emitir archivos
- `npm run build`: build ESM con `tsup`
- `npm run start`: ejecuta `dist/app.js`

## Documentacion

La documentacion central vive en [docs/README.md](docs/README.md).

- Arquitectura y runtime: [docs/technical/system-overview.md](docs/technical/system-overview.md)
- Modelo de datos: [docs/technical/data-model.md](docs/technical/data-model.md)
- Superficie API: [docs/technical/api-surface.md](docs/technical/api-surface.md)
- Integraciones y operacion: [docs/technical/integrations-and-operations.md](docs/technical/integrations-and-operations.md)
- Reglas de negocio: [docs/business/domain-overview.md](docs/business/domain-overview.md)
- Ciclo de vida booking/cita: [docs/business/booking-appointment-lifecycle.md](docs/business/booking-appointment-lifecycle.md)

## Notas

- El paquete todavia conserva el nombre legado `bigopets-backend` en `package.json`.
- No hay suite automatizada de tests configurada actualmente; el script `test` es un placeholder.
