import { Router } from "express";
import { EmailService, UserService } from "../services";
import { UserController } from "./controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { envs } from "../../config";

export class UserRoutes {
  static get routes(): Router {
    const router = Router();
    const emailService = new EmailService(
      envs.MAILER_SERVICE,
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY,
      envs.SEND_EMIAL
    );
    // const authService = new AuthService(emailService, envs.WEBSERVICE_URL);

    const service = new UserService(envs.FRONTEND_URL, emailService);
    const controller = new UserController(service);

    //ADMIN ONLY
    router.get(
      "/all",
      AuthMiddleware.validateJWT,
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.getAllUsers
    );

    router.put(
      "/:id/roles",
      AuthMiddleware.validateJWT,
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.updateUserRolesById
    ); //actualizar el rol de un usuario

    router.delete("/:id", controller.deleteUser);

    //send invite mail with invitation token
    router.post(
      "/invite",
      AuthMiddleware.validateJWT,
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.inviteUsersWithRole
    );

    router.get("/invite/:token", controller.getUserDataFromInvitation);

    // COMMON ROUTES
    router.get("/", AuthMiddleware.validateJWT, controller.getLoggedUser);
    router.put("/", AuthMiddleware.validateJWT, controller.updateUserById);
    router.get("/:id", AuthMiddleware.validateJWT, controller.getUserById);

    return router;
  }
}
