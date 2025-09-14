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
    // router.get('/:id/roles', controller.getUserRoles);

    router.post(
      "/invite",
      AuthMiddleware.validateAdminRole,
      controller.inviteUsersWithRole
    ); //enviar el mail con la invitacion con rol

    router.put(
      "/invite/:token",
      AuthMiddleware.validateJWT,
      controller.updateUserRoleWithInvitation
    ); //si tiene un usuario creado hay que actualizar los roles de ese usuario y mandarlo a login, sino mandar a create account - aceptar o rechazar la invitacion

    router.get(
      "/invite/:token",
      AuthMiddleware.validateJWT,
      controller.getUserRolesFromInvitation
    ); 

    return router;
  }
}
