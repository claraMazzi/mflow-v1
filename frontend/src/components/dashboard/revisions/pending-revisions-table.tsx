"use client";

import type { Revision } from "#types/revision";
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
import { ClipboardCheck } from "lucide-react";

interface PendingRevisionsTableProps {
  revisions: Revision[];
  refreshRevisions: () => void;
}

export function PendingRevisionsTable({
  revisions,
  refreshRevisions,
}: PendingRevisionsTableProps) {
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

  const handleVerify = (revision: Revision) => {
    // TODO: Implement verification action
    console.log("Verify revision:", revision.id);
    alert(`Verificar revisión del proyecto: ${revision.project?.name}`);
  };

  if (!revisions || revisions.length === 0) {
    return (
      <p className="text-gray-500">
        No se han encontrado revisiones pendientes.
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
              Usuario Solicitante
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Dueño del Proyecto
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Estado
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Verificar
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
                {revision.requestingUser?.name || "Desconocido"}
              </TableCell>
              <TableCell>
                {revision.projectOwner?.email || "Desconocido"}
              </TableCell>
              <TableCell>
                <Badge color={getStateBadgeVariant(revision.state)}>
                  {getStateDisplayName(revision.state)}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 !p-0 hover:bg-muted"
                  onClick={() => handleVerify(revision)}
                >
                  <ClipboardCheck className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">
                    Verificar revisión de {revision.project?.name}
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
