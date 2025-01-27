
import {emailRegex, passwordRegex} from "../../../config";

export class RecoverPasswordDto {
    constructor(
        public readonly email: string,
        public readonly oldPassword: string,
        public readonly newPassword: string
    ){}

    static create( object: {[key:string]:any}): [string?, RecoverPasswordDto?] {
        const {oldPassword, email, newPassword} = object;
        if (!email) return ['Missing email'];
        if (!emailRegex.test(email)) return ['Email is not valid'];
        if (!oldPassword) return ['Missing Old Password'];
        if (!passwordRegex.test(oldPassword)) return ['Old Password is not valid'];
        if (!newPassword) return ['Missing Old Password'];
        if (!passwordRegex.test(newPassword)) return ['New Password is not valid'];
        return [undefined, new RecoverPasswordDto(email, oldPassword, newPassword)]
    }
}