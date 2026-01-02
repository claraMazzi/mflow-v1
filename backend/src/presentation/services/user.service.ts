import { UserModel } from "../../data";
import {
	CustomError,
	PasswordUpdateDto,
	UpdateUserDto,
	UserEntity,
} from "../../domain";
import { UpdateUserRolesDto } from "../../domain/dtos/user/update-user-roles.dto";
import { SendInvitationWithRolesDto } from "../../domain/dtos/user/send-invitation-with-roles.dto";
import { EmailService } from "./email.service";
import { bcryptAdapter, jwtAdapter } from "../../config";

export class UserService {
	constructor(
		private readonly frontEndUrl: string,
		private readonly emailService: EmailService
	) {}

	private sendEmailInvitationLink = async ({
		user,
		senderId,
	}: {
		senderId: string;
		user: SendInvitationWithRolesDto;
	}) => {
		const token = await jwtAdapter.generateToken(
			{ senderId: senderId, userEmail: user.email, roles: user.roles },
			"7d"
		);

		if (!token) {
			throw CustomError.internalServer(
				"Ocurrió un error al generar las invitaciones."
			);
		}

		const frontendInvitationLink = `${this.frontEndUrl}/share/user/?token=${token}`;

		const html = `<h1>Has sido invitado/a a ser ${user.roles.map(
			(role) => role
		)}</h1>
        <p> Hacé click en el siguiente <a href=${frontendInvitationLink}>link</a> para aceptar la invitación. </p>`;

		const options = {
			to: user.email,
			subject: "MFLOW - Invitación a la plataforma",
			htmlBody: html,
		};

		const isSent = await this.emailService.sendEmail(options);

		if (!isSent) {
			throw CustomError.internalServer(
				"Ocurrió un error al enviar las invitaciones."
			);
		}
	};

	async getUserById(id: string) {
		const user = await UserModel.findOne({ _id: id, deletedAt: null });
		if (!user) throw CustomError.badRequest("User does not exists");

		const { password, ...userEntity } = UserEntity.fromObject(user);
		return {
			user: userEntity,
		};
	}

	async getAllUsers(id: string) {
		const users = await UserModel.find({ _id: { $ne: id }, deletedAt: null });

		if (!users) throw CustomError.badRequest("No Users to query");

		const usersEntity = users.map((user) => {
			const { password, ...userEntity } = UserEntity.fromObject(user);
			return userEntity;
		});
		return {
			users: usersEntity,
			count: usersEntity.length,
		};
	}

	async updateUserById({ name, lastName, id }: UpdateUserDto) {
		const user = await UserModel.findOne({ _id: id, deletedAt: null });
		if (!user) throw CustomError.badRequest("User does not exists");

		if (!name && !lastName)
			throw CustomError.badRequest("No data sent to update");

		if (name === user.name && lastName === user.lastName)
			throw CustomError.badRequest("No updated data");

		if (name) user.name = name;
		if (lastName) user.lastName = lastName;

		await user.save();
	}

	async updateUserRolesById({ roles: newRoles, id }: UpdateUserRolesDto) {
		const user = await UserModel.findOne({ _id: id, deletedAt: null });
		if (!user) throw CustomError.notFound("El usuario no pudo ser encontrado.");

		if (
			newRoles.length === user.roles.length &&
			newRoles.every((role) => user.roles.includes(role))
		) {
			throw CustomError.badRequest(
				"No se detectaron cambios en los roles asignados al usuario."
			);
		}

		user.roles = newRoles;
		await user.save();

		return {
			user: UserEntity.fromObject(user),
			message: "Los roles del usuario se han modificado exitosamente.",
		};
	}

	async deleteUser(id: string) {
		const user = await UserModel.findOne({ _id: id, deletedAt: null });
		if (!user) throw CustomError.badRequest("User does not exists");

		try {
			user.deletedAt = new Date();
			await user.save();
		} catch (error) {
			throw CustomError.internalServer(`${error}`);
		}
	}

	async inviteUsersWithRole(
		invitations: SendInvitationWithRolesDto[],
		senderId: string
	) {
		await Promise.all(
			invitations.map(async (userData) => {
				await this.sendEmailInvitationLink({
					user: userData,
					senderId,
				});
			})
		);

		return {
			message: "Las invitaciones fueron enviadas exitosamente.",
		};
	}

	async getUserDataFromInvitation(token: string) {
		const payload = await jwtAdapter.validateToken(token);
		if (!payload) throw CustomError.badRequest("Token de invitación inválido.");

		const { senderId, userEmail, roles } = payload as {
			userEmail: string;
			senderId: string;
			roles: string[];
		};
		if (!userEmail || !senderId)
			throw CustomError.internalServer("Token de invitación inválido.");

		return {
			email: userEmail,
			roles: roles,
		};
	}
	/** Esto actualizar y sacar la old password, esto es para un UPDATE PASSOWRD */

	public passwordUpdate = async (recoverDto: PasswordUpdateDto) => {
		//1. verificar que no exista ese correo en la BD
		const user = await UserModel.findOne({
			email: recoverDto.email,
			deletedAt: null,
		});

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
