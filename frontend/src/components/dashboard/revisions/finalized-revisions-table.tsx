"use client";

import type { Revision } from "#types/revision";
import { Badge, StaticColor } from "@components/ui/common/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";

interface FinalizedRevisionsTableProps {
  revisions: Revision[];
  refreshRevisions: () => void;
}

export function FinalizedRevisionsTable({
  revisions,
  refreshRevisions,
}: FinalizedRevisionsTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStateBadgeVariant = (state: string): StaticColor => {
    switch (state) {
      case "PENDIENTE":
        return "light-blue";
      case "EN CURSO":
        return "yellow";
      case "FINALIZADA":
        return "light-green";
      default:
        return "gray";
    }
  };

  const getStateDisplayName = (state: string) => {
    switch (state) {
      case "PENDIENTE":
        return "Pendiente";
      case "EN CURSO":
        return "En curso";
      case "FINALIZADA":
        return "Finalizada";
      default:
        return state;
    }
  };

  if (!revisions || revisions.length === 0) {
    return (
      <p className="text-gray-500">
        No se han encontrado revisiones finalizadas.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100 hover:bg-gray-100">
          <TableRow>
            <TableHead className="font-semibold text-foreground">
              Nombre del Proyecto
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Fecha de Finalización
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Dueño del Proyecto
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {revisions.map((revision) => (
            <TableRow key={revision.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                {revision.project?.name || "Sin proyecto"}
              </TableCell>
              <TableCell>
                {formatDate(revision.finishedAt || revision.updatedAt)}
              </TableCell>
              <TableCell>
                {revision.projectOwner?.email || "Desconocido"}
              </TableCell>
              <TableCell>
                <Badge color={getStateBadgeVariant(revision.state)}>
                  {getStateDisplayName(revision.state)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
