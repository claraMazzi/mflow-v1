"use client";

import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import { RevisionDiagramImage } from "./RevisionDiagramImage";

interface RevisionDiagramaEstructuraProps {
  conceptualModel: ConceptualModel;
  imageInfos: Map<string, ImageInfo>;
}

export function RevisionDiagramaEstructura({
  conceptualModel,
  imageInfos,
}: RevisionDiagramaEstructuraProps) {
  const structureDiagram = conceptualModel.structureDiagram;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <RevisionDiagramImage
        title="Diagrama de Estructura"
        imageInfos={imageInfos}
        imageFileId={structureDiagram?.imageFileId}
        plantTextToken={structureDiagram?.plantTextToken}
        usesPlantText={structureDiagram?.usesPlantText}
      />
    </div>
  );
}
