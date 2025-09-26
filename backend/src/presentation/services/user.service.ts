import { UserModel } from "../../data";
import {
  CustomError,
  PasswordUpdateDto,
  UpdateUserDto,
  UserEntity,
} from "../../domain";
import { UpdateUserRolesDto } from "../../domain/dtos/user/update-user-roles.dto";
import { UpdateUsersRolesDto } from "../../domain/dtos/user/update-users-roles.dto";
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
    user: UpdateUsersRolesDto;
  }) => {
    const token = await jwtAdapter.generateToken(
      { senderId: senderId, userEmail: user.email, roles: user.roles },
      "7d"
    );

    if (!token) throw CustomError.internalServer("Error getting token");
    //link de retorno
    const link = `${this.frontEndUrl}/share/user/?token=${token}`;

    const html = `<h1>Has sido invitado/a a ser ${user.roles.map(
      (role) => role
    )}</h1>
        <p> Hace Click en el siguiente <a href=${link}>link</a> para aceptar la invitación </p>`;

    const options = {
      to: user.email,
      subject: "MFLOW - Invitación a la plataforma",
      htmlBody: html,
    };

    const isSent = await this.emailService.sendEmail(options);

    if (!isSent)
      throw CustomError.internalServer("Error sending sharing email");
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

    try {
      if (name) user.name = name;
      if (lastName) user.lastName = lastName;

      user.save();
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
  }

  async updateUserRolesById({ roles, id }: UpdateUserRolesDto) {
    const user = await UserModel.findOne({ _id: id, deletedAt: null });
    if (!user) throw CustomError.badRequest("User does not exists");

    if (!roles || !Array.isArray(roles) || !roles.length)
      throw CustomError.badRequest("No data sent to update");

    if (
      roles.length === user.roles.length &&
      roles.every((role, index) => role === user.roles[index])
    )
      throw CustomError.badRequest("No data was updated");

    try {
      user.roles = roles;
      user.save();
      return {
        user: UserEntity.fromObject(user),
        message: "User roles updated successfully",
      };
    } catch (error) {
      throw CustomError.internalServer(`${error}`);
    }
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

  async inviteUsersWithRole(dto: UpdateUsersRolesDto[], senderId: string) {
    await Promise.all(
      dto.map(async (userData) => {
        const { email } = userData;

        const adminUser = await UserModel.findOne({ _id: senderId, deletedAt: null });
     
        if(!adminUser)
          throw CustomError.badRequest("Admin user does not exists");

        if (adminUser.email === email)
          throw CustomError.badRequest("You can't update your own roles");

      
        await this.sendEmailInvitationLink({
          user: userData,
          senderId,
        });
      })
    );

    return {
      message: "Invitations sent successfully",
    };
  }


  async getUserDataFromInvitation (token: string) {
    const payload = await jwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unauthorized("Invalid token");

    const { senderId, userEmail, roles } = payload as {
      userEmail: string;
      senderId: string;
      roles: string[];
    };
    if (!userEmail || !senderId) throw CustomError.internalServer("Not valid token");

    return {
      email: userEmail,
      roles: roles,
    };


  }
  /** Esto actualizar y sacar la old password, esto es para un UPDATE PASSOWRD */

  public passwordUpdate = async (recoverDto: PasswordUpdateDto) => {
    //1. verificar que no exista ese correo en la BD
    const user = await UserModel.findOne({ email: recoverDto.email, deletedAt: null });

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
