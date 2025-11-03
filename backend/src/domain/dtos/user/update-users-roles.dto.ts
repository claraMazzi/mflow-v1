import { emailRegex } from "../../../config";

//pongo los campos que necesito pasar por la request no mas
export class SendInvitationWithRolesDto {
  constructor(public readonly email: string, public readonly roles: string[]) {}

  static create(object: {
    [key: string]: any;
  }): [string?, SendInvitationWithRolesDto[]?] {
    const { users } = object;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return ["No se proporcionaron invitaciones para enviar."];
    }

    const usersDto: SendInvitationWithRolesDto[] = [];

    for (const user of users) {
      const { roles, email} = user;

      if (!email) {
        return ["Todas las invitaciones deben tener un correo electrónico asociado."];
      }

      if(!emailRegex.test(email)) {
        return [`El email '${email}' no tiene un formato válido.`];
      }

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return ["Todas las invitaciones deben tener al menos un rol asociado."];
      }

      usersDto.push(new SendInvitationWithRolesDto(email, roles));
    }

    return [undefined, usersDto];
  }
}
