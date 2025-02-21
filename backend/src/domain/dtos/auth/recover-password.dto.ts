
import {emailRegex, passwordRegex} from "../../../config";

export class RecoverPasswordDto {
    constructor(
        public readonly email: string,
        public readonly newPassword: string
    ){}

    static create( object: {[key:string]:any}): [string?, RecoverPasswordDto?] {
        const {email, newPassword} = object;
        if (!email) return ['Missing email'];
        if (!newPassword) return ['Missing New Password'];
        if (!passwordRegex.test(newPassword)) return ['New Password is not valid'];
        return [undefined, new RecoverPasswordDto(email, newPassword)]
    }
}