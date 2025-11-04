"use server"

import { UserRole } from "@src/types/user"

export interface RegisterUserFormData {
  name: string
  lastName: string
  email: string
  password: string
  roles: UserRole[]
}

export async function createAccount(data: RegisterUserFormData) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorBody : {error: string} = await response.json()
      return {sucess: false, error: errorBody.error}
    }

    return { success: true }
  } catch (error) {
		console.error("Unexpected error modifying the User Roles: ", error);
    return {
      success: false,
      error: "Se ha producido un error, por favor inténtelo de nuevo más tarde.",
    }
  }
}
