import { Router } from "express";
import { AuthController } from "./controller";
import { AuthService, EmailService } from "../services";
import { envs } from "../../config";

export class Authroutes {
  static get routes(): Router {
    const router = Router();
    const emailService = new EmailService(
      envs.MAILER_SERVICE,
      envs.MAILER_EMAIL,
      envs.MAILER_SECRET_KEY,
      envs.SEND_EMIAL
    );
    const authService = new AuthService(emailService, envs.WEBSERVICE_URL, envs.FRONTEND_URL);

    const controller = new AuthController(authService);
    // Definir las rutas

    //login - registration
    router.post("/login", controller.loginUser);
    router.post("/register", controller.registerUser);
    router.get("/validate-email/:token", controller.validateEmail);

    /** para usar un middleware se puede hacer de 2 formas 
     
    mandar el router.get("/ruta", Authmiddleware.validateJWT , controller.funcion);
    o mandar un arreglo de middlewares router.get("/ruta", [Authmiddleware.validateJWT], controller.funcion);
     */

    //Password recovery
    router.post("/password-recover", controller.passwordRecoverRequest);
    router.get("/password-recover/:token", controller.validateRecoverRequest);
    router.put("/password-recover", controller.passwordRecoverUpdate);

  

    return router;
  }
}
