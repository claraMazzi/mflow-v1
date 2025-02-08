import { Request, Response } from "express";
import { CustomError, LoginUserDto, RegisterUserDto, RecoverPasswordDto} from "../../domain";
import { AuthService } from "../services/auth.service";

export class AuthController {
  constructor(readonly authService: AuthService) {}

  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    console.log(`${error}`);
    return res.status(500).json({ error: "Internal server error" });
  };

  registerUser = (req: Request, res: Response) => {
    const [error, registerDto] = RegisterUserDto.create(req.body);

    if (error) return res.status(400).json({ error });

    this.authService
      .registerUser(registerDto!)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  loginUser = (req: Request, res: Response) => {
    const [error, loginDto] = LoginUserDto.create(req.body);
    if (error) return res.status(400).json({ error });

    this.authService
      .loginUser(loginDto!)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };

  validateEmail = (req: Request, res: Response) => {
    const { token } = req.params;
    this.authService
      .validateEmail(token)
      .then(() => res.json("Email validated"))
      .catch((error) => this.handleError(error, res));
  };

  passwordRecoverRequest = (req: Request, res: Response) => {
    const { email} = req.body;
    this.authService
      .passwordRecover(email)
      .then(() => res.json("Recovery email sent succesfully"))
      .catch((error) => this.handleError(error, res));
  };

  validateRecoverRequest = (req: Request, res: Response) => {
    const { token } = req.params;

    this.authService
      .validatePasswordRecoverRequest(token)
      .then(() => res.json("Password Recover Request Accepted"))
      .catch((error) => this.handleError(error, res));
  };

  passwordRecoverUpdate = (req: Request, res: Response) => {
    const [error, recoverDto] = RecoverPasswordDto.create(req.body);

    if (error) return res.status(400).json({ error });

    this.authService
      .passwordRecoverUpdate(recoverDto!)
      .then((user) => res.json(user))
      .catch((error) => this.handleError(error, res));
  };
}

