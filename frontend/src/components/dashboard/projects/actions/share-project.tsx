"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
	error?: string;
	success?: boolean;
	data?: any;
};

export const sendProjectCollaborationInvitation = async (
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const projectId = formData.get("id") as string;
		// Validate required fields
		if (!projectId) {
			return { error: "El identificador del proyecto es obligatorio." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/projects/${projectId}/share`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					collaborators: JSON.parse(formData.get("collaborators") as string),
				}),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al enviar las invitaciones para el proyecto. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Send project collaboration invitation error:", error);
		return {
			error:
				"Se ha producido un error al enviar las invitaciones para el proyecto. Por favor, inténtelo de nuevo más tarde.",
		};
	}
};

export const getProjectSharingLink = async (
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		const projectId = formData.get("id") as string;

		// Validate required fields
		if (!projectId) {
			return { error: "El identificador del proyecto es obligatorio." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/projects/${projectId}/share`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al obtener el link para compartir el proyecto. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Get Project sharing link error:", error);
		return {
			error:
				"Se ha producido un error al obtener el link para compartir el proyecto. Por favor, inténtelo de nuevo más tarde.",
		};
	}
};

export const acceptProjectCollaborationInvitation = async (
	prevState: ActionState,
	token: string
): Promise<ActionState> => {
	try {
		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();

		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		// Validate required fields
		if (!token) {
			return { error: "El identificador del proyecto es obligatorio." };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/projects/share/${token}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al aceptar la invitación. Por favor, inténtelo de nuevo más tarde.",
			};
		}

		const data = await response.json();

		return { success: true, data };
	} catch (error) {
		console.error("Accept project collaboration invitation error:", error);
		return {
			error:
				"Se ha producido un error al aceptar la invitación. Por favor, inténtelo de nuevo más tarde.",
		};
	}
};

export const getProjectFromShareRequest = async (
	token: string
): Promise<ActionState> => {
	try {
		const session = await auth();

		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/projects/share/${token}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session?.auth}`,
				},
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al obtener la información de la invitación.",
			};
		}

		const data = await response.json();

		return data;
	} catch (error) {
		console.error("Get project error:", error);
		return {
			error:
				"Se ha producido un error al obtener la infomación de la invitación.",
		};
	}
};
