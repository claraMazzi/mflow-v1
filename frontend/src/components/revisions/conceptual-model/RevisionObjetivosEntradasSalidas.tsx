"use client";

import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";

interface RevisionObjetivosEntradasSalidasProps {
  conceptualModel: ConceptualModel;
}

export function RevisionObjetivosEntradasSalidas({
  conceptualModel,
}: RevisionObjetivosEntradasSalidasProps) {
  const inputs = conceptualModel.inputs || [];
  const outputs = conceptualModel.outputs || [];
  const entities = conceptualModel.entities || [];

  // Helper to get entity name by ID
  const getEntityName = (entityId?: string) => {
    if (!entityId) return "Sin entidad asignada";
    const entity = entities.find((e) => e._id === entityId);
    return entity?.name || `Entidad ${entityId.slice(-4)}`;
  };

  // Helper to get input type label
  const getInputTypeLabel = (type?: string) => {
    switch (type) {
      case "PARAMETRO":
        return "Parámetro";
      case "FACTOR EXPERIMENTAL":
        return "Factor Experimental";
      default:
        return type || "No especificado";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">
          Objetivos, Entradas y Salidas del Sistema
        </p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, entradas y salidas
          del modelo de simulación
        </p>
      </div>

      {/* Objective Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Objetivo del Modelo Conceptual
        </label>
        <Input
          value={conceptualModel.objective || ""}
          readOnly
          disabled
          className="border-2 border-gray-200 bg-gray-50"
        />
      </div>

      {/* Inputs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Entradas</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {inputs.length} entrada{inputs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {inputs.length > 0 ? (
          <div className="space-y-3">
            {inputs.map((input, index) => (
              <div
                key={input._id || index}
                className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="space-y-2 flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {index + 1}. Descripción de la entrada
                  </label>
                  <Input
                    value={input.description || ""}
                    readOnly
                    disabled
                    className="border-2 border-gray-200 bg-white"
                  />
                </div>
                <div className="w-48 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de entrada
                  </label>
                  <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-white text-sm text-gray-600">
                    {getInputTypeLabel(input.type)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm">No hay entradas definidas</p>
          </div>
        )}
      </div>

      {/* Outputs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Salidas</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {outputs.length} salida{outputs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {outputs.length > 0 ? (
          <div className="space-y-3">
            {outputs.map((output, index) => (
              <div
                key={output._id || index}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center gap-3 col-span-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {index + 1}. Descripción de la salida
                    </label>
                    <Input
                      value={output.description || ""}
                      readOnly
                      disabled
                      className="border-2 border-gray-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entidad
                  </label>
                  <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-white text-sm text-gray-600">
                    {getEntityName(output.entity)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm">No hay salidas definidas</p>
          </div>
        )}
      </div>
    </div>
  );
}
