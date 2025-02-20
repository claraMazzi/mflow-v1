export type User = {
    id: string;
    name: string;
    lastName: string;
    email: string;
    emailValidated: boolean;
    roles: string[];
    currentRole: 'MODELADOR' | 'VERIFICADOR' | 'ADMIN'
  };

  export type Session = {
    user: User;
    token: string;
    id: string;
  };
  
  