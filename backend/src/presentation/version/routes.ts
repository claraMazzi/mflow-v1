import { Router } from "express";
import { VersionService } from "../services";
import { VersionController } from "./controller";

export class VersionRoutes {
	static get routes(): Router {
		const router = Router();

		const service = new VersionService();
		const controller = new VersionController(service);

		//--------------------- Version CRUD routes

		// Create version
		router.post("/", controller.createVersion);

		// TODO: Implement these routes
		// router.get("/:versionId", controller.getVersionById);
		// router.put("/:versionId", controller.updateVersion);
		// router.delete("/:versionId", controller.deleteVersion);

		return router;
	}
}
