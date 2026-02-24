"use client";

import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { Textarea } from "@components/ui/common/textarea";
import { useUI } from "@components/ui/context";
import { ProjectEntity } from "#types/project";
import { ActionState, requestProjectDeletion } from "../actions/request-project-deletion";

type DeletionRequestFormData = {
  id: string;
  motive?: string;
};

interface DeletionRequestFormProps {
  onSuccess?: () => void;
  project: ProjectEntity;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const DeletionRequestForm = ({
  onSuccess,
  project,
}: DeletionRequestFormProps) => {
  const [state, formAction, isPending] = useActionState(
    requestProjectDeletion,
    initialState
  );
  const { closeModal } = useUI();

  const form = useForm<DeletionRequestFormData>({
    defaultValues: {
      id: project.id,
      motive: "",
    },
    mode: "onBlur",
  });

  // Call onSuccess when project is created successfully
  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  const onSubmit = (data: DeletionRequestFormData) => {
    const formData = new FormData();
    formData.append("id", data.id);
    formData.append("motive", data.motive || "");
    startTransition(() => {
      formAction(formData);
    });
  };

  if (state?.success && onSuccess) {
    return (
      <div className="flex flex-col gap-4 justify-center p-2 items-center">
        <h2 className="font-medium">
          Eliminación solicitada exitosamente!
        </h2>
        <Button className="uppercase" onClick={closeModal}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-3xl font-medium text-center">
        Solicitar Eliminación de Proyecto
      </h2>
      
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Motivo de la solicitud <span className="text-sm text-red-600"> *</span>
          </label>
          <span className="text-sm text-gray-500">
            Por favor, adjunte la razón por la que quiere eliminar el proyecto
          </span>
        </div>
        <Textarea
          placeholder="Razon de para solicitar eliminación de proyecto"
          {...form.register("motive", {
            required: "El motivo es obligatorio",
            maxLength: {
              value: 200,
              message: "Máximo 200 caracteres"
            }
          })}
          maxLength={200}
          disabled={isPending}
        />
        {form.formState.errors.motive && (
          <p className="text-sm text-red-600">{form.formState.errors.motive.message}</p>
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
        Enviar solicitud
      </Button>
    </form>
  );
};
