import { UserModel } from "../../data";
import { CustomError, UpdateUserDto, UserEntity } from "../../domain";

export class UserService {
  constructor() {}

  async getUserById(id: string) {
    const user = await UserModel.findOne({ id: id });
    if (!user) throw CustomError.badRequest("User does not exists");

    const { password, ...userEntity } = UserEntity.fromObject(user);

    return {
      user: userEntity,
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
}
