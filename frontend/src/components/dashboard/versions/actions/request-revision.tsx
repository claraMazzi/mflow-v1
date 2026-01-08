"use server";
import { auth } from "@lib/auth";

export type RequestRevisionState = {
	error?: string;
	success?: boolean;
	data?: {
		message: string;
	};
};

export const requestRevision = async (
	prevState: RequestRevisionState,
	formData: FormData
): Promise<RequestRevisionState> => {
	try {
		const session = await auth();

		if (!session?.user) {
			return { error: "Debe iniciar sesión para solicitar una revisión." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { error: "Debe iniciar sesión para solicitar una revisión." };
		}

		const versionId = formData.get("versionId") as string;
		const assignRandomVerifier = formData.get("assignRandomVerifier") === "true";
		const selectedVerifierId = formData.get("selectedVerifierId") as string;

		if (!versionId?.trim()) {
			return { error: "El identificador de la versión es obligatorio." };
		}

		// Validate mutual exclusivity
		const hasCheckbox = assignRandomVerifier;
		const hasVerifier = selectedVerifierId && selectedVerifierId.trim() !== "";

		if (hasCheckbox && hasVerifier) {
			return { error: "No puede seleccionar ambas opciones." };
		}

		if (!hasCheckbox && !hasVerifier) {
			return { error: "Debe seleccionar un verificador o marcar la opción para asignar uno automáticamente." };
		}

		const requestData = {
			assignRandomVerifier,
			selectedVerifierId: hasVerifier ? selectedVerifierId : null,
		};

		const response = await fetch(
			`${process.env.API_URL}/api/revisions/request/${versionId}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(requestData),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Request revision error:", error);
		return {
			error: "Se ha producido un error, por favor inténtelo de nuevo más tarde.",
		};
	}
};

