"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DeletionRequest } from "#types/deletion-request";
import { Button } from "@components/ui/common/button";
import { Textarea } from "@components/ui/common/textarea";
import { Label } from "@components/ui/common/label";
import { ExternalLink } from "lucide-react";
import { approveDeletionRequest } from "../actions/approve-deletion-request";
import { denyDeletionRequest } from "../actions/deny-deletion-request";
import { useUI } from "@components/ui/context";

interface ManageDeletionRequestModalProps {
  deletionRequest: DeletionRequest;
  onSuccess: () => void;
}

export function ManageDeletionRequestModal({
  deletionRequest,
  onSuccess,
}: ManageDeletionRequestModalProps) {
  const { data: session } = useSession();
  const { closeModal } = useUI();
  const [isLoading, setIsLoading] = useState(false);
  const [denyReason, setDenyReason] = useState("");
  const [action, setAction] = useState<"approve" | "deny" | null>(null);

  const handleApprove = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const result = await approveDeletionRequest({
        deletionRequestId: deletionRequest.id,
        reviewer: session.user.id,
      });

      if (result.success) {
        onSuccess();
        closeModal();
      } else {
        console.error("Error approving deletion request:", result.error);
      }
    } catch (error) {
      console.error("Error approving deletion request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const result = await denyDeletionRequest({
        deletionRequestId: deletionRequest.id,
        reviewer: session.user.id,
        reason: denyReason,
      });

      if (result.success) {
        onSuccess();
        closeModal();
      } else {
        console.error("Error denying deletion request:", result.error);
      }
    } catch (error) {
      console.error("Error denying deletion request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = () => {
    // Navigate to project view - implement based on your routing
    window.open(`/dashboard/projects/${deletionRequest.project.id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="project-name" className="text-sm font-medium">
            Nombre del proyecto *
          </Label>
          <div className="mt-1 text-sm text-gray-900">
            {deletionRequest.project.name}
          </div>
        </div>

        <div>
          <Label htmlFor="requesting-user" className="text-sm font-medium">
            Usuario Solicitante *
          </Label>
          <div className="mt-1 text-sm text-gray-900">
            {deletionRequest.requestingUser.name} - {deletionRequest.requestingUser.email}
          </div>
        </div>

        <div>
          <Label htmlFor="project-owner" className="text-sm font-medium">
            Dueño del proyecto *
          </Label>
          <div className="mt-1 text-sm text-gray-900">
            {deletionRequest.project.owner}
          </div>
        </div>

        <div>
          <Label htmlFor="collaborators" className="text-sm font-medium">
            Colaboradores del proyecto *
          </Label>
          <div className="mt-1 text-sm text-gray-900">
            <ul className="list-disc list-inside space-y-1">
              <li>{deletionRequest.project.owner}</li>
              <li>{deletionRequest.requestingUser.name} - {deletionRequest.requestingUser.email}</li>
              {/* Add more collaborators if available in the data */}
            </ul>
          </div>
        </div>

        <div>
          <Label htmlFor="motive" className="text-sm font-medium">
            Motivo de la solicitud de eliminación *
          </Label>
          <div className="mt-1 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {deletionRequest.motive}
            </p>
          </div>
        </div>

        <div>
          <Button
            variant="ghost"
            onClick={handleViewProject}
            className="text-purple-600 hover:text-purple-700 p-0 h-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Proyecto
          </Button>
        </div>
      </div>

      {action === "deny" && (
        <div className="space-y-2">
          <Label htmlFor="deny-reason" className="text-sm font-medium">
            Motivo de la denegación (opcional)
          </Label>
          <Textarea
            id="deny-reason"
            placeholder="Ingrese el motivo de la denegación..."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            rows={3}
          />
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setAction(null)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        
        <Button
          onClick={() => setAction("deny")}
          disabled={isLoading || action === "deny"}
        >
          DENEGAR
        </Button>
        
        <Button
          onClick={() => setAction("approve")}
          disabled={isLoading || action === "approve"}
        >
          ACEPTAR
        </Button>
      </div>

      {action === "approve" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            ¿Está seguro de que desea aprobar esta solicitud de eliminación? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAction(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isLoading}
            >
              {isLoading ? "Aprobando..." : "Confirmar Aprobación"}
            </Button>
          </div>
        </div>
      )}

      {action === "deny" && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            ¿Está seguro de que desea denegar esta solicitud de eliminación?
          </p>
          <div className="flex justify-end space-x-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAction(null)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDeny}
              disabled={isLoading}
            >
              {isLoading ? "Denegando..." : "Confirmar Denegación"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
