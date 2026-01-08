"use client";

import { ChangeEvent } from "react";
import { DiagramImageUpload } from "@components/ui/conceptual-model/diagram";
import { ImageInfo } from "#types/conceptual-model";
import { ConceptualModel } from "#types/conceptual-model";
import { Path, RegisterOptions, Control } from "react-hook-form";

interface DiagramaFlujoProps {
  sessionToken?: string;
  versionId: string;
  hasEditingRights: boolean;
  imageInfos: Map<string, ImageInfo>;
  watch: (name?: string) => unknown;
  control: Control<ConceptualModel>;
  customRegisterField: ({
    name,
    propertyPath,
    options,
    propagateUpdateOnChange,
  }: {
    name: Path<ConceptualModel>;
    propertyPath?: string;
    options?: RegisterOptions<ConceptualModel, Path<ConceptualModel>>;
    propagateUpdateOnChange?: boolean;
  }) => {
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    readOnly: boolean;
    name: Path<ConceptualModel>;
    ref: (instance: HTMLInputElement | HTMLTextAreaElement | null) => void;
  };
  register?: (config: {
		name: Path<ConceptualModel>;
		propertyPath?: string;
		propagateUpdateOnChange?: boolean;
	}) => Record<string, unknown>;
}

export default function DiagramaFlujo({
  sessionToken,
  versionId,
  hasEditingRights,
  imageInfos,
  watch,
  control,
  customRegisterField
  }: DiagramaFlujoProps) {
  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      {/* Diagram Upload Section */}
      <div className="space-y-4">
        <DiagramImageUpload
          sessionToken={sessionToken}
          versionId={versionId}
          hasEditingRights={hasEditingRights}
          imageInfos={imageInfos}
          title="Diagrama de Flujo"
          watch={watch}
          control={control}
          namePathPrefix="flowDiagram"
          diagramPropertyPath="flowDiagram"
          register={customRegisterField}
        />
      </div>

    </div>
  );
}
