"use client";

import ProjectList from "@components/dashboard/projects/project-list";
import { useSharedProjects } from "@hooks/use-projects";
import React from "react";

const Page = () => {
	const { projects, isLoading, refreshProjects } = useSharedProjects();

	return (
		<div className="w-full flex flex-col gap-4">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">Mis proyectos compartidos</h1>
			</div>
			<ProjectList
				projects={projects}
				isLoading={isLoading}
				refreshProjects={refreshProjects}
				areSharedProjects
			/>
		</div>
	);
};

export default Page;
