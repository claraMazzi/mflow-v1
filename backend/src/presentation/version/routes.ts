import { Router } from "express";
import { ProjectService, EmailService, VersionService } from "../services";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { envs } from "../../config";

export class VersionRoutes {
	static get routes(): Router {
		const router = Router();

		const service = new VersionService();
		//const controller = new VersionController(service);

		//--------------------- Projects CRUD routes

		//create
		//router.post("/", controller.createVersion);

		//getById
		//router.get("/:versionId", controller.getProjectById);

		//Update version 
		//router.put("/:versionId", controller.updateProject);

		//Request Project Deletion project
		//router.post("/:projectId/deletion", controller.deleteVersion);

		return router;
	}
}
