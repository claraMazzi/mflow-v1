"use client";

import { Plus } from "lucide-react";
import { Button } from "@components/ui/common/button";
import React from "react";
import { useUI } from "@components/ui/context";
import { CreateProjectForm } from "./forms/create-project-form";
import { useProjects } from "@hooks/use-projects";
import ProjectList from "./project-list";

const MyProjects = () => {
  const { projects, isLoading, refreshProjects } = useProjects();
  const { openModal } = useUI();

  const handleCreateProject = () => {
    openModal({
      name: "fullscreen-modal",
      title: "Crear proyecto",
      size: "md",
      showCloseButton: false,
      content: (
        <CreateProjectForm
          onSuccess={() => {
            refreshProjects();
          }}
        />
      ),
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold">Mis proyectos</h1>
        <Button className="uppercase" onClick={handleCreateProject}>
        <Plus />
        Crear proyecto
      </Button>
      </div>
      <ProjectList
        projects={projects || []}
        isLoading={isLoading}
        refreshProjects={refreshProjects}
      />
      
    </div>
  );
};

export default MyProjects;
