"use server";

import { auth } from "@lib/auth";

export type ShareVersionActionState = {
	error?: string;
	success?: boolean;
	data?: { shareLink?: string; [key: string]: unknown };
};

export const getVersionSharingLink = async (
	versionId: string
): Promise<ShareVersionActionState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente." };
		}
		if (!versionId) {
			return { error: "El identificador de la versión es obligatorio." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/${versionId}/share`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al obtener el link para compartir la versión.",
			};
		}
		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		console.error("Get version sharing link error:", error);
		return {
			error:
				"Se ha producido un error al obtener el link para compartir la versión.",
		};
	}
};

export const sendVersionShareInvitation = async (
	prevState: ShareVersionActionState,
	formData: FormData
): Promise<ShareVersionActionState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		const versionId = formData.get("versionId") as string;
		const collaborators = formData.get("collaborators") as string;
		if (!versionId) {
			return { error: "El identificador de la versión es obligatorio." };
		}
		const emails = collaborators ? JSON.parse(collaborators) : [];
		if (!Array.isArray(emails) || emails.length === 0) {
			return { error: "Se requiere al menos un email para enviar las invitaciones." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/${versionId}/share`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
				body: JSON.stringify({ collaborators: emails }),
			}
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al enviar las invitaciones.",
			};
		}
		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		console.error("Send version share invitation error:", error);
		return {
			error:
				"Se ha producido un error al enviar las invitaciones para la versión.",
		};
	}
};

type RemoveReaderParams = {
	versionId: string;
	readerId: string;
};

async function doRemoveReaderFromVersion(
	params: RemoveReaderParams
): Promise<ShareVersionActionState> {
	const { versionId, readerId } = params;
	const session = await auth();
	if (!session?.user) {
		return {
			success: false,
			error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
		};
	}
	if (!versionId || !readerId) {
		return {
			success: false,
			error: "Faltan parámetros.",
		};
	}
	const token = session.auth;
	const response = await fetch(
		`${process.env.API_URL}/api/versions/${versionId}/readers/${readerId}`,
		{
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		return {
			success: false,
			error:
				errorData.error ||
				"Se ha producido un error al remover al lector.",
		};
	}
	return { success: true };
}

export async function removeReaderFromVersion(
	params: RemoveReaderParams
): Promise<ShareVersionActionState> {
	try {
		return await doRemoveReaderFromVersion(params);
	} catch (err) {
		console.error("Remove reader from version error:", err);
		return {
			success: false,
			error: "Se ha producido un error al remover al lector.",
		};
	}
}

export const acceptVersionShareInvitation = async (
	prevState: ShareVersionActionState,
	token: string
): Promise<ShareVersionActionState> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		if (!token) {
			return { error: "El token de invitación es obligatorio." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/share/${token}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al aceptar la invitación.",
			};
		}
		const data = await response.json();
		return { success: true, data };
	} catch (error) {
		console.error("Accept version share invitation error:", error);
		return {
			error: "Se ha producido un error al aceptar la invitación.",
		};
	}
};

export type VersionReader = {
	id: string;
	email: string;
	name?: string;
	lastName?: string;
};

export const getVersionWithReaders = async (
	versionId: string
): Promise<
	ShareVersionActionState & { version?: { id: string; title: string }; readers?: VersionReader[] }
> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/${versionId}/readers`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al obtener los lectores.",
			};
		}
		const data = await response.json();
		return { success: true, ...data };
	} catch (error) {
		console.error("Get version with readers error:", error);
		return {
			error: "Se ha producido un error al obtener los lectores.",
		};
	}
};

export type SharedVersionItem = {
	id: string;
	title: string;
	state: string;
	parentVersion: { id: string; title: string } | null;
	projectId: string;
	projectTitle: string;
};

export const getSharedVersions = async (): Promise<{
	data?: { versions: SharedVersionItem[] };
	error?: string;
}> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente." };
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/shared`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
				},
			}
		);
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error:
					errorData.error ||
					"Se ha producido un error al obtener las versiones compartidas.",
			};
		}
		const data = await response.json();
		return { data: { versions: data.versions || [] } };
	} catch (error) {
		console.error("Get shared versions error:", error);
		return {
			error: "Se ha producido un error al obtener las versiones compartidas.",
		};
	}
};

export const getVersionFromShareRequest = async (
	token: string
): Promise<ShareVersionActionState & { version?: unknown; project?: unknown }> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return {
				error: "Tu sesión ha expirado. Por favor, inicie sesión nuevamente.",
			};
		}
		const response = await fetch(
			`${process.env.API_URL}/api/versions/share/${token}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.auth}`,
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
		return { success: true, ...data };
	} catch (error) {
		console.error("Get version from share request error:", error);
		return {
			error:
				"Se ha producido un error al obtener la información de la invitación.",
		};
	}
};
