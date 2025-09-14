"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@components/ui/common/button";
import { ProjectEntity } from "@src/types/project";
// import { acceptProjectCollaborationInvitation } from "../actions/invite-user";
import { useRouter } from "next/navigation";
import { updateUserRoleWithInvitation } from "../actions/invite-user";

interface InviteUserFormProps {
  roles?: string[];
  token?: string;
}

const initialState = {
  error: undefined,
  success: false,
};

const parseErrorMessage = (error: string) => {
  switch (error) {
    case "User already has these roles":
      return "El usuario ya tiene estos roles";
    case "Sender cannot be the recipient":
    case "Not valid token":
      return "Esta invitación es inválida o ha expirado";

    default:
      break;
  }
};

export const UserInvitationForm = ({ roles, token }: InviteUserFormProps) => {
  const [inviteState, inviteAction, isInvitePending] = useActionState(
    updateUserRoleWithInvitation,
    initialState
  );
  const router = useRouter();

  const acceptInvitation = async () => {
    startTransition(() => {
      if (token) inviteAction(token);
    });
  };

  if (!roles || !token)
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>
        <div>Esta invitación es inválida o ha expirado</div>
      </div>
    );

  if (inviteState?.success) {
    const singular = roles.length <= 1;
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>
        <div>
          {singular
            ? "Los roles fueron aceptados correctamente"
            : "el rol fue aceptado correctamente"}{" "}
        </div>
        <Button
          as="a"
          href="/dashboard"
          className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Header */}
      <h1 className="text-3xl font-medium text-center text-purple-600">
        MFLOW
      </h1>

      <div>
        ¿Desea aceptar los roles{" "}
        <strong>{roles.map((role: string) => role)}</strong>?
      </div>
      <div className="grid grid-cols-2 w-full gap-2">
        <Button
          as="a"
          href="/dashboard"
          className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
          variant={"outline"}
        >
          Rechazar invitación
        </Button>
        <Button
          onClick={acceptInvitation}
          className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
          disabled={isInvitePending}
        >
          {isInvitePending ? "Aceptando..." : "Aceptar invitacion"}
        </Button>
      </div>

      {/* Error Messages */}
      {inviteState?.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg w-full text-center">
          <p className="text-sm text-red-600">
            {parseErrorMessage(inviteState?.error)}
          </p>
        </div>
      )}
    </div>
  );
};
