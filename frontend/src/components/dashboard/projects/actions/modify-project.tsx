"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is
import type { ModifyProjectFormData } from "../forms/modify-project-form";

// Define the state type
export type ActionState = {
	error?: string;
	success?: boolean;
	data?: any;
};

export const modifyProject = async (
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();
		if (!session?.user) {
			return {
				success: false,
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}	

		// Extract data from FormData
		const projectData = {
			title: formData.get("title") as string,
			description: formData.get("description") as string,
		};

    // Validate required fields
		if (!formData.get("id")) {
			return {
				success: false,
				error: "El identificador del proyecto es obligatorio.",
			};
		}

    if (!projectData.title?.trim()) {
			return { success: false, error: "El título del proyecto es obligatorio." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return {
				success: false,
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/projects/${formData.get("id")}`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(projectData),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error: errorData.error || "Se ha producido un error. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Modify project error:", error);
		return {
			success: false,
			error:
				"Se ha producido un error. Por favor, inténtelo de nuevo más tarde.",
		};
	}
};
