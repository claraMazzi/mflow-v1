"use client";

import { Plus } from "lucide-react";
import { Button } from "@components/ui/common/button";
import React, { ReactNode } from "react";
import ContentCard from "@components/ui/Cards/ContentCard";
import { Skeleton } from "@components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUI } from "@components/ui/context";
import { CreateProjectForm } from "./forms/create-project-form";
import { useProjects } from "@hooks/use-projects";
import { ModifyProjectForm } from "./forms/modify-project-form";
import { ProjectEntity } from "@src/types/project";
import { DelitionRequestForm } from "./forms/delition-request-form";
import { projectPendingDelition } from "@src/config/sharedVariables";
import cn from "clsx";

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

const MyProjects = () => {
  const router = useRouter();
  const { openModal } = useUI();
  const { projects, isLoading, refreshProjects } = useProjects();

  const handleShareProject = () => { 
    openModal({
      name: "fullscreen-modal",
      title: "Compartir proyecto",
      size: "md",
      showCloseButton: false,
      content: (
       <>Compartir proyecto</>
      ),
    });
  }

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

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold">Mis proyectos</h1>
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="w-full h-96" />
        ) : projects && projects.length > 0 ? (
          <div className="w-full grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {projects.map((project, index) => {
              const isPendingDelition =
                project.state === projectPendingDelition;
              const popoverOptions = [
                {
                  content: (
                    <Button variant={"optionList"}>Compartir proyecto</Button>
                  ),
                },
                {
                  content: (
                    <Button variant={"optionList"}>Exportar proyecto</Button>
                  ),
                },
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
                  key={`${project}-${index}`}
                  title={project.name}
                  description={project.description}
                  options={popoverOptions}
                  decorators={getProjectDecorators(project)}
                  action={() => {
                    router.push(`/dashboard/project/${project.id}`); // Navigate to the project details page
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div>Todavía no tenes ningun proyecto creado</div>
        )}
      </div>
      <Button className="uppercase" onClick={handleCreateProject}>
        <Plus />
        Crear proyecto
      </Button>
    </div>
  );
};

export default MyProjects;
