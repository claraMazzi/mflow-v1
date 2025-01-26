
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';

//encriptacion en una sola via - no se puede desencriptar 

export const bcryptAdapter = {

  hash: (password: string) => {
    const salt = genSaltSync();
    return hashSync(password, salt)
  },

  compare: (password:string, hashed: string) => {
    return compareSync(password, hashed);
  }

}