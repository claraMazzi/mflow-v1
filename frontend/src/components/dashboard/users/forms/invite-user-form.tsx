"use client";

import { inviteUsers, type ActionState } from "../actions/invite-user";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { Checkbox } from "@components/ui/common/checkbox";
import { Trash2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { useUI } from "@src/components/ui/context";
import { UserRole } from "@src/types/user";

type AssignableUserRole = Extract<UserRole, "VERIFICADOR" | "ADMIN">;

export type InviteUserFormData = {
  email: string;
  roles: AssignableUserRole[];
};

interface InviteUserFormProps {
  onSuccess?: () => void;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const InviteUserForm = ({ onSuccess }: InviteUserFormProps) => {
  const [state, formAction, isPending] = useActionState(
    inviteUsers,
    initialState
  );
  const [pendingInvitations, setPendingInvitations] = useState<
    Array<{ email: string; roles: AssignableUserRole[] }>
  >([]);
  const { closeModal } = useUI();

  const form = useForm<InviteUserFormData>({
    defaultValues: {
      email: "",
      roles: [],
    },
    mode: "onBlur",
  });

  const handleRoleChange = (role: AssignableUserRole, checked: boolean) => {
    const currentRoles = form.getValues("roles") || [];
    let newRoles: AssignableUserRole[];

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
      const emailExists = pendingInvitations.some(
        (invitation) => invitation.email === formData.email
      );
      if (emailExists) {
        form.setError("email", {
          type: "manual",
          message: "Ya existe una invitación para este email.",
        });
        return;
      }
      
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
      startTransition(() => {
        formAction(formData);
      });
    }
  };

  useEffect(() => {
    if (state?.success && onSuccess) {
      setPendingInvitations([]);
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4 justify-center p-6 items-center">
        <h2 className="font-medium text-lg">
          ¡Invitaciones enviadas exitosamente!
        </h2>
        <Button className="uppercase" onClick={closeModal}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-3xl font-medium text-center">Invitar usuario</h2>

        <div className="grid grid-cols-5 gap-2 items-end">
          <div className="col-span-3 self-baseline">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                {...form.register("email", {
                  required: "Email es obligatorio.",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email con formato inválido.",
                  },
                })}
                type="email"
                placeholder="usuario@ejemplo.com"
                disabled={isPending}
                className="border-2 border-gray-200 focus:border-blue-400"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="col-start-4 ml-4 self-baseline">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Roles a asignar: <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin-invite"
                    checked={form.watch("roles")?.includes("ADMIN")}
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
                    checked={form.watch("roles")?.includes("VERIFICADOR")}
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
              {form.formState.errors.roles && (
                <p className="text-sm text-red-600">{form.formState.errors.roles.message}</p>
              )}
            </div>
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
      </div>

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
                  className="h-8 w-8 !p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
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
