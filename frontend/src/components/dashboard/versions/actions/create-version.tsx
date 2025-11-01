"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is
import type { CreateVersionFormData } from "../forms/create-version-form";

// Define the state type
export type ActionState = {
	error?: string;
	success?: boolean;
	data?: FormData;
};

export const createVersion = async (
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();

		if (!session?.user) {
			return { error: "Debe iniciar sesión para poder crear una versión." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { error: "Debe iniciar sesión para poder crear una versión." };
		}

		// Extract data from FormData
		const versionData: CreateVersionFormData & { projectId: string } = {
			projectId: formData.get("projectId") as string,
			title: formData.get("title") as string,
			parentVersionId: (formData.get("parentVersionId") as string) || undefined,
		};

		// Validate required fields
		if (!versionData?.projectId?.trim()) {
			return {
				error: "Debe especificarse el proyecto al que pertenece esta versión.",
			};
		}

		if (!versionData.title?.trim()) {
			return { error: "El título de la versión es obligatorio." };
		}

		const response = await fetch(`${process.env.API_URL}/api/projects`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify(versionData),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return { error: errorData.error || "No se pudo crear la versión en el servidor." };
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Create version error:", error);
		return { error: "Ocurrió un error inesperado al intentar crear la versión en el servidor." };
	}
};
