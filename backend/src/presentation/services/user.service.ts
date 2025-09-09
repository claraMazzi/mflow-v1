import { bcryptAdapter } from "../../config";
import { UserModel } from "../../data";
import { CustomError, PasswordUpdateDto, UpdateUserDto, UserEntity } from "../../domain";

export class UserService {
  constructor() {}

  async getUserById(id: string) {
    const user = await UserModel.findOne({ _id: id });
    if (!user) throw CustomError.badRequest("User does not exists");

    const { password, ...userEntity } = UserEntity.fromObject(user);
    return {
      user: userEntity,
    };
  }

  async getAllUsers(id: string) {
    const users = await UserModel.find({ _id: { $ne: id } });

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

  async updateUserById({name, lastName, id}: UpdateUserDto) {

    const user = await UserModel.findOne({ _id: id });
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

  async deleteUser(id:string) {

    const user = await UserModel.findOne({ _id: id });
    if (!user) throw CustomError.badRequest("User does not exists");
   
    try {
        await UserModel.deleteOne({ id: id });
    } catch (error) {
        throw CustomError.internalServer(`${error}`);
    }
  }

    /** Esto actualizar y sacar la old password, esto es para un UPDATE PASSOWRD */

public passwordUpdate = async (recoverDto: PasswordUpdateDto) => {
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
