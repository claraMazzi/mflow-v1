"use client";

import { type ActionState } from "../actions/create-project";
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
import { requestProjectDelition } from "../actions/request-project-delition";

export type ModifyProjectFormData = {
  id: string;
  motive?: string;
};

interface ModifyProjectFormProps {
  onSuccess?: () => void;
  project: ProjectEntity;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const DelitionRequestForm = ({
  onSuccess,
  project,
}: ModifyProjectFormProps) => {
  const [state, formAction, isPending] = useActionState(
    requestProjectDelition,
    initialState
  );
  const { closeModal } = useUI();

  const form = useForm<ModifyProjectFormData>({
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
          Eliminación solicitada exitosamente!
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
        <h2 className="text-3xl font-medium text-center">
          Solicitar Eliminación de Proyecto
        </h2>
        <div className="hidden">
          <FormField
            control={form.control}
            name="id"
            rules={{
              required: "id is required",
            }}
            render={({  }) => (
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
          name="motive"
          rules={{
            required: true,
            maxLength: 200,
          }}
          render={({  }) => (
            <FormItem>
              <div className="flex flex-col gap-2">
                <FormLabel className="!font-bold">Motivo de la solicitud <span className="text-sm text-red-600"> *</span></FormLabel>
                <span className="text-sm text-gray-500">
                  Por favor, adjunte la razón por la que quiere eliminar el
                  proyecto
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Razon de para solicitar eliminación de proyecto"
                  name="motive"
                  maxLength={300}
                  disabled={isPending}
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
          Enviar solicitud
        </Button>
      </form>
    </Form>
  );
};
