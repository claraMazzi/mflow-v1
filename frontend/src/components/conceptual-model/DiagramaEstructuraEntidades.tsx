"use client";

import { MouseEvent, ChangeEvent } from "react";
import { DiagramImageUpload } from "@components/ui/conceptual-model/diagram";
import { ImageInfo } from "#types/conceptual-model";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";

interface DiagramaEstructuraEntidadesProps {
  sessionToken?: string;
  versionId: string;
  hasEditingRights: boolean;
  imageInfos: Map<string, ImageInfo>;
  watch: (name?: string) => unknown;
  entitiesList: ReturnType<typeof useFieldArray<ConceptualModel, "entities">>;
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
  handleAddItemToList: ({
    e,
    listPropertyPath,
    itemType,
  }: {
    e: MouseEvent;
    listPropertyPath: string;
    itemType: "assumption" | "simplification" | "entity";
  }) => void;
  handleRemoveItemFromList: ({
    e,
    listPropertyPath,
    itemId,
  }: {
    e: MouseEvent;
    listPropertyPath: string;
    itemId: string;
  }) => void;
}

export default function DiagramaEstructuraEntidades({
  sessionToken,
  versionId,
  hasEditingRights,
  imageInfos,
  watch,
  entitiesList,
  customRegisterField,
  handleAddItemToList,
  handleRemoveItemFromList,
}: DiagramaEstructuraEntidadesProps) {
  return (
    <div>
      <DiagramImageUpload
        sessionToken={sessionToken}
        versionId={versionId}
        hasEditingRights={hasEditingRights}
        imageInfos={imageInfos}
        title="Diagrama de Estructura"
        watch={watch}
        namePathPrefix="structureDiagram"
        diagramPropertyPath="structureDiagram"
      />
      
      <h2>Entidades</h2>
      <button
        disabled={!hasEditingRights}
        onClick={(e) =>
          handleAddItemToList({
            e,
            listPropertyPath: "entities",
            itemType: "entity",
          })
        }
      >
        Agregar Entidad
      </button>
      <ul>
        {entitiesList.fields.map((field, index) => {
          return (
            <li key={field.id}>
              <label>{`Entity Id: ${field._id}`} - Nombre:</label>
              <input
                {...customRegisterField({
                  name: `entities.${index}.name`,
                  propertyPath: `entities:${field._id}.name`,
                })}
              />
              <button
                disabled={!hasEditingRights}
                onClick={(e) =>
                  handleRemoveItemFromList({
                    e,
                    listPropertyPath: "entities",
                    itemId: field._id,
                  })
                }
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
