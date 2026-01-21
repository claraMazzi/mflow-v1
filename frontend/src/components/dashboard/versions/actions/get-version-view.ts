"use server";

import { auth } from "@lib/auth";
import { VersionViewData } from "#types/version-view";

export type VersionViewActionState<T = any> = {
	data?: T;
	error?: string;
};

/**
 * Get version data for read-only view
 * Includes corrections if version is in REVISADA state
 */
export const getVersionForReadOnlyView = async (
	versionId: string
): Promise<VersionViewActionState<VersionViewData>> => {
	try {
		const session = await auth();
		if (!session?.user) {
			return { error: "No autenticado" };
		}

		const response = await fetch(
			`${process.env.API_URL}/api/versions/${versionId}/view`,
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
			return { error: errorData.error || "Error al obtener la versión" };
		}

		const data = await response.json();
		return { data };
	} catch (error) {
		console.error("Error fetching version for read-only view:", error);
		return {
			error:
				error instanceof Error ? error.message : "Error desconocido",
		};
	}
};
