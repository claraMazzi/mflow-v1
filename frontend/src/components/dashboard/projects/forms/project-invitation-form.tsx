"use client";

import { startTransition, useActionState } from "react";
import { Button } from "@components/ui/common/button";
import { ProjectEntity } from "@src/types/project";
import { acceptProjectCollaborationInvitation } from "../actions/share-project";
import { useRouter } from "next/navigation";
export type ShareProjectFormData = {
  id: string;
  collaborators?: string[];
};

interface ShareProjectFormProps {
  project?: ProjectEntity;
  token?: string;
}

const initialState = {
  error: undefined,
  success: false,
};

const parseErrorMessage = (error:string) => { 
  switch (error) {
    case 'Owner cannot be collaborator':
        return "El dueño del proyecto no puede aceptar la invitación a colaborar"
    case 'User is already a collaborator':
      return "Usted ya es un colaborador en este proyecto"
    case 'Project does not exists - deleted':
      return "El proyecto al que fue invitado ya no existe"
    
    default:
      break;
  }
}

export const ProjectInvitationForm = ({
  project,
  token,
}: ShareProjectFormProps) => {
  const [inviteState, inviteAction, isInvitePending] = useActionState(
    acceptProjectCollaborationInvitation,
    initialState
  );
  const router = useRouter();

  const acceptInvitation = async () => {
    // formData.append("id", project.id);
    // formData.append("collaborators", JSON.stringify(collaborators));
    startTransition(() => {
      if (token) inviteAction(token);
    });
  };

  // Handle successful invitation sending
  // useEffect(() => {
  //   if (inviteState?.success) {
  //     setCollaborators([])
  //     // You could add a success toast here
  //   }
  // }, [inviteState?.success])

  if (inviteState?.success) {
    router.push("/dashboard/shared");
    //aca hacer un redirect
    // return (
    //   <div className="flex flex-col gap-4 justify-center p-2 items-center">
    //     <h2 className="font-medium">
    //       Se ha compartido el proyecto exitosamente!
    //     </h2>
    //     <Button className="uppercase" onClick={closeModal}>
    //       Continuar
    //     </Button>
    //   </div>
    // );
  }

  if (!project || !token)
    return (
      <div className="flex flex-col items-center">
        <h1 className="text-3xl font-medium text-center text-purple-600">
          MFLOW
        </h1>
        <div>Esta invitación es inválida o ha expirado</div>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Header */}
      <h1 className="text-3xl font-medium text-center text-purple-600">
        MFLOW
      </h1>

      <div>
        ¿Desea participar en <strong>{project.name}</strong>?
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
          <p className="text-sm text-red-600">{parseErrorMessage(inviteState?.error)}</p>
        </div>
      )}
    </div>
  );
};
