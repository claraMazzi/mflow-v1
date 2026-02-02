"use server";
import { auth } from "@lib/auth";
import type {
	PendingVerifierRequestsResponse,
	FinalizedVerifierRequestsResponse,
	VerifierRequestDetail,
} from "#types/verification-request";

export type GetPendingState = {
	data?: PendingVerifierRequestsResponse;
	error?: string;
};

export type GetFinalizedState = {
	data?: FinalizedVerifierRequestsResponse;
	error?: string;
};

export type GetVerifierRequestDetailState = {
	data?: VerifierRequestDetail;
	error?: string;
};

export const getPendingVerifierRequests = async (): Promise<GetPendingState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Debe iniciar sesión." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/revisions/verifier-requests/pending`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			return { error: err.error || "Error al obtener solicitudes pendientes." };
		}
		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching pending verifier requests:", error);
		return {
			error:
				error instanceof Error ? error.message : "Error inesperado al obtener solicitudes.",
		};
	}
};

export const getFinalizedVerifierRequests = async (): Promise<GetFinalizedState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Debe iniciar sesión." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/revisions/verifier-requests/finalized`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			return { error: err.error || "Error al obtener historial de solicitudes." };
		}
		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching finalized verifier requests:", error);
		return {
			error:
				error instanceof Error ? error.message : "Error inesperado al obtener historial.",
		};
	}
};

export const getVerifierRequestById = async (
	verifierRequestId: string
): Promise<GetVerifierRequestDetailState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Debe iniciar sesión." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/revisions/verifier-requests/${verifierRequestId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const err = await response.json().catch(() => ({}));
			return { error: err.error || "Error al obtener la solicitud." };
		}
		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching verifier request:", error);
		return {
			error:
				error instanceof Error ? error.message : "Error inesperado al obtener la solicitud.",
		};
	}
};
