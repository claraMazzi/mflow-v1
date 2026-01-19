"use client";

import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { RevisionDiagramImage } from "./RevisionDiagramImage";

interface RevisionDiagramaDinamicaEntidadesProps {
  conceptualModel: ConceptualModel;
  imageInfos: Map<string, ImageInfo>;
}

export function RevisionDiagramaDinamicaEntidades({
  conceptualModel,
  imageInfos,
}: RevisionDiagramaDinamicaEntidadesProps) {
  const entities = conceptualModel.entities || [];

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Entidades</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {entities.length} entidad{entities.length !== 1 ? "es" : ""}
        </span>
      </div>

      {entities.length > 0 ? (
        <div className="space-y-6">
          {entities.map((entity, index) => (
            <div
              key={entity._id || index}
              className="bg-gray-50 rounded-lg border p-4 space-y-4"
            >
              {/* Entity Name - Always expanded */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {index + 1}. Nombre de la entidad
                </label>
                <Input
                  value={entity.name || ""}
                  readOnly
                  disabled
                  className="border-2 border-gray-200 bg-white"
                />
              </div>

              {/* Dynamic Diagram - Always expanded */}
              <div className="pl-4 border-l-2 border-purple-200">
                <RevisionDiagramImage
                  title={`Diagrama de Dinámica - ${entity.name || `Entidad ${index + 1}`}`}
                  imageInfos={imageInfos}
                  imageFileId={entity.dynamicDiagram?.imageFileId}
                  plantTextToken={entity.dynamicDiagram?.plantTextToken}
                  usePlantText={entity.dynamicDiagram?.usePlantText}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p>No hay entidades definidas</p>
        </div>
      )}
    </div>
  );
}
