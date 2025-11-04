
export type UserRole = "VERIFICADOR" | "ADMIN" | "MODELADOR";

export type User = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  emailValidated: boolean;
  roles: UserRole[];
};
