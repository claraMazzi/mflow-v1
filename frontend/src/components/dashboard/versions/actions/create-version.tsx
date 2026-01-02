"use server";
import { auth } from "@lib/auth";

// Define the state type
export type ActionState = {
	error?: string;
	success?: boolean;
	data?: {
		version?: {
			id: string;
			title: string;
			state: string;
			parentVersion: { id: string } | null;
		};
	};
};

export const createVersion = async (
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> => {
	try {
		const session = await auth();

		if (!session?.user) {
			return { error: "Debe iniciar sesión para poder crear una versión." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { error: "Debe iniciar sesión para poder crear una versión." };
		}

		// Extract data from FormData
		const projectId = formData.get("projectId") as string;
		const title = formData.get("title") as string;
		const parentVersionId = formData.get("parentVersionId") as string;
		const migrateTodoItemsRaw = formData.get("migrateTodoItems") as string;

		// Validate required fields
		if (!projectId?.trim()) {
			return {
				error: "Debe especificarse el proyecto al que pertenece esta versión.",
			};
		}

		if (!title?.trim()) {
			return { error: "El título de la versión es obligatorio." };
		}

		const versionData = {
			projectId,
			title,
			parentVersionId: parentVersionId || null,
			migrateTodoItems: migrateTodoItemsRaw === "true",
		};

		const response = await fetch(`${process.env.API_URL}/api/versions`, {
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
