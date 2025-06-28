import { Router } from "express";
import { ProjectController } from "./controller";
import { ProjectService, EmailService } from "../services";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { envs } from "../../config";

export class ProjectRoutes {
  static get routes(): Router {
    const router = Router();
    const emailService = new EmailService(
      envs.MAILER_SERVICE,
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY,
      envs.SEND_EMIAL
    );

    const service = new ProjectService(emailService, envs.WEBSERVICE_URL, envs.FRONTEND_URL);
    const controller = new ProjectController(service);

    
    //--------------------- Projects CRUD routes
  
    //create
    router.post("/", AuthMiddleware.validateJWT, controller.createProject);
    //get projects by user
    router.get("/", AuthMiddleware.validateJWT, controller.getUserProjects);
    //getById
    router.get("/:projectId", AuthMiddleware.validateJWT, controller.getProjectById);
    //Update project data - name and desc
    router.put("/:projectId", AuthMiddleware.validateJWT, controller.updateProject);

    //Request Project Deletion project
    router.post("/:projectId/deletion", AuthMiddleware.validateJWT, controller.requestProjectDeletion);
    //Get delition request details per project
    router.get("/:projectId/deletion", controller.getDeletionDetails);

    //Delete project -- verifier only
    router.delete("/:projectId", controller.deleteProject);



    // // Logic to approve or reject deletion request
    // router.put("/:projectId/deletion", controller.handleDeletionRequest);

    //----------------------------------------------



    // Sharing routes
    router.post("/:projectId/share", controller.shareProject);

    // Collaboration routes
    router.post("/:projectId/collaboration", (req, res) => {
      // Logic to accept or deny collaboration invite
      res.send(
        `Handle collaboration invite for project ID: ${req.params.projectId}`
      );
    });

    //remove collaborator
    router.delete(
      "/:projectId/collaboration/:userId",
      controller.removeCollaborator
    );

    // Verification routes
    router.get("/:projectId/verification", controller.getVerificationStatus);

    router.put("/:projectId/verification", controller.updateVerificationStatus);

    // Models CRUD routes
    router.get("/:projectId/models/:modelId", (req, res) => {
      // Logic to get a specific model within a project
      res.send(
        `Get model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.put("/:projectId/models/:modelId", (req, res) => {
      // Logic to update a specific model within a project
      res.send(
        `Update model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.delete("/:projectId/models/:modelId", (req, res) => {
      // Logic to delete a specific model within a project
      res.send(
        `Delete model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.post("/:projectId/models", (req, res) => {
      // Logic to create a new model within a project
      res.send(`Create a new model in project ID: ${req.params.projectId}`);
    });

    router.post("/:projectId/models/:modelId/collaboration", (req, res) => {
      // Logic to collaborate on a model within a project
      res.send(
        `Collaborate on model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.delete(
      "/:projectId/models/:modelId/collaboration/:userId",
      (req, res) => {
        // Logic to remove a collaborator from a model within a project
        res.send(
          `Remove collaborator with ID: ${req.params.userId} from model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.post(
      "/:projectId/models/:modelId/verification/request",
      (req, res) => {
        // Logic to request model verification within a project
        res.send(
          `Request verification for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.post("/:projectId/models/:modelId/versions", (req, res) => {
      // Logic to create a new version from an existing one within a project
      res.send(
        `Create a new version for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.get("/:projectId/models/:modelId/versions", (req, res) => {
      // Logic to get all versions of a model within a project
      res.send(
        `Get all versions for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.get(
      "/:projectId/models/:modelId/versions/:versionId",
      (req, res) => {
        // Logic to get a specific version of a model within a project
        res.send(
          `Get version with ID: ${req.params.versionId} of model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.put(
      "/:projectId/models/:modelId/versions/:versionId",
      (req, res) => {
        // Logic to update the state of a specific version of a model within a project
        res.send(
          `Update version with ID: ${req.params.versionId} of model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.delete(
      "/:projectId/models/:modelId/versions/:versionId",
      (req, res) => {
        // Logic to delete a specific version of a model within a project
        res.send(
          `Delete version with ID: ${req.params.versionId} of model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );
    return router;
  }
}
