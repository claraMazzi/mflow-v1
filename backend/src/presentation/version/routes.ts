import { Router } from "express";
import { VersionService } from "../services";
import { VersionController } from "./controller";
import { EmailService } from "../services/email.service";
import { envs } from "../../config";

export class VersionRoutes {
	static get routes(): Router {
		const router = Router();
		const emailService = new EmailService(
			envs.MAILER_SERVICE,
			envs.MAILER_EMAIL,
			envs.MAILER_SECRET_KEY,
			envs.SEND_EMIAL
		);
		const service = new VersionService(envs.FRONTEND_URL, emailService);
		const controller = new VersionController(service);

		// Share routes (must be before :versionId)
		router.get("/shared", controller.getSharedVersionsForUser);
		router.get("/share/:token", controller.getVersionFromShareToken);
		router.post("/share/:token", controller.addReaderToVersion);

		// Version CRUD routes
		router.post("/", controller.createVersion);
		router.get("/:versionId/check-access", controller.checkVersionAccess);
		router.get("/:versionId/view", controller.getVersionForReadOnlyView);
		router.delete("/:versionId", controller.deleteVersion);

		// Version share management
		router.get("/:versionId/share", controller.getVersionSharingLink);
		router.post("/:versionId/share", controller.sendVersionShareInvitation);
		router.get("/:versionId/readers", controller.getVersionWithReaders);
		router.delete("/:versionId/readers/:readerId", controller.removeReaderFromVersion);

		return router;
	}
}
