"use client";

import { type ActionState } from "../actions/delete-user";
import { useActionState } from "react";
import { Button } from "@components/ui/common/button";
import { useUI } from "@components/ui/context";
import { User } from "#types/user";
import { AlertTriangle, X } from "lucide-react";

interface DeleteUserFormProps {
  onSuccess?: () => void;
  formActionCallback: (
    state: ActionState,
    formData: FormData
  ) => Promise<ActionState> | ActionState;
  user: User;
}

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export const DeleteUserForm = ({
  onSuccess,
  formActionCallback,
  user,
}: DeleteUserFormProps) => {
  const [state, formAction, isPending] = useActionState(
    formActionCallback,
    initialState
  );

  const { closeModal } = useUI();


  const parseErrorMessage = (error: string) => {
    switch (error) {
      case "Not authenticated":
        return "Debes iniciar sesión para eliminar un usuario";
      case "Usuario no encontrado":
        return "El usuario no existe o ya fue eliminado";
      case "No access token available":
        return "Error de autenticación";
      case "Algo salió mal.":
      default:
        return "Ocurrió un error inesperado";
    }
  };

  if (!user) return <></>;

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4 justify-center p-6 items-center">
        <div className="flex items-center gap-2 text-green-600">
          <X className="h-6 w-6" />
          <h2 className="font-medium text-lg">
            Usuario eliminado exitosamente
          </h2>
        </div>
        <p className="text-sm text-gray-600 text-center">
          El usuario {user.name} {user.lastName} ha sido eliminado del sistema.
        </p>
        <Button className="uppercase" onClick={onSuccess}>
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="p-6 space-y-3">
      <div className="flex justify-center items-center gap-4 flex-col">
        <div className="flex justify-center items-center gap-3 ">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <h2 className="text-2xl font-medium">Eliminar Usuario</h2>
        </div>
        <p className="text-sm  font-medium mb-2">
          ¿Estás seguro de que deseas eliminar este usuario?
        </p>
      </div>

      <input type="hidden" name="id" value={user.id} />
    
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Información del usuario:</h3>
        <div className="space-y-1 text-sm text-gray-700">
          <p><span className="font-medium">Nombre:</span> {user.name} {user.lastName}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Roles:</span> {user.roles.join(", ")}</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        
        <p className="text-sm text-red-700">
          Esta acción no se puede deshacer. El usuario será eliminado del sistema
          y ya no podrá acceder a la plataforma.
        </p>
      </div>


      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">
            {parseErrorMessage(state.error)}
          </p>
        </div>
      )}

      <div className="flex justify-center gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="uppercase px-6 py-2"
          onClick={closeModal}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="uppercase bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          disabled={isPending}
        >
          {isPending ? "Eliminando..." : "Eliminar Usuario"}
        </Button>
      </div>
    </form>
  );
};
