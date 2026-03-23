import { Router } from "express";
import { ProjectController } from "./controller";
import { ProjectService, EmailService, VersionService } from "../services";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { envs } from "../../config";
import { VersionController } from "../version/controller";

export class ProjectRoutes {
  static get routes(): Router {
    const router = Router();
    const emailService = new EmailService(
      envs.RESEND_API_KEY,
      envs.RESEND_FROM_EMAIL,
      envs.SEND_EMIAL
    );

    const service = new ProjectService(
      emailService,
      envs.WEBSERVICE_URL,
      envs.FRONTEND_URL
    );
    const controller = new ProjectController(service);

    //--------------------- Projects CRUD routes

    //create
    router.post("/", controller.createProject);

    //get projects by user
    router.get("/", controller.getUserProjects);

    //get user shared projects
    router.get("/shared", controller.getUserSharedProjects);

    //getById
    router.get("/:projectId", controller.getProjectById);

    // Check if user can access project versions list (owner/collaborator/admin; not shared-reader only)
    router.get("/:projectId/can-access-versions", controller.getCanAccessProjectVersions);

    //getById with versions
    router.get("/:projectId/versions", controller.getProjectByIdWithVersions);

    //Update project data - name and desc
    router.put("/:projectId", controller.updateProject);

    //Request Project Deletion project
    router.post("/:projectId/deletion", controller.requestProjectDeletion);

    //Get delition request details per project
    router.get(
      "/:projectId/deletion",
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.getDeletionDetails
    );

    //Delete project -- admin only
    router.delete(
      "/:projectId",
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.deleteProject
    );

    // Sharing routes
    router.post(
      "/:projectId/share",
      controller.sendProjectCollaborationInvitation
    );

    //get project sharing link
    router.get("/:projectId/share", controller.getProjectSharingLink);

    //add collaborator to project with invitation token
    router.post("/share/:token", controller.addCollaboratorToProject);

    //get project data from invitation token
    router.get("/share/:token", controller.getProjectFromInvitationToken);

    //remove collaborator
    router.delete(
      "/:projectId/collaboration/:collaboratorToRemove",
      controller.removeCollaborator
    );

    // Verification routes
    router.get("/:projectId/verification", controller.getVerificationStatus);

    router.put("/:projectId/verification", controller.updateVerificationStatus);

    return router;
  }
}
