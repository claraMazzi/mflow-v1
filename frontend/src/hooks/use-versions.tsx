import { useSession } from "@node_modules/next-auth/react";
import { VersionEntity } from "@src/types/version";
import { useCallback, useEffect, useRef, useState } from "react";

// Minimum time between automatic refetches (5 seconds)
const REFETCH_COOLDOWN = 5000;

export type UseVersionsOfProjectProps = {
	projectId: string;
};

export type DeleteVersionResult = {
	success: boolean;
	error?: string;
};

export const useVersionsOfProject = ({
	projectId,
}: UseVersionsOfProjectProps) => {
	const { data: session } = useSession();
	const [versions, setVersions] = useState<VersionEntity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const lastFetchTimeRef = useRef<number>(0);

	const fetchVersions = useCallback(async () => {
		if (!session?.auth) {
			setError(
				"Debe estar logueado para poder obtener las versiones del projecto."
			);
			return;
		}
		try {
			setIsLoading(true);
			setError(null);
			const response = await getVersionsOfPoject({
				sessionToken: session.auth,
				projectId,
			});
			if (response.success) {
				setVersions(response.data!.project.versions);
			} else {
				setError(response.error);
				setVersions([]);
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
				await fetchVersions();
			}

			return response;
		},
		[session?.auth, fetchVersions]
	);

	useEffect(() => {
		if (session?.auth) {
			fetchVersions();
		}
	}, [fetchVersions, session?.auth]);

	// Refetch when window gains focus (e.g., after navigating from notification)
	// Uses cooldown to prevent excessive fetches
	useEffect(() => {
		const handleFocus = () => {
			const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
			if (session?.auth && timeSinceLastFetch > REFETCH_COOLDOWN) {
				fetchVersions();
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [fetchVersions, session?.auth]);

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
				fetchVersions();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [fetchVersions, session?.auth]);

	return {
		versions,
		isLoading,
		error,
		refreshVersions: fetchVersions,
		deleteVersion,
	};
};

async function getVersionsOfPoject({
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
			}
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

		const data: { project: { versions: VersionEntity[] } } =
			await response.json();

		return { success: true, data };
	} catch (error) {
		console.error(
			`Unexpected error during fething of versios for project: ${projectId}`,
			error
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
			}
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
		console.error(`Unexpected error during version deletion: ${versionId}`, error);
		return {
			success: false,
			error: "Se ha producido un error, por favor inténtelo de nuevo más tarde.",
		};
	}
}
