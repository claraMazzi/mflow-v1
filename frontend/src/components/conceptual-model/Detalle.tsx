"use client";

import { ChangeEvent, MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useFieldArray, RegisterOptions, Path, Control } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import cn from "clsx";

interface DetalleProps {
  hasEditingRights: boolean;
  entitiesList: ReturnType<typeof useFieldArray<ConceptualModel, "entities">>;
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
    onBlur: (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
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
    itemType: "property";
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
  watch: (name?: Path<ConceptualModel>) => unknown;
}

export default function Detalle({
  hasEditingRights,
  entitiesList,
  control,
  customRegisterField,
  handleAddItemToList,
  handleRemoveItemFromList,
}: DetalleProps) {

  function EntityPropertiesEditor({ entityIndex }: { entityIndex: number }) {
    const propertiesList:  ReturnType<
    typeof useFieldArray<ConceptualModel, `entities.${number}.properties`>
  > = useFieldArray({
      // TS cast because react-hook-form lacks template literal support for nested paths here
      name: (`entities.${entityIndex}.properties` as const),
      control,
    });
  const previousPropertiesLength = useRef(propertiesList.fields.length);
  console.log("Properties List: ", propertiesList);


      // Focus on the last added item when the list changes
  useEffect(() => {
    if (propertiesList.fields.length > previousPropertiesLength.current) {
      // A new item was added, focus on the last one
      const lastIndex = propertiesList.fields.length - 1;
      const input = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`[name="entities.${entityIndex}.properties.${lastIndex}.name"]`);
      if (input) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }   
    previousPropertiesLength.current = propertiesList.fields.length;
  }, [propertiesList.fields.length, entityIndex]);

    const addItemToList = useCallback(({
      listPropertyPath,
      itemType,
      e,
    }: {
      listPropertyPath: string;
      itemType: "property";
      e: MouseEvent;
    }) => {
      handleAddItemToList({
        e: e,
        listPropertyPath,
        itemType,
      });
    }, [handleAddItemToList, entityIndex]);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900">Propiedades</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              addItemToList({
                e: e,
                listPropertyPath: `entities.${entityIndex}.properties`,
                itemType: "property",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Propiedad
          </Button>
        </div>

        {propertiesList.fields.length > 0 ? (
          <div className="space-y-3">
            {propertiesList.fields.map((field, propIndex) => (
              <div
                key={field.id}
                className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nombre de la propiedad</label>
                    <Input
                      {...customRegisterField({
                        name: (`entities.${entityIndex}.properties.${propIndex}.name` as unknown) as Path<ConceptualModel>,
                      })}
                      placeholder="Nombre..."
                      className="border-2 border-gray-200 focus:border-purple-400"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!hasEditingRights}
                    onClick={(e) => handleRemoveItemFromList({
                      e: e,
                      listPropertyPath: `entities.${entityIndex}.properties`,
                      itemId: field._id,
                    })}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X size={16} />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Incluir</label>
                    <select
                      name={`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.include`}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none"
                      disabled={!hasEditingRights}
                      onChange={(e) => {
                        const { onChange } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.include` as unknown) as Path<ConceptualModel>,
                        });
                        onChange(e as unknown as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
                      }}
                      onBlur={(e) => {
                        const { onBlur } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.include` as unknown) as Path<ConceptualModel>,
                        });
                        onBlur(e as unknown as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
                      }}
                      ref={(el) => {
                        const { ref } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.include` as unknown) as Path<ConceptualModel>,
                        });
                        ref(el as HTMLInputElement | HTMLTextAreaElement | null);
                      }}
                    >
                      <option value="true">Incluir</option>
                      <option value="false">Excluir</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Justificación</label>
                    <Input
                      {...customRegisterField({
                        name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.justification` as unknown) as Path<ConceptualModel>,
                      })}
                      placeholder="Describe la justificación..."
                      className="border-2 border-gray-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Tipo de argumento</label>
                    <select
                      name={`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.argumentType`}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none"
                      disabled={!hasEditingRights}
                      onChange={(e) => {
                        const { onChange } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.argumentType` as unknown) as Path<ConceptualModel>,
                        });
                        onChange(e as unknown as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>);
                      }}
                      onBlur={(e) => {
                        const { onBlur } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.argumentType` as unknown) as Path<ConceptualModel>,
                        });
                        onBlur(e as unknown as React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>);
                      }}
                      ref={(el) => {
                        const { ref } = customRegisterField({
                          name: (`entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.argumentType` as unknown) as Path<ConceptualModel>,
                        });
                        ref(el as HTMLInputElement | HTMLTextAreaElement | null);
                      }}
                    >
                      <option value="CALCULO SALIDA">Cálculo de salida</option>
                      <option value="DATO DE ENTRADA">Dato de entrada</option>
                      <option value="SIMPLIFICACION">Simplificación</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p>No hay propiedades agregadas</p>
            <p className="text-sm">Haz clic en &quot;Agregar Propiedad&quot; para comenzar</p>
          </div>
        )}
      </div>
    );
  }

  // State to track which entities are collapsed
  const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(new Set());

  // Toggle collapse state for a specific entity
  const toggleCollapse = (entityId: string) => {
    setCollapsedEntities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">Detalle de Propiedades de Entidades</p>
        <p className="text-sm text-gray-500">
          Gestiona las propiedades de cada entidad del modelo de simulación
        </p>
      </div>

      {entitiesList.fields.map((entity, index) => {
        const isCollapsed = collapsedEntities.has(entity._id);
        
        return (
          <div key={entity._id} className="border border-gray-200 rounded-lg bg-gray-50">
            {/* Collapsible Header */}
            <button
              onClick={() => toggleCollapse(entity._id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors duration-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
                <p className="text-lg font-medium text-gray-900">
                  Entidad: <strong>{entity.name}</strong>
                </p>
              </div>
            </button>

            {/* Collapsible Content */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
              )}
            >
              <div className="p-4 pt-0 space-y-4">
                <EntityPropertiesEditor entityIndex={index} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
