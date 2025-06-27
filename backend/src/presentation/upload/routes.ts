import { Router } from "express";
import { UploadService } from "../services";
import { UploadController } from "./controller";
import { envs } from "../../config";

export class UploadRoutes {
  static get routes(): Router {
    const router = Router();

    const service = new UploadService({baseUploadDirectory: `${process.cwd()}/uploads`, uploadServiceBaseUrl: envs.WEBSERVICE_URL + "/uploads"});
    const controller = new UploadController(service);

    // Definir las rutas
    router.get('/:versionId/conceptual-model/:propertyPath', controller.getVersionResource);

    return router;
  }
}
