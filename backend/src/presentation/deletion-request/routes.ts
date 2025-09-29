import { Router } from "express";
import { DeletionRequestController } from "./controller";
import { DeletionRequestService } from "../services/deletion-request.service";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class DeletionRequestRoutes {
  static get routes(): Router {
    const router = Router();
    const service = new DeletionRequestService();
    const controller = new DeletionRequestController(service);

    //--------------------- Deletion Request CRUD routes

    // Get all deletion requests (admin only)
    router.get("/", controller.getAllDeletionRequests);

    // Get deletion requests by state (admin only)
    router.get("/state/:state", controller.getDeletionRequestsByState);

    // Get deletion requests by project ID
    router.get("/project/:projectId", controller.getDeletionRequestsByProject);

    // Get a specific deletion request by ID
    router.get("/:deletionRequestId", controller.getDeletionRequestById);

    // Approve a deletion request (admin only)
    router.put(
      "/:deletionRequestId/approve",
      controller.approveDeletionRequest
    );

    // Deny a deletion request (admin only)
    router.put("/:deletionRequestId/deny", controller.denyDeletionRequest);

    return router;
  }
}
