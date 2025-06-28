// // types/next-auth.d.ts
// import type { DefaultSession } from 'next-auth'

// import { AdapterUser } from "next-auth/adapters";

// interface CustomUser extends AdapterUser {
//   id: string;
//   name: string;
//   lastName: string;
//   email: string;
//   emailValidated: boolean;
//   roles: string[];
// }

// declare module "next-auth" {
//   interface Session {
//     user:{
//     user: CustomUser;
//     auth?: string;
//   } & DefaultSession['user']
// }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     user: CustomUser;
//     auth: string
//   }
// }

// types/next-auth.d.ts
import type { DefaultSession } from "next-auth"
import type { AdapterUser } from "next-auth/adapters"

export interface CustomUser extends AdapterUser {
  id: string
  name: string
  lastName: string
  email: string
  emailValidated: boolean
  roles: string[]
  currentRole:string
}

declare module "next-auth" {
  interface Session {
    user: CustomUser & DefaultSession["user"]
    auth?: string // Add auth token to session
  }

  interface User {
    user: CustomUser
    token: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: CustomUser
    auth?: string
  }
}
