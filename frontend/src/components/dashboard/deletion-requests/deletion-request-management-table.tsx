import type { DeletionRequest } from "#types/deletion-request";
import { Badge, StaticColor } from "@components/ui/common/badge";
import { Button } from "@components/ui/common/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Edit } from "lucide-react";
import { useUI } from "@components/ui/context";
import { ManageDeletionRequestModal } from "./forms/manage-deletion-request-modal";

interface DeletionRequestManagementTableProps {
  deletionRequests: DeletionRequest[];
  refreshDeletionRequests: () => void;
}

export function DeletionRequestManagementTable({
  deletionRequests,
  refreshDeletionRequests,
}: DeletionRequestManagementTableProps) {
  const { openModal } = useUI();

  const getStateBadgeVariant = (state: string): StaticColor => {
    switch (state) {
      case "PENDIENTE":
        return "yellow";
      case "ACEPTADA":
        return "green";
      case "RECHAZADA":
        return "white";
      default:
        return "gray";
    }
  };

  const getStateDisplayName = (state: string) => {
    switch (state) {
      case "PENDIENTE":
        return "Pendiente";
      case "ACEPTADA":
        return "Aceptada";
      case "RECHAZADA":
        return "Rechazada";
      default:
        return state;
    }
  };

  const handleManageDeletionRequest = (deletionRequest: DeletionRequest) => {
    openModal({
      name: "fullscreen-modal",
      title: "Gestionar Solicitud de Eliminación",
      size: "lg",
      showCloseButton: false,
      content: (
        <ManageDeletionRequestModal
          deletionRequest={deletionRequest}
          onSuccess={() => {
            refreshDeletionRequests();
          }}
        />
      ),
    });
  };

  if (!deletionRequests || !deletionRequests.length) {
    return <p>No se han encontrado solicitudes de eliminación.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-foreground">
              Nombre del Proyecto
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Usuario Solicitante
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Dueño del Proyecto
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Motivo de solicitud
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Estado
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Gestionar
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deletionRequests.map((deletionRequest) => (
            <TableRow key={deletionRequest.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                {deletionRequest.project.name}
              </TableCell>
              <TableCell>
                {deletionRequest.requestingUser.name} - {deletionRequest.requestingUser.email}
              </TableCell>
              <TableCell>
                {deletionRequest.project.owner}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {deletionRequest.motive}
              </TableCell>
              <TableCell>
                <Badge
                  color={getStateBadgeVariant(deletionRequest.state)}
                >
                  {getStateDisplayName(deletionRequest.state)}
                </Badge>
              </TableCell>
              <TableCell className="text-center flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 !p-0 hover:bg-muted"
                  onClick={() => handleManageDeletionRequest(deletionRequest)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">
                    Gestionar solicitud de {deletionRequest.project.name}
                  </span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
