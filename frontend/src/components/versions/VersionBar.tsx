import React, { useEffect, useRef } from "react";
import { Button } from "@components/ui/common/button";
import {
  ActiveEditingRequest,
  EditingRequest,
} from "@hooks/use-request-editing-rights";
import { Collaborator } from "#types/collaboration";
import { ArrowLeft, Check, Edit } from "lucide-react";
import { useUI } from "../ui/context";
import { CollaboratorAvatar } from "./CollaboratorAvatar";
import { Socket } from "socket.io-client";
import { ConceptualModel, ImageInfo, VersionState } from "#types/conceptual-model";
import { exportVersionToExcel } from "@lib/export-version";
import { useRouter } from "next/navigation";
interface VersionBarProps {
  canUserSendEditingRequest: boolean;
  handleRequestEditingRights: () => void;
  pendingEditingRequests: EditingRequest[];
  collaborators: Map<string, Collaborator>;
  handleEditingRequestEvaluation: ({
    requestId,
    action,
  }: {
    requestId: string;
    action: "accept" | "decline";
  }) => () => void;
  title: string;
  onFollowUser?: (userId: string) => void;
  followingUserId?: string | null;
  currentUserId?: string | null;
  roomId: string;
  socket: Socket;
  conceptualModel: ConceptualModel;
  imageInfos?: Map<string, ImageInfo>;
  versionState: VersionState;
}

const VersionBar = ({
  canUserSendEditingRequest,
  handleRequestEditingRights,
  pendingEditingRequests,
  collaborators,
  handleEditingRequestEvaluation,
  title,
  onFollowUser,
  followingUserId,
  currentUserId,
  roomId,
  socket,
  conceptualModel,
  imageInfos,
  versionState,
}: VersionBarProps) => {
  const isVersionEditable = versionState === "EN EDICION";
  const { addEditingRequestToast, removeEditingRequestToast } = useUI();
  const shownRequestsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const handleExport = async () => {
    await exportVersionToExcel({
      conceptualModel,
      title: title || "version",
      imageInfos: imageInfos || new Map(),
    });
  };

  // Show toast for each pending request
  useEffect(() => {
    const validPendingRequests = pendingEditingRequests
      .filter((r): r is ActiveEditingRequest => r.status === "pending")
      .filter((r) => collaborators.get(r.requesterUserId));

    if (!validPendingRequests.length) return

    // First, clean up shown requests that are no longer pending
    const currentRequestIds = new Set(
      validPendingRequests.map((r) => r.requestId!)
    );
    shownRequestsRef.current.forEach((requestId) => {
      if (!currentRequestIds.has(requestId)) {
        shownRequestsRef.current.delete(requestId);
        // Remove the toast from UI context and broadcast to other tabs
        removeEditingRequestToast(requestId);
      }
    });

    // Then, add toasts for new pending requests
    validPendingRequests.forEach((request) => {
    if (!shownRequestsRef.current.has(request.requestId!)) {
        shownRequestsRef.current.add(request.requestId!);
        const collaborator = collaborators.get(request.requesterUserId)!;

        addEditingRequestToast({
          id: request.requestId!,
          type: "editing-request",
          request,
          collaborator,
          handleEditingRequestEvaluation,
        });
      }
    });
  }, [
    pendingEditingRequests,
    // addEditingRequestToast,
    // removeEditingRequestToast,
    // collaborators,
    // handleEditingRequestEvaluation
  ]);

  const collaboratorList = Array.from(collaborators.values());

  // Get state badge styling based on version state
  const getStateBadge = () => {
    switch (versionState) {
      case "EN EDICION":
        return null; // Don't show badge for editable state
      case "FINALIZADA":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Finalizada
          </span>
        );
      case "PENDIENTE DE REVISION":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Pendiente de Revisión
          </span>
        );
      case "REVISADA":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Revisada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-blue-50 h-16 flex justify-between items-center p-4">
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeft className="w-5 h-5 text-gray-500 cursor-pointer" onClick={() => router.push(`/dashboard`)} />
          <p className="text-lg font-bold">{title}</p>
          {getStateBadge()}
          {!isVersionEditable && (
            <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
              Solo lectura
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Active collaborators avatars */}
          <div className="flex items-center gap-2 -space-x-2">
            {collaboratorList.map((collaborator) => {
              if (collaborator.userId === currentUserId) return null;
              return (
                <CollaboratorAvatar
                  key={collaborator.userId}
                  collaborator={collaborator}
                  isFollowing={followingUserId === collaborator.userId}
                  onClick={() => onFollowUser?.(collaborator.userId)}
                  size="sm"
                />
              );
            })}
          </div>
          <Button
            disabled={!isVersionEditable || !canUserSendEditingRequest}
            onClick={handleRequestEditingRights}
            title={!isVersionEditable ? "Esta versión no se puede editar" : undefined}
          >
            <Edit className="h-4 w-4" />
            SOLICITAR EDICIÓN
          </Button>

          <Button onClick={handleExport}>
            EXPORTAR
          </Button>

          <Button
            variant="secondary"
            disabled={!isVersionEditable || canUserSendEditingRequest} //if can't send editing request it's because user has editing rights
            onClick={() => {
              socket.emit("finalize-version", { roomId });
            }}
            title={!isVersionEditable ? "Esta versión ya fue finalizada" : undefined}
          >
            <Check className="h-4 w-4" />
            FINALIZAR
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VersionBar;
