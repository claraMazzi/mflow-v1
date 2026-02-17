"use client";

import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { CreateVersionForm } from "@src/components/dashboard/versions/forms/create-version-form";
import { Button } from "@src/components/ui/common/button";
import { useUI } from "@src/components/ui/context";
import { useVersionsOfProject } from "@src/hooks/use-versions";
import React, { useEffect, useState } from "react";
import VersionList from "@src/components/dashboard/versions/version-list";
import { useSession } from "next-auth/react";

const Page = () => {
	const params = useParams<{ projectId: string }>();
	const router = useRouter();
	const { projectId } = params;
	const { data: session } = useSession();

	const { versions, isLoading, error, refreshVersions, deleteVersion } = useVersionsOfProject({
		projectId,
	});

	const [isOwner, setIsOwner] = useState(false);
	const [projectName, setProjectName] = useState<string | null>(null);
	const [isLoadingOwnership, setIsLoadingOwnership] = useState(true);
	const [canAccessVersions, setCanAccessVersions] = useState<boolean | null>(null);
	const [isLoadingAccess, setIsLoadingAccess] = useState(true);

	// Explicit access check: only owner/collaborator/admin can access project versions list (shared readers cannot)
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
					}
				);
				console.log(await response.json());
				if (response.ok) {
					const data = await response.json();
					setCanAccessVersions(data.canAccessVersions === true);
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

	// Fetch project to check ownership and get project name (only when user has access)
	useEffect(() => {
		const checkOwnership = async () => {
			if (!session?.auth || !session?.user?.id || canAccessVersions !== true) {
				setIsLoadingOwnership(false);
				return;
			}

			try {
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${projectId}`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${session.auth}`,
						},
					}
				);

				if (response.ok) {
					const data = await response.json();
					setIsOwner(data.project?.owner === session.user.id);
					setProjectName(data.project?.title ?? null);
				}
			} catch (error) {
				console.error("Error checking project ownership:", error);
			} finally {
				setIsLoadingOwnership(false);
			}
		};

		checkOwnership();
	}, [projectId, session?.auth, session?.user?.id, canAccessVersions]);

	const { openModal, closeModal } = useUI();

	const handleCreateProject = () => {
		openModal({
			name: "fullscreen-modal",
			title: "Crear versión",
			size: "md",
			showCloseButton: false,
			content: (
				<CreateVersionForm
					existingVersions={versions}
					projectId={projectId}
					onSuccess={() => {
						refreshVersions();
					}}
					onClose={closeModal}
				/>
			),
		});
	};

	const noPermission =
		(!isLoadingAccess && canAccessVersions === false) || (!isLoading && !!error);

	// Wait for access check when we have session so shared readers don't see a flash of content
	if (session?.auth && isLoadingAccess) {
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
				<Button
					variant="outline"
					onClick={() => router.push("/dashboard")}
				>
					Volver al inicio
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">
					Versiones del proyecto {projectName ?? projectId}
				</h1>
				<Button variant="tertiary" className="uppercase" onClick={handleCreateProject}>
					<Plus />
					Crear versión
				</Button>
			</div>

			<VersionList
				versions={versions}
				refreshVersions={refreshVersions}
				isLoading={isLoading || isLoadingOwnership}
				projectId={projectId}
				isOwner={isOwner}
				deleteVersion={deleteVersion}
			/>
		</div>
	);
};

export default Page;
