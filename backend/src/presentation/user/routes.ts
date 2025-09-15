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

    // router.post("/login", controller.loginUser);
    // router.post("/register", controller.registerUser);

    // router.get("/validate-email/:token", controller.validateEmail);
    const service = new UserService(envs.FRONTEND_URL, emailService);
    // const controller = new UserController(service);
    const controller = new UserController(service);

    // Definir las rutas

    router.get("/:id", controller.getUserById);
    router.put("/", controller.updateUserById);

    //ADMIN ONLY
    router.get("/", AuthMiddleware.validateAdminRole, controller.getAllUsers);

    router.put(
      "/:id/roles",
      AuthMiddleware.validateAdminRole,
      controller.updateUserRolesById
    ); //actualizar el rol de un usuario

    router.delete("/:id", controller.deleteUser);

    //send invite mail with invitation token
    router.post(
      "/invite",
      AuthMiddleware.validateAdminRole,
      controller.inviteUsersWithRole
    ); 

    //user is not registered

    // router.put( //accept invitation with role 
    //   "/invite/:token",
    //   controller.updateUserRoleWithInvitation
    // ); 

    router.get(
      "/invite/:token",
      controller.getUserDataFromInvitation
    ); 

    return router;
  }
}
