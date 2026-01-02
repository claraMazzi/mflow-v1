import mongoose from "mongoose";
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
		private readonly frontEndUrl: string
	) {}

	private sendEmailValidationLink = async ({
		userId,
		email,
	}: {
		userId: string;
		email: string;
	}) => {
		const token = await jwtAdapter.generateToken({ email, userId });

		if (!token) {
			throw CustomError.internalServer(
				"Ocurrió un error al enviar el email de verificación."
			);
		}
		//link de retorno
		const link = `${this.frontEndUrl}/validate-email/?token=${token}`;

		const html = `<h1>Validá tu correo electrónico</h1>
    <p> Hacé click en el siguiente <a href=${link}>link</a> para validar tu correo electrónico. </p>`;

		const options = {
			to: email,
			subject: "MFLOW - Validá tu correo electrónico",
			htmlBody: html,
		};

		const isSent = await this.emailService.sendEmail(options);
		if (!isSent)
			throw CustomError.internalServer(
				"Ocurrió un error al enviar el email de verificación."
			);
	};

	async registerUser(registerUserDto: RegisterUserDto) {
		//1. verificar que no exista ese correo en la BD
		const existUser = await UserModel.findOne({
			email: registerUserDto.email,
			deletedAt: null,
		});

		if (existUser) {
			throw CustomError.badRequest(
				"Ya existe un usuario con el correo electrónico ingresado."
			);
		}

		let user;
		try {
			user = new UserModel(registerUserDto);

			//Encriptar la contraseña
			user.password = bcryptAdapter.hash(registerUserDto.password);
			await user.save();
		} catch (error) {
			console.error(`Error ocurred while registering a user: `, error);
			throw CustomError.internalServer(
				`Ha ocurrido un error interno en el servidor.`
			);
		}

		try {
			//mandar email de confirmacion
			await this.sendEmailValidationLink({
				userId: user.id,
				email: user.email,
			});
		} catch (error) {
			console.error(
				`Failed to send the verification email for: ${user.email} - `,
				error
			);
		}

		const { password, ...userEntity } = UserEntity.fromObject(user);

		return { user: userEntity };
	}

	async loginUser(loginUserDto: LoginUserDto) {
		//1. verificar que no exista ese correo en la BD
		const user = await UserModel.findOne({
			email: loginUserDto.email,
			deletedAt: null,
		});
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
		if (!payload)
			throw CustomError.unauthorized(
				"El token de verificación es inválido o ha expirado."
			);

		const { email, userId } = payload as { email: string; userId: string };

		if (!email)
			throw CustomError.internalServer(
				"No se pudo obtener el email del usuario."
			);

		if (!userId)
			throw CustomError.internalServer(
				"No se puedo obtener el identificador del usuario."
			);

		const user = await UserModel.findOne({
			_id: userId,
			email: email,
			deletedAt: null,
		});

		if (!user)
			throw CustomError.internalServer(
				"El usuario no existe o fue dado de baja."
			);

		try {
			user.emailValidated = true;

			user.save();

			return true;
		} catch (error) {
			throw CustomError.internalServer(
				"La validación del correo electrónico falló."
			);
		}
	};

	public validatePasswordRecoverRequest = async (token: string) => {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) throw CustomError.badRequest("El token es inválido.");

		const { email, userId } = payload as { email: string; userId: string };

		if (!email) {
			console.error("Email missing in recorver password token: ", token);
			throw CustomError.badRequest("El token es inválido.");
		}
		if (!userId) {
			console.error("User Id missing in recorver password token: ", token);
			throw CustomError.badRequest("El token es inválido.");
		}

		const user = await UserModel.findOne({
			_id: userId,
			email,
			deletedAt: null,
		});

		if (!user) {
			throw CustomError.notFound("El usuario no existe o fue dado de baja.");
		}
	};

	private sendPasswordRecoveryLink = async ({
		email,
		userId,
	}: {
		email: string;
		userId: string;
	}) => {
		const token = await jwtAdapter.generateToken({ email, userId });

		if (!token)
			throw CustomError.internalServer(
				"Ocurrió un error al generar el token para restablecer la contraseña."
			);
		//link de retorno
		const link = `${this.frontEndUrl}/forgot-password/${token}`;

		const html = `<h1>Actualizá tu contraseña</h1>
    <p> Hacé click en el siguiente <a href=${link}>link</a> para actualizar tu contraseña. </p>`;

		const options = {
			to: email,
			subject: "MFLOW - Recuperar contraseña",
			htmlBody: html,
		};

		const isSent = await this.emailService.sendEmail(options);
		if (!isSent)
			throw CustomError.internalServer(
				"Ocurrió un error al enviar el correo para restablecer la contraseña."
			);
	};

	public passwordRecover = async (email: string) => {
		const registeredUser = await UserModel.findOne({
			email: email,
			deletedAt: null,
		});
		if (!registeredUser) return;
		await this.sendPasswordRecoveryLink({ email, userId: registeredUser.id });
	};

	public passwordRecoverUpdate = async (recoverDto: RecoverPasswordDto) => {
		const payload = await jwtAdapter.validateToken(recoverDto.token);
		if (!payload) throw CustomError.badRequest("El token es inválido.");

		const { email, userId } = payload as { email: string, userId: string };
		const user = await UserModel.findOne({ _id: userId, email: email, deletedAt: null });

		if (!user) throw CustomError.badRequest("El usuario no existe o fue dado de baja.");

		try {
			//Encriptar la contraseña
			user.password = bcryptAdapter.hash(recoverDto.newPassword);
			await user.save();

			const { password, ...userEntity } = UserEntity.fromObject(user);

			return { user: userEntity };
		} catch (error) {
			console.error("Update password: ", error)
			throw CustomError.internalServer("Se ha producido un error. Por favor, inténtelo de nuevo más tarde.");
		}
	};
}
