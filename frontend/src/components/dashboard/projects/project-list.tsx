"use client";

import { Button } from "@components/ui/common/button";
import React, { ReactNode } from "react";
import ContentCard from "@components/ui/Cards/ContentCard";
import { Skeleton } from "@components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUI } from "@components/ui/context";
import { ModifyProjectForm } from "./forms/modify-project-form";
import { ProjectEntity } from "#types/project";
import { DelitionRequestForm } from "./forms/delition-request-form";
import { projectPendingDelition } from "@src/config/sharedVariables";
import cn from "clsx";
import { ShareProjectForm } from "./forms/share-project-form";

const getProjectDecorators = (project: ProjectEntity) => {
	const decorators: ReactNode[] = [];

	if (project.state && project.state === projectPendingDelition) {
		decorators.push(
			<div className="font-bold text-xs flex gap-1">
				Estado:
				<span className="font-normal">Pendiente de eliminación</span>
			</div>
		);
	}
	//TODO: add owner
	return decorators;
};

interface ProjectListProps {
	projects: ProjectEntity[];
	refreshProjects: () => void;
	isLoading: boolean;
	isSharing?: boolean;
}

const ProjectList = ({
	projects,
	refreshProjects,
	isLoading,
	isSharing = false,
}: ProjectListProps) => {
	const router = useRouter();
	const { openModal } = useUI();

	const handleShareProject = (project: ProjectEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Compartir proyecto",
			size: "md",
			showCloseButton: false,
			content: <ShareProjectForm project={project} />,
		});
	};

	const handleModifyProject = (project: ProjectEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Modificar proyecto",
			size: "md",
			showCloseButton: false,
			content: (
				<ModifyProjectForm
					onSuccess={() => {
						refreshProjects();
					}}
					project={project}
				/>
			),
		});
	};

	const handleDelitionRequest = (project: ProjectEntity) => {
		openModal({
			name: "fullscreen-modal",
			title: "Solicitar eliminación de proyecto",
			size: "md",
			showCloseButton: false,
			content: (
				<DelitionRequestForm
					onSuccess={() => {
						refreshProjects();
					}}
					project={project}
				/>
			),
		});
	};
	if (isLoading) return <Skeleton className="w-full h-96" />;

	return (
		<div>
			{projects && projects.length > 0 ? (
				<div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-2">
					{projects.map((project, index) => {
						const isPendingDelition = project.state === projectPendingDelition;
						const popoverOptionsBase = [
							{
								content: (
									<Button variant={"optionList"}>Exportar proyecto</Button>
								),
							},
						];

						const popoverOptions = isSharing
							? popoverOptionsBase
							: [
									{
										content: (
											<Button
												variant={"optionList"}
												onClick={() => handleShareProject(project)}
											>
												Compartir proyecto
											</Button>
										),
									},
									...popoverOptionsBase,
									{
										content: (
											<Button
												variant={"optionList"}
												className={cn({
													hidden: isPendingDelition,
												})}
												onClick={() => handleModifyProject(project)}
											>
												Modificar proyecto
											</Button>
										),
									},
									{
										content: (
											<Button
												variant={"optionList"}
												className={cn({
													hidden: isPendingDelition,
												})}
												onClick={() => handleDelitionRequest(project)}
											>
												Solicitar eliminación
											</Button>
										),
									},
							  ];
						return (
							<ContentCard
								key={project.id}
								type="project"
								title={project.title}
								description={project.description}
								options={popoverOptions}
								decorators={getProjectDecorators(project)}
								action={() => {
									router.push(`/dashboard/projects/${project.id}/versions`); // Navigate to the project details page
								}}
							/>
						);
					})}
				</div>
			) : (
				<div>
					{isSharing
						? "Todavía no te han asignado como colaborador en ningún proyecto."
						: "Todavía no tienes ningún proyecto creado."}
				</div>
			)}
		</div>
	);
};

export default ProjectList;
