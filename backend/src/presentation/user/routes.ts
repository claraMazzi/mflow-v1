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

    const service = new UserService(envs.FRONTEND_URL, emailService);
    const controller = new UserController(service);

    //UNAUTHENTICATED ROUTES
    router.get("/invite/:token", controller.getUserDataFromInvitation);

    //AUTHENTICATED ROUTES
    router.use(AuthMiddleware.validateJWT);

    //ADMIN ONLY
    router.get(
      "/all",
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.getAllUsers
    );

    router.put(
      "/:id/roles",
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.updateUserRolesById
    ); //actualizar el rol de un usuario

    router.delete("/:id", 
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.deleteUser);

    //send invite mail with invitation token
    router.post(
      "/invite",
      AuthMiddleware.validateRequiredRoles(["ADMIN"]),
      controller.inviteUsersWithRole
    );

    // COMMON ROUTES
    router.get("/", controller.getLoggedUser);
    router.put("/", controller.updateUserById);
    router.get("/:id", controller.getUserById);

    return router;
  }
}
