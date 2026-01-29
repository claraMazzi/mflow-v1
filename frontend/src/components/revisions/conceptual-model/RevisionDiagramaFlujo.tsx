"use client";

import { ConceptualModel, ImageInfo } from "#types/conceptual-model";
import { RevisionDiagramImage } from "./RevisionDiagramImage";

interface RevisionDiagramaFlujoProps {
  conceptualModel: ConceptualModel;
  imageInfos: Map<string, ImageInfo>;
}

export function RevisionDiagramaFlujo({
  conceptualModel,
  imageInfos,
}: RevisionDiagramaFlujoProps) {
  const flowDiagram = conceptualModel.flowDiagram;

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <RevisionDiagramImage
        title="Diagrama de Flujo"
        imageInfos={imageInfos}
        imageFileId={flowDiagram?.imageFileId}
        plantTextToken={flowDiagram?.plantTextToken}
        usePlantText={flowDiagram?.usePlantText}
      />
    </div>
  );
}
