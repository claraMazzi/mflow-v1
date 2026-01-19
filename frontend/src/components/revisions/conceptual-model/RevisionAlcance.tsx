"use client";

import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";

interface RevisionAlcanceProps {
  conceptualModel: ConceptualModel;
}

export function RevisionAlcance({ conceptualModel }: RevisionAlcanceProps) {
  const entities = conceptualModel.entities || [];

  // Helper to get include label
  const getIncludeLabel = (include?: boolean | string) => {
    // Handle both boolean and string values
    if (include === false || String(include) === "false") {
      return "Excluir";
    }
    return "Incluir";
  };

  // Helper to get argument type label
  const getArgumentTypeLabel = (argumentType?: string) => {
    switch (argumentType) {
      case "SALIDA":
        return "Salida";
      case "ENTRADA":
        return "Entrada";
      case "NO VINCULADO A OBJETIVOS":
        return "No Vinculado a Objetivos";
      case "SIMPLIFICACION":
        return "Simplificación";
      default:
        return argumentType || "No especificado";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">
          Definición de Alcance del Modelo Conceptual
        </p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, entradas y salidas
          del modelo de simulación
        </p>
      </div>

      {entities.length > 0 ? (
        <div className="space-y-4">
          {entities.map((entity, index) => {
            const isIncluded =
              entity.scopeDecision?.include !== false &&
              String(entity.scopeDecision?.include) !== "false";

            return (
              <div
                key={entity._id || index}
                className={`border rounded-lg bg-gray-50 p-4 space-y-4 ${
                  !isIncluded ? "border-red-200 bg-red-50/50" : "border-gray-200"
                }`}
              >
                {/* Entity Name - Always visible */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-gray-900">
                    Entidad: <strong>{entity.name || `Entidad ${index + 1}`}</strong>
                  </p>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      isIncluded
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isIncluded ? "Incluida" : "Excluida"}
                  </span>
                </div>

                {/* Scope Decision Details - Always expanded */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Incluir
                    </label>
                    <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-white text-sm text-gray-600">
                      {getIncludeLabel(entity.scopeDecision?.include)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Justificación
                    </label>
                    <Input
                      value={entity.scopeDecision?.justification || ""}
                      readOnly
                      disabled
                      className="border-2 border-gray-200 bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tipo de argumento
                    </label>
                    <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-white text-sm text-gray-600">
                      {getArgumentTypeLabel(entity.scopeDecision?.argumentType)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p>No hay entidades definidas</p>
          <p className="text-sm mt-1">
            No se pueden definir alcances sin entidades
          </p>
        </div>
      )}
    </div>
  );
}
