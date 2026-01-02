
import {emailRegex, passwordRegex} from "../../../config";

export class RecoverPasswordDto {
    constructor(
        public readonly token: string,
        public readonly newPassword: string
    ){}

    static create( object: {[key:string]:any}): [string?, RecoverPasswordDto?] {
        const {token, newPassword} = object;
        if (!token) return ['Debe proveer un token para restablecer para restablecer la contraseña.'];
        if (!newPassword) return ['La nueva contraseña es obligatoria.'];
        if (!passwordRegex.test(newPassword)) return ['La nueva contraseña no tiene un formato válido.'];
        return [undefined, new RecoverPasswordDto(token, newPassword)]
    }
}