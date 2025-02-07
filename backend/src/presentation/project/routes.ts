import { Router } from "express";
import { ProjectController } from "./controller";
import { ProjectService } from "../services";
// import { AuthController } from "./controller";
// import { AuthService, EmailService } from "../services";
// import { envs } from "../../config";

export class Projectroutes {
  static get routes(): Router {
    const router = Router();
    // const emailService = new EmailService(
    //   envs.MAILER_SERVICE,
    //   envs.MAILER_EMAIL,
    //   envs.MAILER_SECRET_KEY,
    //   envs.SEND_EMIAL
    // );
    // const authService = new AuthService(emailService, envs.WEBSERVICE_URL);

    // const controller = new AuthController(authService);
    // Definir las rutas
    // router.post("/login", controller.loginUser);
    // router.post("/register", controller.registerUser);

    // router.get("/validate-email/:token", controller.validateEmail);
    const service = new ProjectService();
    const controller = new ProjectController(service);
    // Projects CRUD routes
    router.get("/projects/:projectId", controller.getProject);

    router.put("/projects/:projectId", controller.updateProject);

    router.post("/projects", controller.createProject);

    router.delete("/projects/:projectId", (req, res) => {
      // Logic to delete a specific project
      res.send(`Delete project with ID: ${req.params.projectId}`);
    });

    // Sharing routes
    router.post("/projects/:projectId/share", controller.shareProject);

    // Collaboration routes
    router.post("/projects/:projectId/collaboration", (req, res) => {
      // Logic to accept or deny collaboration invite
      res.send(
        `Handle collaboration invite for project ID: ${req.params.projectId}`
      );
    });

    router.delete("/projects/:projectId/collaboration/:userId", controller.removeCollaborator);

    // Deletion request routes
    router.post("/projects/:projectId/deletion/request", controller.requestProjectDeletion);

    router.get("/projects/:projectId/deletion", controller.getDeletionDetails);

    // Logic to approve or reject deletion request
    router.put("/projects/:projectId/deletion", controller.handleDeletionRequest);

    // Verification routes
    router.get("/projects/:projectId/verification", controller.getVerificationStatus);

    router.put("/projects/:projectId/verification", controller.updateVerificationStatus);

    // Models CRUD routes
    router.get("/projects/:projectId/models/:modelId", (req, res) => {
      // Logic to get a specific model within a project
      res.send(
        `Get model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.put("/projects/:projectId/models/:modelId", (req, res) => {
      // Logic to update a specific model within a project
      res.send(
        `Update model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.delete("/projects/:projectId/models/:modelId", (req, res) => {
      // Logic to delete a specific model within a project
      res.send(
        `Delete model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.post("/projects/:projectId/models", (req, res) => {
      // Logic to create a new model within a project
      res.send(`Create a new model in project ID: ${req.params.projectId}`);
    });

    router.post(
      "/projects/:projectId/models/:modelId/collaboration",
      (req, res) => {
        // Logic to collaborate on a model within a project
        res.send(
          `Collaborate on model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.delete(
      "/projects/:projectId/models/:modelId/collaboration/:userId",
      (req, res) => {
        // Logic to remove a collaborator from a model within a project
        res.send(
          `Remove collaborator with ID: ${req.params.userId} from model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.post(
      "/projects/:projectId/models/:modelId/verification/request",
      (req, res) => {
        // Logic to request model verification within a project
        res.send(
          `Request verification for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.post("/projects/:projectId/models/:modelId/versions", (req, res) => {
      // Logic to create a new version from an existing one within a project
      res.send(
        `Create a new version for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.get("/projects/:projectId/models/:modelId/versions", (req, res) => {
      // Logic to get all versions of a model within a project
      res.send(
        `Get all versions for model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
      );
    });

    router.get(
      "/projects/:projectId/models/:modelId/versions/:versionId",
      (req, res) => {
        // Logic to get a specific version of a model within a project
        res.send(
          `Get version with ID: ${req.params.versionId} of model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.put(
      "/projects/:projectId/models/:modelId/versions/:versionId",
      (req, res) => {
        // Logic to update the state of a specific version of a model within a project
        res.send(
          `Update version with ID: ${req.params.versionId} of model with ID: ${req.params.modelId} in project ID: ${req.params.projectId}`
        );
      }
    );

    router.delete(
      "/projects/:projectId/models/:modelId/versions/:versionId",
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
