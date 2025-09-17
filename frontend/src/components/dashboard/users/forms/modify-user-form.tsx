"use client";

import { type ActionState } from "../actions/modify-user";
import { useActionState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
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
import { Checkbox } from "@components/ui/common/checkbox";
import { useUI } from "@components/ui/context";
import { User } from "#types/user";
import { Badge } from "@components/ui/common/badge";
import { getRoleBadgeVariant, getRoleDisplayName } from "@lib/utils";

export type ModifyUserFormData = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  roles: string[];
};


interface ModifyUserFormProps {
  onSuccess?: (form?: ModifyUserFormData) => void;
  onClose?: () => void;
  formActionCallback: (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState> | ActionState;
  user: User;
  disableFieldsMapping: {
    name: boolean;
    lastName: boolean;
    email: boolean;
    roles: boolean;
  };
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const ModifyUserForm = ({
  onSuccess,
  onClose,
  formActionCallback,
  user,
  disableFieldsMapping,
}: ModifyUserFormProps) => {
  const [state, formAction, isPending] = useActionState(
    formActionCallback,
    initialState
  );

  const { closeModal } = useUI();

  const form = useForm<ModifyUserFormData>({
    defaultValues: {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles || ["MODELADOR"],
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (state?.success && onSuccess) {
      console.log('prev')
      onSuccess(form.getValues());
    }
  }, [state?.success, onSuccess]);

  const parseErrorMessage = (error: string) => {
    console.log('errormess', error)
    switch (error) {
      case "Invalid credentials.":
        return "Usuario o contraseña no corresponden a un usuario registrado";
      case "Not authenticated":
        return "Debes iniciar sesión para modificar un usuario";
      case "No updated data":
        return "Debe modificar algún campo para poder actualizarlo";
      case "Something went wrong.":
      default:
        return "Ocurrió un error inesperado";
    }
  };

  if (!user) return <></>;

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4 justify-center p-6 items-center">
        <h2 className="font-medium text-lg">
          Se ha modificado el usuario exitosamente!
        </h2>
        <Button className="uppercase" onClick={closeModal}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form action={formAction} className="p-4 space-y-6">
        <h2 className="text-3xl font-medium text-center">Editar usuario</h2>

        <input type="hidden" name="id" value={user.id} />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            rules={{
              required: "Nombre es requerido",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nombre <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={user.name}
                    disabled={disableFieldsMapping.name}
                    className="border-2 border-blue-200 focus:border-blue-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            rules={{
              required: "Apellido es requerido",
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Apellido <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder={user.lastName}
                    disabled={disableFieldsMapping.lastName}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            rules={{
              required: "Email es requerido",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Email inválido",
              },
            }}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>
                  Email <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="juanignacioalbani@gmail.com"
                    disabled={disableFieldsMapping.email}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Roles</h3>
          {disableFieldsMapping.roles ? (
             <div className="flex flex-wrap gap-1">
              {user.roles.map((role) => {
                return (
                <Badge
                  key={role}
                  color={getRoleBadgeVariant(role)}
                >
                  {getRoleDisplayName(role)}
                </Badge>
              )})}
            </div>
          ) : (
            <FormField
              control={form.control}
              name="roles"
              rules={{
                validate: (value) => {
                  if (!value || value.length === 0) {
                    return "Debe seleccionar al menos un rol";
                  }
                  return true;
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin"
                        name="roles"
                        value="ADMIN"
                        disabled={disableFieldsMapping.roles}
                        checked={field.value?.includes("ADMIN")}
                        onCheckedChange={(checked) => {
                          const currentRoles = field.value || [];
                          if (checked) {
                            field.onChange([
                              ...currentRoles.filter((r) => r !== "ADMIN"),
                              "ADMIN",
                            ]);
                          } else {
                            field.onChange(
                              currentRoles.filter((r) => r !== "ADMIN")
                            );
                          }
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label htmlFor="admin" className="text-sm font-medium">
                        Administrador
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verificador"
                        name="roles"
                        value="VERIFICADOR"
                        disabled={disableFieldsMapping.roles}
                        checked={field.value?.includes("VERIFICADOR")}
                        onCheckedChange={(checked) => {
                          const currentRoles = field.value || [];
                          if (checked) {
                            field.onChange([
                              ...currentRoles.filter(
                                (r) => r !== "VERIFICADOR"
                              ),
                              "VERIFICADOR",
                            ]);
                          } else {
                            field.onChange(
                              currentRoles.filter((r) => r !== "VERIFICADOR")
                            );
                          }
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="verificador"
                        className="text-sm font-medium"
                      >
                        Verificador
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="modelador"
                        name="roles"
                        value="MODELADOR"
                        disabled
                        checked={field.value?.includes("MODELADOR")}
                        onCheckedChange={(checked) => {
                          const currentRoles = field.value || [];
                          if (checked) {
                            field.onChange([
                              ...currentRoles.filter((r) => r !== "MODELADOR"),
                              "MODELADOR",
                            ]);
                          } else {
                            field.onChange(
                              currentRoles.filter((r) => r !== "MODELADOR")
                            );
                          }
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="modelador"
                        className="text-sm font-medium"
                      >
                        Modelador
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">
            {parseErrorMessage(state.error)}
          </p>
        )}

        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            className="uppercase bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
