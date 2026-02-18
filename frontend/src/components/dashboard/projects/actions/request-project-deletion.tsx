"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
	error?: string;
	success: boolean;
	data?: any;
};

export const requestProjectDeletion = async (
	prevState: ActionState,
	formData: FormData,
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();
		if (!session?.user || !session.auth) {
			return {
				success: false,
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		const accessToken = session.auth;

		const projectData = {
			motive: formData.get("motive") as string,
		};

		const response = await fetch(
			`${process.env.API_URL}/api/projects/${formData.get("id")}/deletion`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(projectData),
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error:
					errorData.error ||
					"Se ha producido un error. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Deleion Request for project error:", error);
		return {
			success: false,
			error:
				"Se ha producido un error. Por favor, inténtelo de nuevo más tarde.",
		};
	}
};
