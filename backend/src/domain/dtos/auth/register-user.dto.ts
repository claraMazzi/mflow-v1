
import {emailRegex, passwordRegex} from "../../../config";

export class RegisterUserDto {
    constructor(
        public readonly name:string,
        public readonly lastName:string,
        public readonly email: string,
        public readonly password: string
    ){}

    static create( object: {[key:string]:any}): [string?, RegisterUserDto?] {
        const {name, lastName, email, password} = object;
        if (!name) return ['Missing name'];
        if (!lastName) return ['Missing last name'];
        if (!email) return ['Missing email'];
        if (!emailRegex.test(email)) return ['Email is not valid'];
        if (!password) return ['Missing Password'];
        if (!passwordRegex.test(password)) return ['Password is not valid'];
        return [undefined, new RegisterUserDto(name, lastName, email, password)]
    }
}