"use client";

import React from "react";
import { Button } from "@components/ui/common/button";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { RevisionDetails, RevisionState, Correction } from "#types/revision";
import { cn } from "@lib/utils";

interface RevisionBarProps {
  revision: RevisionDetails;
  corrections: Correction[];
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
}

const RevisionBar = ({
  revision,
  corrections,
  hasUnsavedChanges,
  isSaving,
  onSave,
}: RevisionBarProps) => {
  const router = useRouter();

  const getStateBadge = (state: RevisionState) => {
    switch (state) {
      case "PENDIENTE":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            Pendiente
          </span>
        );
      case "EN CURSO":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            En Curso
          </span>
        );
      case "FINALIZADA":
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Finalizada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-amber-50 h-16 flex justify-between items-center px-4 border-b border-amber-200">
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeft
            className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
            onClick={() => router.push("/dashboard/revision/ongoing")}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Revisando:</span>
              <p className="text-lg font-bold text-gray-800">
                {revision.version.title}
              </p>
              {getStateBadge(revision.state)}
            </div>
            {revision.project && (
              <p className="text-xs text-gray-500">
                Proyecto: {revision.project.title} • Dueño:{" "}
                {revision.project.owner.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Corrections counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-amber-200">
            <span className="text-sm text-gray-600">Correcciones:</span>
            <span className="font-semibold text-amber-600">
              {corrections.length}
            </span>
            {hasUnsavedChanges && (
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* Save button */}
          <Button
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              "gap-2",
              hasUnsavedChanges 
                ? "bg-amber-500 hover:bg-amber-600" 
                : "bg-gray-400 hover:bg-gray-400"
            )}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RevisionBar;
