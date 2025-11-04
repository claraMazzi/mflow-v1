import { useSession } from "@node_modules/next-auth/react";
import { VersionEntity } from "@src/types/version";
import { useCallback, useEffect, useState } from "react";

export type UseVersionsOfProjectProps = {
	projectId: string;
};

export const useVersionsOfProject = ({
	projectId,
}: UseVersionsOfProjectProps) => {
	const { data: session } = useSession();
	const [versions, setVersions] = useState<VersionEntity[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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
				console.log(response.data?.project.versions)
				setVersions(response.data!.project.versions);
			} else {
				setError(response.error);
				setVersions([]);
			}
		} catch (err) {
			setError("No fue posible obtener las versiones desde el servidor.");
			console.error("Error fetching versions:", err);
		} finally {
			setIsLoading(false);
		}
	}, [projectId, session?.auth]);

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
