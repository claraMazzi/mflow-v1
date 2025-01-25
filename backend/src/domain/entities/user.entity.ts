import { CustomError } from "../errors/custom.error";

export class UserEntity {
  constructor(
    public id: string,
    public name: string,
    public lastName: string,
    public email: string,
    public emailValidated: boolean,
    public password: string,
    public roles: string[]
  ) {}

  static fromObject(object: { [key: string]: any }) {
    const { id, _id, name, lastName, email, emailValidated, password, roles } = object;
    
    if (!_id && !id)throw CustomError.badRequest("Missing id");
    if (!name) throw CustomError.badRequest("Missing name");
    if (!lastName) throw CustomError.badRequest("Missing lastName");
    if (!email) throw CustomError.badRequest("Missing email");
    if (!password) throw CustomError.badRequest("Missing password");
    if (!roles) throw CustomError.badRequest("Missing roles");
    if (emailValidated === undefined)
      throw CustomError.badRequest("Missing email validated");

    return new UserEntity(
      _id || id,
      name,
      lastName,
      email,
      emailValidated,
      password,
      roles
    );
  }
}
