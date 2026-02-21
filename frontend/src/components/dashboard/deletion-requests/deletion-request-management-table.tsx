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

  // Filter pending requests and sort by date (oldest to newest)
  const pendingRequests = deletionRequests
    .filter(request => request.state === "PENDIENTE")
    .sort((a, b) => {
      const timeA = new Date(a.registeredAt).getTime();
      const timeB = new Date(b.registeredAt).getTime();
      return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB);
    });

  // Format date to dd/MM/yy; accepts string, Date, or { $date: string }. Returns "—" if invalid or missing
  const formatDate = (value: string | Date | undefined | null | { $date?: string }) => {
    if (value == null) return "—";
    const date =
      value instanceof Date
        ? value
        : new Date(typeof value === "string" ? value : (value as { $date?: string })?.$date ?? "");
    if (Number.isNaN(date.getTime())) return "—";
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return "—";
    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
  };

  const getStateBadgeVariant = (state: string): StaticColor => {
    switch (state) {
      case "PENDIENTE":
        return "light-blue";
      case "ACEPTADA":
        return "light-green";
      case "RECHAZADA":
        return "bordo";
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

  if (!pendingRequests || !pendingRequests.length) {
    return <p>No se han encontrado solicitudes de eliminación pendientes.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-200 hover:bg-gray-200">
          <TableRow >
            <TableHead className="font-semibold text-foreground">
              Fecha de Solicitud
            </TableHead>
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
        <TableBody className="bg-white">
          {pendingRequests.map((deletionRequest) => (
            <TableRow key={deletionRequest.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                {formatDate(deletionRequest.registeredAt)}
              </TableCell>
              <TableCell className="font-medium">
                {deletionRequest.project.title}
              </TableCell>
              <TableCell>
                {deletionRequest.requestingUser.name} {deletionRequest.requestingUser.lastName}
              </TableCell>
              <TableCell>
                {deletionRequest.project.owner.name} {deletionRequest.project.owner.lastName}
              </TableCell>
              <TableCell className="max-w-xs wrap-break-word whitespace-break-spaces break-all">
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
                    Gestionar solicitud de {deletionRequest.project.title}
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
