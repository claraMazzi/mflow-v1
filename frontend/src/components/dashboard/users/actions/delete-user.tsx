"use server";
import { auth } from "@lib/auth";

// Define the state type
export type ActionState = {
  error?: string;
  success?: boolean;
  data?: FormData;
};

export async function deleteUserData(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const id = formData.get("id") as string;

    // Basic validation
    if (!id) {
      return {
        error: "ID de usuario requerido",
        success: false,
      };
    }

    const accessToken = session.auth;

    if (!accessToken) {
      return { error: "No access token available" };
    }

    const response = await fetch(`${process.env.API_URL}/api/users/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        return {
          error: "No autenticado",
          success: false,
        };
      }

      if (response.status === 400) {
        return {
          error: errorData.message || "Usuario no encontrado",
          success: false,
        };
      }

      return {
        error: `Error while deleting user: ${errorData.message}`,
        success: false,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete user error:", error);
    return {
      error: `Error while deleting user: ${error}`,
      success: false,
    };
  }
}
