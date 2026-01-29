import { Router } from "express";
import { RevisionService } from "../services/revision.service";
import { RevisionController } from "./controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class RevisionRoutes {
	static get routes(): Router {
		const router = Router();

		const service = new RevisionService();
		const controller = new RevisionController(service);

		// ADMIN only: verifier request management (static paths first)
		router.get(
			"/verifier-requests/pending",
			AuthMiddleware.validateRequiredRoles(["ADMIN"]),
			controller.getPendingVerifierRequests
		);
		router.get(
			"/verifier-requests/finalized",
			AuthMiddleware.validateRequiredRoles(["ADMIN"]),
			controller.getFinalizedVerifierRequests
		);
		router.get(
			"/verifier-requests/:verifierRequestId",
			AuthMiddleware.validateRequiredRoles(["ADMIN"]),
			controller.getVerifierRequestById
		);
		router.post(
			"/verifier-requests/:verifierRequestId/assign",
			AuthMiddleware.validateRequiredRoles(["ADMIN"]),
			controller.assignVerifierToRequest
		);

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

