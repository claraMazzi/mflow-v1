import 'dotenv/config';
import * as env from 'env-var';


export const envs = {
  PORT: env.get('PORT').required().asPortNumber(),
  
  SEND_EMIAL: env.get('SEND_EMAIL').required().asBool(),
  MAILER_SERVICE: env.get('MAILER_SERVICE').required().asString(),
  MAILER_EMAIL: env.get('MAILER_EMAIL').required().asEmailString(),
  MAILER_SECRET_KEY: env.get('MAILER_SECRET_KEY').required().asString(),
  WEBSERVICE_URL: env.get('WEBSERVICE_URL').required().asString(),
  FRONTEND_URL: env.get('FRONTEND_URL').required().asString(),

  PROD: env.get('PROD').required().asBool(),

  JWT_SEED: env.get('JWT_SEED').required().asString(),

  // Mongo DB
  MONGO_URL: env.get('MONGO_URL').required().asString(),
  MONGO_DB_NAME: env.get('MONGO_DB_NAME').required().asString(),
  MONGO_USER: env.get('MONGO_USER').required().asString(),
  MONGO_PASS: env.get('MONGO_PASS').required().asString(),
}