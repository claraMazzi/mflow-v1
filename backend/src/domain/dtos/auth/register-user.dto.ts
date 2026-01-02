import { emailRegex, passwordRegex } from "../../../config";
import { USER_ROLES, UserRole } from "../../../data";

export class RegisterUserDto {
	constructor(
		public readonly name: string,
		public readonly lastName: string,
		public readonly email: string,
		public readonly password: string,
		public readonly roles: UserRole[]
	) {}

	static create(object: { [key: string]: any }): [string?, RegisterUserDto?] {
		const { name, lastName, email, password, roles } = object;
		if (!name) return ["El campo nombre es obligatorio."];
		if (!lastName) return ["El campo apellido es obligatorio."];
		if (!email) return ["El campo email es obligatorio."];
		if (!emailRegex.test(email))
			return ["El correo electrónico no tiene un formato válido."];
		if (!password) return ["El campo contraseña es obligatorio."];
		if (!passwordRegex.test(password))
			return ["El campo contraseña no tiene un formato válido."];
		if (!roles) return ["Debe especificar los roles a asignar al usuario."];

		const validUserRoles = new Set(USER_ROLES);

		const invalidRoles = roles.filter(
			(r: string) => !validUserRoles.has(r as UserRole)
		);
		if (invalidRoles.length !== 0) {
			return [
				`Los siguientes valores no son roles válidos para un usuario: ${invalidRoles.join(
					", "
				)}.`,
			];
		}

		if (!roles.includes("MODELADOR")) {
			return [
				"Es obligatorio que el usuario tenga asignado el rol 'MODELADOR'.",
			];
		}

		return [
			undefined,
			new RegisterUserDto(name, lastName, email, password, roles),
		];
	}
}
