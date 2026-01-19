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

		// Get revision by ID with version data
		router.get("/:revisionId", controller.getRevisionById);

		// Start a revision (change state from PENDIENTE to EN CURSO)
		router.post("/:revisionId/start", controller.startRevision);

		// Save corrections for a revision
		router.put("/:revisionId/corrections", controller.saveCorrections);

		// Finalize a revision
		router.post("/:revisionId/finalize", controller.finalizeRevision);

		// Request revision for a version
		router.post("/request/:versionId", controller.requestRevision);

		return router;
	}
}

