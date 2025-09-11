"use client";

import { inviteUsers, type ActionState } from "../actions/invite-user";
import { useActionState, useEffect, useState } from "react";
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
import { Checkbox } from "@components/ui/common/checkbox";
import { X, Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

export type InviteUserFormData = {
  email: string;
  roles: string[];
};

interface InviteUserFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const InviteUserForm = ({ onSuccess, onClose }: InviteUserFormProps) => {
  const [state, formAction, isPending] = useActionState(
    inviteUsers,
    initialState
  );
  const [pendingInvitations, setPendingInvitations] = useState<
    Array<{ email: string; roles: string[] }>
  >([]);

  const form = useForm<InviteUserFormData>({
    defaultValues: {
      email: "",
      roles: [],
    },
    mode: "onBlur",
  });

  const handleRoleChange = (role: string, checked: boolean) => {
    const currentRoles = form.getValues("roles") || [];
    let newRoles: string[];

    if (checked) {
      newRoles = [...currentRoles.filter((r) => r !== role), role];
    } else {
      newRoles = currentRoles.filter((r) => r !== role);
    }

    form.setValue("roles", newRoles);
    form.trigger("roles");
  };

  const handleAddInvitation = () => {
    const formData = form.getValues();
    if (formData.email && formData.roles.length > 0) {
      setPendingInvitations((prev) => [
        ...prev,
        { email: formData.email, roles: [...formData.roles] },
      ]);
      form.reset({ email: "", roles: [] });
    }
  };

  const handleRemoveInvitation = (index: number) => {
    setPendingInvitations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendInvitations = () => {
    if (pendingInvitations.length > 0) {
      const formData = new FormData();
      formData.append("invitations", JSON.stringify(pendingInvitations));
      formAction(formData);
    }
  };

  useEffect(() => {
    if (state?.success && onSuccess) {
      setPendingInvitations([]);
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  const parseErrorMessage = (error: string) => {
    switch (error) {
      case "Invalid email format":
        return "Formato de email inválido";
      case "No invitations to send":
        return "No hay invitaciones para enviar";
      case "Something went wrong.":
      default:
        return "Ocurrió un error inesperado";
    }
  };

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4 justify-center p-6 items-center">
        <h2 className="font-medium text-lg">
          ¡Invitaciones enviadas exitosamente!
        </h2>
        <Button className="uppercase" onClick={onClose}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <h2 className="text-3xl font-medium text-center">Invitar usuario</h2>

        <div className="grid grid-cols-5 gap-2 items-end">
          <div className="col-span-3 self-baseline">
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
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      disabled={isPending}
                      className="border-2 border-gray-200 focus:border-blue-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="col-start-4 ml-4 self-baseline">
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
                  <FormLabel>Roles a asignar:</FormLabel>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="admin-invite"
                        checked={field.value?.includes("ADMIN")}
                        onCheckedChange={(checked) => {
                          handleRoleChange("ADMIN", checked as boolean);
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="admin-invite"
                        className="text-sm font-medium"
                      >
                        Administrador
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verificador-invite"
                        checked={field.value?.includes("VERIFICADOR")}
                        onCheckedChange={(checked) => {
                          handleRoleChange("VERIFICADOR", checked as boolean);
                        }}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                      <label
                        htmlFor="verificador-invite"
                        className="text-sm font-medium"
                      >
                        Verificador
                      </label>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="button"
            onClick={handleAddInvitation}
            disabled={
              !form.formState.isValid ||
              !form.getValues("email") ||
              form.getValues("roles").length === 0
            }
            className="h-10 w-10 self-center justify-self-center !p-0 bg-gray-100 hover:bg-gray-200 text-gray-600"
            variant="outline"
          >
            <UserPlus />
          </Button>
        </div>
      </Form>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-foreground">
              Email
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Roles
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Accion
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingInvitations.map((invitation, index) => (
            <TableRow key={`invitation-${index}`} className="hover:bg-muted/30">
              <TableCell className="">{invitation.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {invitation.roles.map((role) => (
                    <span
                      key={role}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role === "ADMIN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {role === "ADMIN" ? "Administrador" : "Verificador"}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-center flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveInvitation(index)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {state?.error && (
        <p className="text-sm text-red-600">{parseErrorMessage(state.error)}</p>
      )}

      <div className="flex justify-center pt-4">
        <Button
          type="button"
          onClick={handleSendInvitations}
          className="uppercase bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium"
          disabled={isPending || pendingInvitations.length === 0}
        >
          {isPending ? "Enviando..." : "Enviar invitaciones"}
        </Button>
      </div>
    </div>
  );
};
