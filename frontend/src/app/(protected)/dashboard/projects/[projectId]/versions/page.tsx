"use client";

import { Plus } from "lucide-react";
import { useParams } from "@node_modules/next/navigation";
import { CreateVersionForm } from "@src/components/dashboard/versions/forms/create-version-form";
import { Button } from "@src/components/ui/common/button";
import { useUI } from "@src/components/ui/context";
import { useVersionsOfProject } from "@src/hooks/use-versions";
import React from "react";
import VersionList from "@src/components/dashboard/versions/version-list";

const Page = () => {
	const params = useParams<{ projectId: string }>();
	const { projectId } = params;

	const { versions, isLoading, refreshVersions } = useVersionsOfProject({
		projectId,
	});

	const { openModal } = useUI();

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
				/>
			),
		});
	};

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">Mis versiones</h1>
				<Button className="uppercase" onClick={handleCreateProject}>
					<Plus />
					Crear versión
				</Button>
			</div>

			<VersionList
				versions={versions}
				refreshVersions={refreshVersions}
				isLoading={isLoading}
				projectId={projectId}
			/>
		</div>
	);
};

export default Page;
