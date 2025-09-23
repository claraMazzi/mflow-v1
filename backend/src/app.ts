import { MongoDatabase } from "./data";
import { Server } from "./presentation/server";
import { envs } from "./config";
//Funcion anonima auto invocada
(async () => {
  main();
})();

async function main() {
  await MongoDatabase.connect({
      mongoUrl: envs.MONGO_URL,
      dbName: envs.MONGO_DB_NAME
  });
  const server = new Server({
    port: envs.PORT,
    frontEndURL: envs.FRONTEND_URL,
  });
  server.start();
}
