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
    
    if (!_id && !id) throw CustomError.badRequest("Falta el identificador del usuario.");
    if (!name) throw CustomError.badRequest("Falta el nombre del usuario.");
    if (!lastName) throw CustomError.badRequest("Falta el apellido del usuario.");
    if (!email) throw CustomError.badRequest("Falta el correo electrónico del usuario.");
    if (!password) throw CustomError.badRequest("Falta la contraseña del usuario.");
    if (!roles) throw CustomError.badRequest("Faltan los roles del usuario.");
    if (emailValidated === undefined)
      throw CustomError.badRequest("Falta el estado de validación del correo electrónico.");

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
