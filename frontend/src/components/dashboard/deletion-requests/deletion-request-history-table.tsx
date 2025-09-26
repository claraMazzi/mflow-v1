import type { DeletionRequest } from "#types/deletion-request";
import { Badge, StaticColor } from "@components/ui/common/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

interface DeletionRequestHistoryTableProps {
  deletionRequests: DeletionRequest[];
}

export function DeletionRequestHistoryTable({
  deletionRequests,
}: DeletionRequestHistoryTableProps) {
  // Filter approved and denied requests and sort by review date (newest to oldest)
  const historyRequests = deletionRequests
    .filter(request => request.state === "ACEPTADA" || request.state === "RECHAZADA")
    .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());

  // Format date to dd/MM/yy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  const getStateBadgeVariant = (state: string): StaticColor => {
    switch (state) {
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
      case "ACEPTADA":
        return "Aceptada";
      case "RECHAZADA":
        return "Rechazada";
      default:
        return state;
    }
  };

  if (!historyRequests || !historyRequests.length) {
    return <p>No se han encontrado solicitudes de eliminación procesadas.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-200 hover:bg-gray-200">
          <TableRow>
            <TableHead className="font-semibold text-foreground">
              Fecha de Solicitud
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Fecha de Resolución
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
            <TableHead className="font-semibold text-foreground">
              Revisado por
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {historyRequests.map((deletionRequest) => (
            <TableRow key={deletionRequest.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                {formatDate(deletionRequest.registeredAt)}
              </TableCell>
              <TableCell className="font-medium">
                {formatDate(deletionRequest.reviewedAt)}
              </TableCell>
              <TableCell className="font-medium">
                {deletionRequest.project.name}
              </TableCell>
              <TableCell>
                {deletionRequest.requestingUser.name}
              </TableCell>
              <TableCell>
                {deletionRequest.project.owner.name}
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
              <TableCell>
                {deletionRequest.reviewer?.name || "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
