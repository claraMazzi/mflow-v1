'use server';
 
import { signIn } from '@lib/auth';
import { redirect } from 'next/navigation';
import  {AuthError} from 'next-auth';
 
// ...
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {...Object.fromEntries(formData), redirectTo: '/dashboard'});
    //si todo sale bien esto va a recargar el navegador con las credenciales
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
  
}