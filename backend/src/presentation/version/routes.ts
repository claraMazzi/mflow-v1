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

		// Get version for read-only view (includes corrections if REVISADA)
		router.get("/:versionId/view", controller.getVersionForReadOnlyView);

		// Delete version (soft delete - changes state to "ELIMINADA")
		router.delete("/:versionId", controller.deleteVersion);

		return router;
	}
}
