"use client";

import { createProject, type ActionState } from "../actions/create-project";
import { useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/common/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@components/ui/Forms/form";
import { Input } from "@components/ui/common/input";
import { Textarea } from "@components/ui/common/textarea";
import { useUI } from "@components/ui/context";
import { ProjectEntity } from "#types/project";
import { modifyProject } from "../actions/modify-project";

export type ModifyProjectFormData = {
  id: string;
  name?: string;
  description?: string;
};

interface ModifyProjectFormProps {
  onSuccess?: () => void;
  project: ProjectEntity;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const ModifyProjectForm = ({
  onSuccess,
  project,
}: ModifyProjectFormProps) => {
  
  const [state, formAction, isPending] = useActionState(
    modifyProject,
    initialState
  );
  const { closeModal } = useUI();

  const form = useForm<ModifyProjectFormData>({
    defaultValues: {
      id: project.id,
      name: "",
      description: "",
    },
    mode: "onBlur",
  });

  // Call onSuccess when project is created successfully
  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  const parseErrorMessage = (error: string) => {
    switch (error) {
      case "Invalid credentials.":
        return "Usuario o contraseña no corresponden a un usuario registrado";
      case "Not authenticated":
        return "Debes iniciar sesión para modificar un proyecto";
      case "Data not updated":
        return "Debe modificar algun campo para poder actualizarlo";
      case "Something went wrong.":
      default:
        return "Ocurrió un error inesperado";
    }
  };

  if (!project) return <></>;

  if (state?.success && onSuccess) {
    return (
      <div className="flex flex-col gap-4 justify-center p-2 items-center">
        <h2 className="font-medium">
          Se ha modificado el proyecto exitosamente!
        </h2>
        <Button className="uppercase" onClick={closeModal}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-6">
        <h2 className="text-3xl font-medium text-center">Modificar proyecto</h2>
        <div className="hidden">
          <FormField
            control={form.control}
            name="id"
            rules={{
              required: "id is required",
            }}
            render={({ field }) => (
              <FormItem>
                
                <FormControl>
                  <Input
                    type="text"
                    defaultValue={project.id}
                    name="id"
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="name"
          rules={{
            required: "Name is required",
            maxLength: 100,
          }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Nombre del proyecto</FormLabel>
                <span className="text-sm text-gray-500">
                  Máximo 100 caracteres
                </span>
              </div>
              <FormControl>
                <Input
                  type="text"
                  defaultValue={project.name}
                  placeholder="MiProyecto"
                  name="name"
                  required
                  maxLength={100}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          rules={{
            maxLength: 200,
          }}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Descripción</FormLabel>
                <span className="text-sm text-gray-500">
                  Máximo 200 caracteres
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Descripción de tu proyecto"
                  name="description"
                  maxLength={200}
                  disabled={isPending}
                  defaultValue={project.description}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {state?.error && (
          <p className="text-sm text-red-600">
            {parseErrorMessage(state.error)}
          </p>
        )}


        <Button
          type="submit"
          className="uppercase w-full"
          isLoading={isPending}
        >
          Modificar proyecto
        </Button>
      </form>
    </Form>
  );
};
