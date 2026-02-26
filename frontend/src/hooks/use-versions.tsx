import { useSession } from "@node_modules/next-auth/react";
import { SharedVersionEntity, VersionEntity } from "@src/types/version";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProjectWithVersionsEntity } from "@src/types/project";

// Minimum time between automatic refetches (5 seconds)
const REFETCH_COOLDOWN = 5000;

export type UseVersionsOfProjectProps = {
	projectId: string;
};

export type DeleteVersionResult = {
	success: boolean;
	error?: string;
};

export const useProjectWithVersions = ({
	projectId,
}: UseVersionsOfProjectProps) => {
	const { data: session } = useSession();
	const [project, setProject] = useState<ProjectWithVersionsEntity | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const lastFetchTimeRef = useRef<number>(0);

	const refreshProject = useCallback(async () => {
		if (!session?.auth) {
			setError(
				"Debe estar logueado para poder obtener las versiones del projecto.",
			);
			setIsLoading(false);
			return;
		}
		try {
			setIsLoading(true);
			setError(null);
			const response = await getProjectWithVersions({
				sessionToken: session.auth,
				projectId,
			});
			if (response.success) {
				setProject(response.data!.project);
			} else {
				setError(response.error);
				setProject(null);
			}
			lastFetchTimeRef.current = Date.now();
		} catch (err) {
			setError("No fue posible obtener las versiones desde el servidor.");
			console.error("Error fetching versions:", err);
		} finally {
			setIsLoading(false);
		}
	}, [projectId, session?.auth]);

	const deleteVersion = useCallback(
		async (versionId: string): Promise<DeleteVersionResult> => {
			if (!session?.auth) {
				return {
					success: false,
					error: "Debe estar logueado para eliminar una versión.",
				};
			}

			const response = await deleteVersionRequest({
				sessionToken: session.auth,
				versionId,
			});

			if (response.success) {
				// Refresh the versions list after successful deletion
				await refreshProject();
			}

			return response;
		},
		[session?.auth, refreshProject],
	);

	useEffect(() => {
		if (session?.auth) {
			refreshProject();
		}
	}, [refreshProject, session?.auth]);

	// Refetch when window gains focus (e.g., after navigating from notification)
	// Uses cooldown to prevent excessive fetches
	useEffect(() => {
		const handleFocus = () => {
			const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
			if (session?.auth && timeSinceLastFetch > REFETCH_COOLDOWN) {
				refreshProject();
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [refreshProject, session?.auth]);

	// Refetch when page becomes visible
	// Uses cooldown to prevent excessive fetches
	useEffect(() => {
		const handleVisibilityChange = () => {
			const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
			if (
				document.visibilityState === "visible" &&
				session?.auth &&
				timeSinceLastFetch > REFETCH_COOLDOWN
			) {
				refreshProject();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refreshProject, session?.auth]);

	return {
		project,
		isLoading,
		error,
		refreshProject,
		deleteVersion,
	};
};

export const useSharedVersions = () => {
	const { data: session } = useSession();
	const [versions, setVersions] = useState<SharedVersionEntity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchVersions = useCallback(async () => {
		if (!session?.auth) {
			setError(
				"Debe estar logueado para obtener las versiones compartidas con el usuario.",
			);
			setVersions([]);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			const result = await getSharedVersionsRequest({
				sessionToken: session.auth as string,
			});

			if (result.success && result.data) {
				setVersions(result.data.versions);
			} else {
				setError(
					result.error ?? "No fue posible obtener las versiones compartidas.",
				);
				setVersions([]);
			}
		} catch (err) {
			setError("No fue posible obtener las versiones compartidas.");
			console.error("Error fetching shared versions:", err);
			setVersions([]);
		} finally {
			setIsLoading(false);
		}
	}, [session?.auth]);

	useEffect(() => {
		if (session?.auth) {
			fetchVersions();
		}
	}, [fetchVersions, session?.auth]);

	return {
		versions,
		isLoading,
		error,
		refreshVersions: fetchVersions,
	};
};

async function getSharedVersionsRequest({
	sessionToken,
}: {
	sessionToken: string;
}) {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/versions/shared`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionToken}`,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error:
					errorData.error ||
					"Se ha producido un error al obtener las versiones compartidas.",
			};
		}

		const data = await response.json();
		return {
			success: true,
			data: { versions: data.versions || [] },
		};
	} catch (error) {
		console.error("Get shared versions error:", error);
		return {
			success: false,
			error: "Se ha producido un error al obtener las versiones compartidas.",
		};
	}
}

async function getProjectWithVersions({
	projectId,
	sessionToken,
}: {
	projectId: string;
	sessionToken: string;
}) {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/versions`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${sessionToken}`,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error:
					errorData.error ||
					"Error al obtener las versiones desde el servidor.",
			};
		}

		const data: { project: ProjectWithVersionsEntity } = await response.json();
		return { success: true, data };
	} catch (error) {
		console.error(
			`Unexpected error during fething of versios for project: ${projectId}`,
			error,
		);
		return {
			success: false,
			error: "Error al obtener las versiones desde el servidor.",
		};
	}
}

async function deleteVersionRequest({
	versionId,
	sessionToken,
}: {
	versionId: string;
	sessionToken: string;
}): Promise<DeleteVersionResult> {
	try {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/versions/${versionId}`,
			{
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${sessionToken}`,
				},
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error:
					errorData.error ||
					"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
			};
		}

		return { success: true };
	} catch (error) {
		console.error(
			`Unexpected error during version deletion: ${versionId}`,
			error,
		);
		return {
			success: false,
			error:
				"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
		};
	}
}
