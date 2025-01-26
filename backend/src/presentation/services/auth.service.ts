import { bcryptAdapter, jwtAdapter } from "../../config";
import { UserModel } from "../../data";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from "../../domain";
import { EmailService } from "./email.service";

export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private readonly webServiceUrl: string
  ) {}

  async registerUser(registerUserDto: RegisterUserDto) {
    //aca hacemos todo el proceso para registrar un usuario

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

  private sendEmailValidationLink = async (email: string) => {
    const token = await jwtAdapter.generateToken({ email });

    if (!token) throw CustomError.internalServer("Error getting token");
    //link de retorno
    const link = `${this.webServiceUrl}/auth/validate-email/${token}`;

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

  public validateEmail = async (token:string) =>{
    const payload = await jwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized('Invalid token');
    const { email} = payload as {email: string};

    if(!email) throw CustomError.internalServer('Email not in token');

    const user = await UserModel.findOne({ email });

    if(!user) throw CustomError.internalServer('Email does not exists');

    try {
      user.emailValidated = true;

      user.save();

      return true;
      
    } catch (error) {
      throw CustomError.internalServer('Validating email failed');
    }
  }
}
