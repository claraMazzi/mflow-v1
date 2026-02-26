"use server";

import { auth } from "@lib/auth";
import { DenyDeletionRequestData } from "#types/deletion-request";

// Define the state type following the template for consistency
export type ActionState =
  | { success: false; error: string }
  | {
      success: true;
      message: string;
    };

export const denyDeletionRequest = async (
  data: DenyDeletionRequestData,
): Promise<ActionState> => {
  try {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user || !session.auth) {
      return {
        success: false,
        error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
      };
    }

    const accessToken = session.auth;

    // 2. Validation Check
    if (!data.deletionRequestId) {
      return {
        success: false,
        error: "El identificador de la solicitud es obligatorio.",
      };
    }

    // 3. API Request
    const response = await fetch(
      `${process.env.API_URL}/api/deletion-requests/${data.deletionRequestId}/deny`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // 4. Handle Response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.error ||
          "Error al rechazar la solicitud. Por favor, inténtelo de nuevo más tarde.",
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: result.message || "Solicitud de eliminación rechazada con éxito.",
    };
  } catch (error) {
    console.error("Deny deletion request error:", error);
    return {
      success: false,
      error: "Se ha producido un error inesperado. Inténtelo más tarde.",
    };
  }
};