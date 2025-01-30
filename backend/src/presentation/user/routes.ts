import { Router } from "express";
import { UserService } from "../services";
import { UserController } from "./controller";

export class UserRoutes {
  static get routes(): Router {
    const router = Router();
    // const emailService = new EmailService(
    //   envs.MAILER_SERVICE,
    //   envs.MAILER_EMAIL,
    //   envs.MAILER_SECRET_KEY,
    //   envs.SEND_EMIAL
    // );
    // const authService = new AuthService(emailService, envs.WEBSERVICE_URL);

    // router.post("/login", controller.loginUser);
    // router.post("/register", controller.registerUser);

    // router.get("/validate-email/:token", controller.validateEmail);
    const service = new UserService();
    // const controller = new UserController(service);
    const controller = new UserController(service);

    // Definir las rutas

    router.get('/:id', controller.getUserById);
    router.put('/', controller.updateUserById);
    
     //solo lo puede llamar un admin
    router.delete('/:id', controller.deleteUser);
    router.get('/:id/roles', controller.getUserRoles);
    router.put('/:id/roles', controller.updateUserRole); //actualizar el rol de un usuario
    router.post('/invite', controller.inviteUserWithRole); //enviar el mail con la invitacion con rol
    router.put('/invite', controller.updateUserRoleWithInvitation); //si tiene un usuario creado hay que actualizar los roles de ese usuario y mandarlo a login, sino mandar a create account - aceptar o rechazar la invitacion 


    return router;
  }
}
