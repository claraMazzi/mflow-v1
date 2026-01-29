"use client";

import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Textarea } from "@components/ui/common/textarea";

interface RevisionDescripcionDelSistemaProps {
  conceptualModel: ConceptualModel;
}

export function RevisionDescripcionDelSistema({
  conceptualModel,
}: RevisionDescripcionDelSistemaProps) {
  const assumptions = conceptualModel.assumptions || [];
  const simplifications = conceptualModel.simplifications || [];

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">
          Descripción inicial del sistema
        </p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, suposiciones y
          simplificaciones del modelo de simulación
        </p>
      </div>

      {/* Nombre del Sistema en Estudio Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Nombre del Sistema en Estudio
        </label>
        <Input
          value={conceptualModel.name || ""}
          readOnly
          disabled
          className="border-2 border-gray-200 bg-gray-50"
        />
      </div>

      {/* Descripcion del Sistema Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Descripcion del Sistema
        </label>
        <Textarea
          value={conceptualModel.description || ""}
          readOnly
          disabled
          className="border-2 border-gray-200 bg-gray-50 min-h-[100px]"
        />
      </div>

      {/* Assumptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Suposiciones</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {assumptions.length} suposición{assumptions.length !== 1 ? "es" : ""}
          </span>
        </div>

        {assumptions.length > 0 ? (
          <div className="space-y-3">
            {assumptions.map((assumption, index) => (
              <div
                key={assumption._id || index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-gray-200 rounded-full">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Input
                    value={assumption.description || ""}
                    readOnly
                    disabled
                    className="border-2 border-gray-200 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm">No hay suposiciones definidas</p>
          </div>
        )}
      </div>

      {/* Simplifications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Simplificaciones</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {simplifications.length} simplificación{simplifications.length !== 1 ? "es" : ""}
          </span>
        </div>

        {simplifications.length > 0 ? (
          <div className="space-y-3">
            {simplifications.map((simplification, index) => (
              <div
                key={simplification._id || index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <span className="flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-500 bg-gray-200 rounded-full">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Input
                    value={simplification.description || ""}
                    readOnly
                    disabled
                    className="border-2 border-gray-200 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm">No hay simplificaciones definidas</p>
          </div>
        )}
      </div>
    </div>
  );
}
