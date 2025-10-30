"use client";

import { ChangeEvent, useState } from "react";
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
}

export default function Detalle({
  hasEditingRights,
  entitiesList,
  control,
  customRegisterField,
}: DetalleProps) {
  function EntityPropertiesEditor({ entityIndex }: { entityIndex: number }) {
    const propertiesList = useFieldArray({
      // TS cast because react-hook-form lacks template literal support for nested paths here
      name: (`entities.${entityIndex}.properties` as unknown) as never,
      control,
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-medium text-gray-900">Propiedades</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={() =>
              propertiesList.append({
                nombre: "",
                detailLevelDecision: {
                  include: true,
                  justification: "",
                  argumentType: "CALCULO SALIDA",
                },
              } as unknown as never)
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
                    onClick={() => propertiesList.remove(propIndex)}
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
