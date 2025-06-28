"use client";

import { Plus } from "lucide-react";
import { Button } from "@components/ui/common/button";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ProjectEntity } from "#types/project";
import ContentCard from "@components/ui/Cards/ContentCard";
import { Skeleton } from "@components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUI } from "@components/ui/context";

const MyProjects = () => {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ProjectEntity[]>();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter()
  const { openModal } = useUI()

  useEffect(() => {
    const getProjects = async () => {
      try {
        const response = await fetch("/api/projects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.auth}`, // Use the token from the session
          },
        });

        const data = await response.json();
        if (data && data.count > 0) {
          setProjects(data.projects);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    getProjects();
  }, [session]);

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
              const popoverOptions = [
                {
                  content: (
                    <Button variant={"optionList"}
                    onClick={() => {
                      openModal({
                        name: "fullscreen-modal",
                        title: "Full Screen Modal",
                        size: "md",
                        content: (
                          <div className="space-y-6">
                            <p>This modal takes up the full screen on all devices.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-muted p-4 rounded">
                                <h3 className="font-semibold mb-2">Section 1</h3>
                                <p className="text-sm">Content for section 1...</p>
                              </div>
                              <div className="bg-muted p-4 rounded">
                                <h3 className="font-semibold mb-2">Section 2</h3>
                                <p className="text-sm">Content for section 2...</p>
                              </div>
                            </div>
                          </div>
                        ),
                      })
                    }}
                    >Compartir proyecto</Button>
                  ),
                },
                {
                  content: (
                    <Button variant={"optionList"}>Exportar proyecto</Button>
                  ),
                },
                {
                  content: (
                    <Button variant={"optionList"}>Modificar proyecto</Button>
                  ),
                },
                {
                  content: (
                    <Button variant={"optionList"}>
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
                  action={()=> {
                    router.push(`/dashboard/project/${project.id}`) // Navigate to the project details page
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div>Todavía no tenes ningun proyecto creado</div>
        )}
      </div>
      <Button className="uppercase">
        <Plus />
        Crear proyecto
      </Button>
    </div>
  );
};

export default MyProjects;
