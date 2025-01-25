import { UserModel } from "../../data";
import { CustomError, RegisterUserDto, UserEntity } from "../../domain";


export class AuthService {
    constructor() {
        
        
    }

    async registerUser(registerDto: RegisterUserDto){
        //aca hacemos todo el proceso para registrar un usuario
        
        //1. verificar que no exista ese correo en la BD 
        const existUser = await UserModel.findOne({email: registerDto.email})
         if (existUser) throw CustomError.badRequest('Email already exists');

         try {
            const user = new UserModel(registerDto);
            await user.save();

            //Encriptar la contraseña

            //Retornar un JWT -- para mantener la autenticacion del usuario

            //mandar email de confirmacion

            const {password, ...userEntity} = UserEntity.fromObject(user);

            return {user: userEntity, token: 'ABC'};


            return user;
         } catch (error) {
            throw CustomError.internalServer(`${error}`);
         }
         return 'created';
    }
    
}