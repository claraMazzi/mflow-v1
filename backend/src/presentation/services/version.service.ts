import { bcryptAdapter } from "../../config";
import { UserModel, VersionModel } from "../../data";
import { CreateVersionDto, CustomError, PasswordUpdateDto, UpdateUserDto, UserEntity } from "../../domain";

export class VersionService {
  constructor() {}

  async createVersion({} : CreateVersionDto) {
  }

  async getVersionById(id: string) {
    const version = await VersionModel.findById(id).exec();
    if (!version) throw CustomError.notFound("User does not exists");

    //const versionEntity = VersionEntity.fromObject(version);
    const versionEntity = version;

    return {
      version: version,
    };
  }

  async updateUserById({name, lastName, id}: UpdateUserDto) {

    const user = await UserModel.findOne({ id: id });
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

    const user = await UserModel.findOne({ id: id });
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
