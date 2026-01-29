"use server";
import { auth } from "@lib/auth";
import type { AssignVerifierData } from "#types/verification-request";

export type AssignVerifierState = {
	success?: boolean;
	error?: string;
};

export const assignVerifierToRequest = async (
	data: AssignVerifierData
): Promise<AssignVerifierState> => {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return { error: "Debe iniciar sesión." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/revisions/verifier-requests/${data.verifierRequestId}/assign`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
				body: JSON.stringify({
					assignedVerifierId: data.assignedVerifierId,
				}),
			}
		);
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			return { error: err.error || "Error al asignar el verificador." };
		}
		return { success: true };
	} catch (error) {
		console.error("Error assigning verifier:", error);
		return {
			error:
				error instanceof Error ? error.message : "Error inesperado al asignar verificador.",
		};
	}
};
