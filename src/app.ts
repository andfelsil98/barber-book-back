import { envs } from './config/envs';
import { FirestoreDataBase } from './data/firestore/firestore.database';
import { AppRoutes } from './presentation/routes';
import { Server } from './presentation/server';
import { createOutboxProcessorService } from './presentation/outbox/outbox.factory';
import { OutboxProcessorRunnerService } from './presentation/services/outbox-processor-runner.service';
import { outboxProcessorRuntimeConfig } from './config/runtime.config';
import fs from 'fs';



(async() => {
  try {
    await main();
  } catch (error) {
    console.error("Error launching the app:", error);
  }
})()

async function main() {
  const firebaseCredentials = JSON.parse(
    fs.readFileSync(envs.FIREBASE_CREDENTIALS_PATH, 'utf-8')
  );
  await FirestoreDataBase.connect({
    credential: firebaseCredentials,
    storageBucket: envs.FIREBASE_STORAGE_BUCKET,
  })
  const server = new Server({
    port: envs.PORT,
    routes: AppRoutes.routes
  })  
  server.start();

  if (outboxProcessorRuntimeConfig.enabled) {
    const outboxProcessorService = createOutboxProcessorService();
    const outboxProcessorRunner = new OutboxProcessorRunnerService(
      outboxProcessorService,
      {
        intervalMs: outboxProcessorRuntimeConfig.intervalMs,
      }
    );
    outboxProcessorRunner.start();
  }
}
