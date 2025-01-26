
import {emailRegex} from "../../../config";

export class LoginUserDto {
    constructor(
        public readonly email: string,
        public readonly password: string
    ){}

    static create( object: {[key:string]:any}): [string?, LoginUserDto?] {
        const {email, password} = object;
        if (!email) return ['Missing email'];
        if (!emailRegex.test(email)) return ['Email is not valid'];
        if (!password) return ['Missing Password'];
        return [undefined, new LoginUserDto(email, password)]
    }
}