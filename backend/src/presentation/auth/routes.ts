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
    const authService = new AuthService(emailService, envs.WEBSERVICE_URL);

    const controller = new AuthController(authService);
    // Definir las rutas
    router.post("/login", controller.loginUser);
    router.post("/register", controller.registerUser);

    router.get("/validate-email/:token", controller.validateEmail);

    return router;
  }
}
