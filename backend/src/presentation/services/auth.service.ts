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

    const html = `<h1>Validate your email</h1>
    <p> Click on the following <a href=${link}>link</a> to validate your email </p>`;

    const options = {
      to: email,
      subject: "MFLOW - Validate your email",
      htmlBody: html,
    };

    const isSent = await this.emailService.sendEmail(options);
    if (!isSent)
      throw CustomError.internalServer("Error sending validation email");
  };
  
  async registerUser(registerUserDto: RegisterUserDto) {
    //1. verificar que no exista ese correo en la BD
    const existUser = await UserModel.findOne({ email: registerUserDto.email });
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
    const user = await UserModel.findOne({ email: loginUserDto.email });
    //este mensaje para no darle pista al usuario de que es lo que salio mal - por si lo hackean
    if (!user) throw CustomError.badRequest("Email or password don't exist");
    const passwordMatch = bcryptAdapter.compare(
      loginUserDto.password,
      user.password
    );
    if (!passwordMatch)
      throw CustomError.badRequest("Email or  password don't exist");

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

    const user = await UserModel.findOne({ email });

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

    const user = await UserModel.findOne({ email });

    if (!user)
      throw CustomError.internalServer("Email does not exist in the system");

    return true;
  };

  private sendPasswordRecoveryLink = async (email: string) => {
    const token = await jwtAdapter.generateToken({ email });

    if (!token) throw CustomError.internalServer("Error getting token");
    //link de retorno
    const link = `${this.webServiceUrl}/auth/password-recover/${token}`;

    const html = `<h1>Reset your password</h1>
    <p> Click on the following <a href=${link}>link</a> to reset your password</p>`;

    const options = {
      to: email,
      subject: "MFLOW - Reset your password",
      htmlBody: html,
    };

    const isSent = await this.emailService.sendEmail(options);
    if (!isSent)
      throw CustomError.internalServer("Error sending password reset email");
  };

  public passwordRecover = async (email: string) => {
    const existUser = await UserModel.findOne({ email: email });
    if (!existUser) throw CustomError.badRequest("Email doesn't exists");
    await this.sendPasswordRecoveryLink(email);
  };

  public passwordRecoverUpdate = async (recoverDto: RecoverPasswordDto) => {
    //1. verificar que no exista ese correo en la BD
    const user = await UserModel.findOne({ email: recoverDto.email });

    console.log(user, recoverDto.email);
    if (!user) throw CustomError.badRequest("User doesn't exists");

    const passwordMatch = bcryptAdapter.compare(
      recoverDto.oldPassword,
      user.password
    );
    if (!passwordMatch)
      throw CustomError.badRequest("Old password doesn't match");

    if (recoverDto.oldPassword.trim() === recoverDto.newPassword.trim())
      throw CustomError.badRequest(
        "New password cant be the same as old password"
      );
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
