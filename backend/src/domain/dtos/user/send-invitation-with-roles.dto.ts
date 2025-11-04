import { emailRegex } from "../../../config";
import { USER_ROLES } from "../../../data";

export class SendInvitationWithRolesDto {
  constructor(public readonly email: string, public readonly roles: string[]) {}

  static create(object: {
    [key: string]: any;
  }): [string?, SendInvitationWithRolesDto[]?] {
    const { users } = object;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return ["No se proporcionaron invitaciones para enviar."];
    }

    const validUserRoles = new Set(USER_ROLES);
    const invitationsDtos: SendInvitationWithRolesDto[] = [];

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

      const invalidRoles = roles.filter((r) => !validUserRoles.has(r));
      if(invalidRoles.length !== 0) {
        return [`Los siguientes valores no son roles válidos para un usuario: ${invalidRoles.join(", ")}.`];
      }

      invitationsDtos.push(new SendInvitationWithRolesDto(email, roles));
    }

    return [undefined, invitationsDtos];
  }
}
