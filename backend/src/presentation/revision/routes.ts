import { Router } from "express";
import { RevisionService } from "../services/revision.service";
import { RevisionController } from "./controller";

export class RevisionRoutes {
	static get routes(): Router {
		const router = Router();

		const service = new RevisionService();
		const controller = new RevisionController(service);

		// Get revisions by state (PENDIENTE, EN CURSO, FINALIZADA)
		router.get("/state/:state", controller.getRevisionsByState);

		// Request revision for a version
		router.post("/request/:versionId", controller.requestRevision);

		return router;
	}
}

