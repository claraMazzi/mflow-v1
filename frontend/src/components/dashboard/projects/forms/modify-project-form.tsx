"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { Textarea } from "@components/ui/common/textarea";
import { useUI } from "@components/ui/context";
import { ProjectEntity } from "#types/project";
import { modifyProject, type ActionState } from "../actions/modify-project";

export type ModifyProjectFormData = {
  id: string;
  title: string;
  description: string;
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
      title: project.title || "",
      description: project.description || "",
    },
    mode: "onBlur",
  });

  // Call onSuccess when project is created successfully
  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  const onSubmit = (data: ModifyProjectFormData) => {
    const formData = new FormData();
    formData.append("id", data.id);
    formData.append("title", data.title || "");
    formData.append("description", data.description || "");
    startTransition(() => {
      formAction(formData);
    });
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-3xl font-medium text-center">Modificar proyecto</h2>
      
      {/* Hidden ID field */}
      <div className="hidden">
        <Input
          type="text"
          {...form.register("id", {
            required: "ID is required",
          })}
          required
        />
        {form.formState.errors.id && (
          <p className="text-sm text-red-600">{form.formState.errors.id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Título del proyecto <span className="text-sm text-red-600"> *</span>
          </label>
          <span className="text-sm text-gray-500">
            Máximo 100 caracteres
          </span>
        </div>
        <Input
          type="text"
          placeholder="Mi Proyecto"
          {...form.register("title", {
            required: "El título del proyecto es obligatorio.",
            maxLength: {
              value: 100,
              message: "Máximo 100 caracteres."
            }
          })}
          maxLength={100}
          disabled={isPending}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Descripción
          </label>
          <span className="text-sm text-gray-500">
            Máximo 200 caracteres
          </span>
        </div>
        <Textarea
          placeholder="Descripción de tu proyecto"
          {...form.register("description", {
            maxLength: {
              value: 200,
              message: "Máximo 200 caracteres."
            }
          })}
          maxLength={200}
          disabled={isPending}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">
          {state.error}
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
  );
};
