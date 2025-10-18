"use client";

import { MouseEvent, ChangeEvent } from "react";
import { DiagramImageUpload } from "@components/ui/conceptual-model/diagram";
import { ImageInfo } from "#types/conceptual-model";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";

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
  socket?: any;
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
  socket
}: DiagramaEstructuraEntidadesProps) {

  const addItemToList = ({
    listPropertyPath,
    itemType,
    e,
  }: {
    listPropertyPath: string;
    itemType: "entity";
    e: MouseEvent;
  }) => {

          // Get current form values instead of using assumptionList.fields
          const currentEntities =
            (watch("entities") as { name?: string }[]) || [];
          const firstEmptyIndex = currentEntities.findIndex(
            (entity: { name?: string }) =>
              !entity?.name || entity.name.trim() === ""
          );

          if (firstEmptyIndex !== -1) {
            const input = document.querySelector<
              HTMLInputElement | HTMLTextAreaElement
            >(`[name="entities.${firstEmptyIndex}.name"]`);
            if (input) {
              input.focus();
            }
            return;
          }

          handleAddItemToList({
            e: e,
            listPropertyPath,
            itemType,
          });
      

  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
        
      {/* Entities Section */}
      <div className="space-y-4">
        {/* <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Entidades</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              handleAddItemToList({
                e,
                listPropertyPath: "entities",
                itemType: "entity",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Entidad
          </Button>
        </div>
         */}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Entidades</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              //   handleAddItemToList({
              //     e,
              //     listPropertyPath: "assumptions",
              //     itemType: "assumption",
              //   })
              addItemToList({
                e,
                listPropertyPath: "entities",
                itemType: "entity",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Entidad
          </Button>
        </div>

        {entitiesList.fields.length > 0 ? (
          <div className="space-y-3">
            {entitiesList.fields.map((field, index) => {
              return (
                <div key={field.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <Input
                      {...customRegisterField({
                        name: `entities.${index}.name`,
                        propertyPath: `entities:${field._id}.name`,
                      })}
                      placeholder="Nombre de la entidad..."
                      className="border-2 border-gray-200 focus:border-purple-400"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!hasEditingRights}
                    onClick={(e) =>
                      handleRemoveItemFromList({
                        e,
                        listPropertyPath: "entities",
                        itemId: field._id,
                      })
                    }
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p>No hay entidades agregadas</p>
            <p className="text-sm">Haz clic en &quot;Agregar Entidad&quot; para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
