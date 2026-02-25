// Asegura que las variables de entorno definidas en tu archivo .env se carguen en process.env antes de que el resto del código las intente utilizar
import "dotenv/config";
import env from "env-var";

export const envs = {
  PORT: env.get("PORT").required().asPortNumber(),
  FIREBASE_CREDENTIALS_PATH: env.get("FIREBASE_CREDENTIALS_PATH").required().asString(),
  ENV: env.get("ENV").required().asString(),
  ROOT_USER_EMAIL: env
    .get("ROOT_USER_EMAIL")
    .default("felipe@hotmail.com")
    .asString(),
};
