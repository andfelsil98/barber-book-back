/**
 * Campos de fecha que comparten todas las colecciones.
 * En Firestore se guardan como Timestamp; en respuestas al cliente se envían como string ISO.
 */
export interface WithTimestamps {
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}
