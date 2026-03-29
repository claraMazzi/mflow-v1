"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { CreateVersionForm } from "@src/components/dashboard/versions/forms/create-version-form";
import { Button } from "@src/components/ui/common/button";
import { useUI } from "@src/components/ui/context";
import { useProjectWithVersions } from "@src/hooks/use-versions";
import React, { useEffect, useMemo, useState } from "react";
import VersionList from "@src/components/dashboard/versions/version-list";
import { useSession } from "next-auth/react";

const Page = () => {
	const params = useParams<{ projectId: string }>();
	const router = useRouter();
	const { projectId } = params;
	const { data: session } = useSession();

	const { project, isLoading, error, refreshProject, deleteVersion } =
		useProjectWithVersions({
			projectId,
		});

	const isOwner = useMemo(() => {
		if (!project) return false;
		if (!session) return false;
		return project.owner === session.user.id;
	}, [session?.user.id, project]);
	const [canAccessVersions, setCanAccessVersions] = useState<boolean | null>(
		null,
	);
	const [isLoadingAccess, setIsLoadingAccess] = useState(true);

	useEffect(() => {
		const checkAccess = async () => {
			if (!session?.auth || !projectId) {
				setIsLoadingAccess(false);
				return;
			}
			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}/can-access-versions`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${session.auth}`,
						},
					},
				);
				if (response.ok) {
					const data = await response.json();
					setCanAccessVersions(data.canAccessVersions);
				} else {
					setCanAccessVersions(false);
				}
			} catch {
				setCanAccessVersions(false);
			} finally {
				setIsLoadingAccess(false);
			}
		};
		checkAccess();
	}, [projectId, session?.auth]);

	const { openModal, closeModal } = useUI();

	const handleCreateVersion = () => {
		openModal({
			name: "fullscreen-modal",
			title: "Crear versión",
			size: "md",
			showCloseButton: false,
			content: (
				<CreateVersionForm
					existingVersions={project!.versions}
					projectId={projectId}
					onSuccess={() => {
						refreshProject();
					}}
					onClose={closeModal}
				/>
			),
		});
	};

	const noPermission =
		(!isLoadingAccess && canAccessVersions === false) ||
		(!isLoading && !!error);

	if (isLoading) {
		return (
			<div className="w-full flex flex-col gap-4 items-center justify-center min-h-[50vh] px-4">
				<p className="text-gray-600 text-center">Cargando…</p>
			</div>
		);
	}

	// Safeguard: no collaborator/owner access (e.g. shared reader only) or other error
	if (noPermission) {
		return (
			<div className="w-full flex flex-col gap-4 items-center justify-center min-h-[50vh] px-4">
				<p className="text-gray-600 text-center">
					No tenés permisos para acceder a las versiones de este proyecto.
				</p>
				<Button variant="outline" onClick={() => router.push("/dashboard")}>
					Volver al inicio
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full gap-4 flex-wrap justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">
					Versiones del proyecto "{project!.title}"
				</h1>
				<Button
					variant="tertiary"
					className="uppercase"
					onClick={handleCreateVersion}
				>
					<Plus />
					Crear versión
				</Button>
			</div>

			<VersionList
				versions={project!.versions}
				refreshVersions={refreshProject}
				isLoading={isLoading}
				projectId={projectId}
				isOwner={isOwner}
				deleteVersion={deleteVersion}
			/>
		</div>
	);
};

export default Page;
