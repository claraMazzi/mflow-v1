"use client";

import { Button } from "@components/ui/common/button";
import { Socket } from "socket.io-client";

interface FinalizeVersionModalProps {
  roomId: string;
  socket: Socket;
  hasEditingRights: boolean;
  onClose: () => void;
}

export function FinalizeVersionModal({
  roomId,
  socket,
  hasEditingRights,
  onClose,
}: FinalizeVersionModalProps) {
  const handleAccept = () => {
    // Emit socket event to finalize (with mock data for now)
    socket.emit("finalize-version-confirm", {
      roomId,
      // Mock data
      timestamp: new Date(),
    });
    // Broadcast close event to all users
    socket.emit("finalize-version-modal-close", { roomId });
    onClose();
  };

  const handleCancel = () => {
    // Broadcast close event to all users
    socket.emit("finalize-version-modal-close", { roomId });
    onClose();
  };

  return (
    <div className="flex max-w-md flex-col mx-auto justify-center items-center p-4">
      <p className="text-base text-center flex flex-col items-center gap-2">
        ¿Está seguro que desea finalizar la revisión? 
        <span className="font-bold">Esta operación no es reversible.</span>
      </p>
      <div className="flex justify-center space-x-3 mt-3 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={!hasEditingRights}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={!hasEditingRights}
        >
          Aceptar
        </Button>
      </div>
    </div>
  );
}

