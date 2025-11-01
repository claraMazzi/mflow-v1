import { emailRegex, passwordRegex } from "../../../config";
import { USER_ROLES } from "../../../data";

//pongo los campos que necesito pasar por la request no mas
export class UpdateUserRolesDto {
	constructor(public readonly id: string, public readonly roles: string[]) {}

	static create(object: {
		[key: string]: any;
	}): [string?, UpdateUserRolesDto?] {
		const { roles, id } = object;
		if (!id) return ["El identificador del usuario es obligatorio."];
		if (!roles || !Array.isArray(roles))
			return ["Los roles a asignar al usuario son obligatorios."];

		const invalidRoles = roles.filter((r) => !USER_ROLES.includes(r));
    if(invalidRoles.length > 0) {
				return [`Los siguientes roles no son válidos: ${invalidRoles.join(", ")}.`];
    }

		return [undefined, new UpdateUserRolesDto(id, roles)];
	}
}
