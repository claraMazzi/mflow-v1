"use server";
import { auth } from "@lib/auth";
import { User } from "#types/user";

export type GetVerifiersState = {
	error?: string;
	success?: boolean;
	data?: {
		verifiers: User[];
		count: number;
	};
};

export const getVerifiers = async (): Promise<GetVerifiersState> => {
	try {
		const session = await auth();

		if (!session?.user) {
			return { error: "Debe iniciar sesión para obtener los verificadores." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { error: "Debe iniciar sesión para obtener los verificadores." };
		}

		const response = await fetch(`${process.env.API_URL}/api/users/verifiers`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "No se pudo obtener la lista de verificadores." };
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Get verifiers error:", error);
		return { error: "Ocurrió un error inesperado al obtener los verificadores." };
	}
};

