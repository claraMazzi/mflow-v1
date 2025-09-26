import { bcryptAdapter, jwtAdapter } from "../../config";
import { UserModel } from "../../data";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
  RecoverPasswordDto,
} from "../../domain";
import { EmailService } from "./email.service";

export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly webServiceUrl: string,
    private readonly frontEndUrl: string

  ) {}

  private sendEmailValidationLink = async (email: string) => {
    const token = await jwtAdapter.generateToken({ email });

    if (!token) throw CustomError.internalServer("Error getting token");
    //link de retorno
    // const link = `${this.webServiceUrl}/auth/validate-email/${token}`;
    const link = `${this.frontEndUrl}/auth/validate-email/?token=${token}`;

    const html = `<h1>Valida tu correo electrónico</h1>
    <p> Hace Click en el siguiente <a href=${link}>link</a> para validar tu correo electrónico </p>`;

    const options = {
      to: email,
      subject: "MFLOW - Valida tu correo electrónico",
      htmlBody: html,
    };

    const isSent = await this.emailService.sendEmail(options);
    if (!isSent)
      throw CustomError.internalServer("Error sending validation email");
  };
  
  async registerUser(registerUserDto: RegisterUserDto) {
    //1. verificar que no exista ese correo en la BD
    const existUser = await UserModel.findOne({ email: registerUserDto.email, deletedAt: null });
    if (existUser) throw CustomError.badRequest("Email already exists");

    try {
      const user = new UserModel(registerUserDto);

      //Encriptar la contraseña
      user.password = bcryptAdapter.hash(registerUserDto.password);
      await user.save();

      //mandar email de confirmacion
      // this.emailService.sendEmail()
      await this.sendEmailValidationLink(user.email);

      const { password, ...userEntity } = UserEntity.fromObject(user);

      //Retornar un JWT -- para mantener la autenticacion del usuario
      const token = await jwtAdapter.generateToken({ id: user.id });
      if (!token) throw CustomError.internalServer("Error while creating JWT");

      return { user: userEntity, token: token };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    //1. verificar que no exista ese correo en la BD
    const user = await UserModel.findOne({ email: loginUserDto.email, deletedAt: null });
    //este mensaje para no darle pista al usuario de que es lo que salio mal - por si lo hackean
    if (!user) throw CustomError.badRequest("Email or password don't exist");

    const passwordMatch = bcryptAdapter.compare(
      loginUserDto.password,
      user.password
    );

    if (!passwordMatch)
      throw CustomError.badRequest("Email or password don't exist");

    const { password, ...userEntity } = UserEntity.fromObject(user);

    //grabo el id del usuario en el JWT
    const token = await jwtAdapter.generateToken({ id: user.id });
    if (!token) throw CustomError.internalServer("Error while creating JWT");
    return {
      user: userEntity,
      token: token,
    };
  }


  public validateEmail = async (token: string) => {
    const payload = await jwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized("Invalid token");

    const { email } = payload as { email: string };

    if (!email) throw CustomError.internalServer("Email not in token");

    const user = await UserModel.findOne({ email, deletedAt: null });

    if (!user) throw CustomError.internalServer("Email does not exists");

    try {
      user.emailValidated = true;

      user.save();

      return true;
    } catch (error) {
      throw CustomError.internalServer("Validating email failed");
    }
  };

  public validatePasswordRecoverRequest = async (token: string) => {
    const payload = await jwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized("Invalid token");

    const { email, exp } = payload as { email?: string; exp?: number };

    if (!email) throw CustomError.internalServer("Email not in token");

    if (exp && Date.now() >= exp * 1000) {
      throw CustomError.unauthorized("Token has expired");
    }

    const user = await UserModel.findOne({ email, deletedAt: null });

    if (!user)
      throw CustomError.internalServer("Email does not exist in the system");

    return true;
  };

  private sendPasswordRecoveryLink = async (email: string) => {
    const token = await jwtAdapter.generateToken({ email });

    if (!token) throw CustomError.internalServer("Error getting token");
    //link de retorno
    // const link = `${this.webServiceUrl}/auth/password-recover/${token}`;
    const link = `${this.frontEndUrl}/auth/forgot-password/${token}`;

    const html = `<h1>Actualiza tu contraseña</h1>
    <p> Hace click en el siguiente <a href=${link}>link</a> para actualizar tu contraseña</p>`;

    const options = {
      to: email,
      subject: "MFLOW - Recuperar contraseña",
      htmlBody: html,
    };

    const isSent = await this.emailService.sendEmail(options);
    if (!isSent)
      throw CustomError.internalServer("Error sending password reset email");
  };

  public passwordRecover = async (email: string) => {
    const existUser = await UserModel.findOne({ email: email, deletedAt: null });
    if (!existUser) throw CustomError.badRequest("Email doesn't exists");
    await this.sendPasswordRecoveryLink(email);
  };

  public passwordRecoverUpdate = async (recoverDto: RecoverPasswordDto) => {
    const payload = await jwtAdapter.validateToken(recoverDto.email);
    if (!payload) throw CustomError.unauthorized("Invalid token");

    const { email } = payload as { email: string };
    const user = await UserModel.findOne({ email: email, deletedAt: null });

    if (!user) throw CustomError.badRequest("User doesn't exists");

    try {
      //Encriptar la contraseña
      user.password = bcryptAdapter.hash(recoverDto.newPassword);
      await user.save();

      const { password, ...userEntity } = UserEntity.fromObject(user);

      return { user: userEntity };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  };

}
