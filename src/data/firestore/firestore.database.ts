import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { Timestamp } from 'firebase-admin/firestore';
interface ConnectionOptions {
  credential: string | ServiceAccount;
  storageBucket?: string;
}

export class FirestoreDataBase {
  private static dbInstance: admin.firestore.Firestore | null = null;
  private static isInitialized = false;
  static async connect(options: ConnectionOptions){
    const { credential } = options;
    if (!this.dbInstance){
      try {
        const storageBucket = options.storageBucket?.trim();
        const appOptions: admin.AppOptions = {
          credential: admin.credential.cert(credential),
        };
        if (storageBucket != null && storageBucket !== "") {
          appOptions.storageBucket = storageBucket;
        }
        admin.initializeApp(appOptions);
        this.dbInstance = admin.firestore();
         this.isInitialized = true;
        console.log("🔥 Firestore conectado correctamente");
      } catch (error) {
        console.error("❌ Error al conectar Firestore", error);
        throw error;
      }
    }
    return this.dbInstance;
  }

  static getDB(): admin.firestore.Firestore {
    if (!this.dbInstance) {
      throw new Error("Firestore no ha sido inicializado. Llama a `connect` primero.");
    }
    return this.dbInstance;
  }

  static getAdmin(): typeof admin {
    if (!this.isInitialized) {
      throw new Error("Firebase no ha sido inicializado.");
    }
    return admin;
  }

  static generateTimeStamp(): Timestamp{
    return Timestamp.fromDate(new Date());
  }

}
