"use server";

import { auth } from "@lib/auth";
import { ApproveDeletionRequestData } from "@src/types/deletion-request";

// Define the state type following your template
export type ActionState =
	| { success: false; error: string }
	| {
			success: true;
			message: string;
	  };

export const approveDeletionRequest = async (
	data: ApproveDeletionRequestData,
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

		if (!data.deletionRequestId) {
			return {
				success: false,
				error: "El identificador de la solicitud es obligatorio.",
			};
		}

		// 3. API Request
		const response = await fetch(
			`${process.env.API_URL}/api/deletion-requests/${data.deletionRequestId}/approve`,
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
					"Error al aprobar la solicitud. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const result = await response.json();

		return {
			success: true,
			message: result.message || "Solicitud de eliminación aprobada con éxito.",
		};
	} catch (error) {
		console.error("Approve deletion request error:", error);
		return {
			success: false,
			error: "Se ha producido un error inesperado. Inténtelo más tarde.",
		};
	}
};
