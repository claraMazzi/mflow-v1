// types/next-auth.d.ts

import { AdapterUser } from "next-auth/adapters";

interface CustomUser extends AdapterUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  emailValidated: boolean;
  roles: string[];
  currentRole: "MODELADOR" | "VERIFICADOR" | "ADMIN";
  roles?: string[];
}

declare module "next-auth" {
  interface Session {
    user: CustomUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: CustomUser;
  }
}
