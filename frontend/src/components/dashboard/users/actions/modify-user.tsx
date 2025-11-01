"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
	error?: string;
	success?: boolean;
	data?: any;
};

export async function modifyUserData(
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Not authenticated" };
		}
		const id = formData.get("id") as string;
		const name = formData.get("name") as string;
		const lastName = formData.get("lastName") as string;

		for (const pair of formData.entries()) {
			console.log(`${pair[0]}: ${pair[1]}`);
		}

		// Basic validation
		if (!id) {
			return {
				error: "ID de usuario requerido",
				success: false,
			};
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { error: "No access token available" };
		}
		const response = await fetch(`${process.env.API_URL}/api/users/`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				name,
				lastName,
			}),
		});

		if (!response.ok) {
			return await response.json();
		}

		return {
			success: true,
		};
	} catch (error) {
		return {
			error: "Algo salió mal.",
			success: false,
		};
	}
}

export async function modifyUserRoles(
	prevState: ActionState,
	formData: FormData
): Promise<ActionState> {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		const id = formData.get("id") as string;
		const roles = JSON.parse(formData.get("roles") as string) as string[];

		// Basic validation
		if (!id) {
			return {
				error: "El identificador del usuario es obligatorio.",
				success: false,
			};
		}

		if (!roles || roles.length === 0) {
			return {
				error: "El usuario debe tener al menos un rol asignado.",
				success: false,
			};
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return {
				error:
					"No se pudo obtener el token de autenticación. Intenta cerrar sesión e iniciar sesión nuevamente.",
				success: false,
			};
		}

		const response = await fetch(
			`${process.env.API_URL}/api/users/${id}/roles`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					roles,
				}),
			}
		);

		if (!response.ok) {
			const errorBody : {error: string}  = await response.json();

			return {
				error: errorBody.error,
				success: false,
			};
		}

		return {
			success: true,
		};
	} catch (error) {
		console.log("Unexpected error modifying the User Roles: ", error);
		return {
			error: "Se ha producido un error, por favor inténtelo de nuevo más tarde.",
			success: false,
		};
	}
}
