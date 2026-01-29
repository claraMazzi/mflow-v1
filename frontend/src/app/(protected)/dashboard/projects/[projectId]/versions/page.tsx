"use client";

import { Plus } from "lucide-react";
import { useParams } from "@node_modules/next/navigation";
import { CreateVersionForm } from "@src/components/dashboard/versions/forms/create-version-form";
import { Button } from "@src/components/ui/common/button";
import { useUI } from "@src/components/ui/context";
import { useVersionsOfProject } from "@src/hooks/use-versions";
import React, { useEffect, useState } from "react";
import VersionList from "@src/components/dashboard/versions/version-list";
import { useSession } from "next-auth/react";

const Page = () => {
	const params = useParams<{ projectId: string }>();
	const { projectId } = params;
	const { data: session } = useSession();

	const { versions, isLoading, refreshVersions, deleteVersion } = useVersionsOfProject({
		projectId,
	});

	const [isOwner, setIsOwner] = useState(false);
	const [isLoadingOwnership, setIsLoadingOwnership] = useState(true);

	// Fetch project to check ownership
	useEffect(() => {
		const checkOwnership = async () => {
			if (!session?.auth || !session?.user?.id) {
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
				}
			} catch (error) {
				console.error("Error checking project ownership:", error);
			} finally {
				setIsLoadingOwnership(false);
			}
		};

		checkOwnership();
	}, [projectId, session?.auth, session?.user?.id]);

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

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">Versiones del proyecto {projectId}</h1>
				<Button className="uppercase" onClick={handleCreateProject}>
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
