"use client";

import { ChangeEvent, useState } from "react";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { ChevronDown, ChevronRight } from "lucide-react";
import cn from "clsx";

interface AlcanceProps {
  hasEditingRights: boolean;
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
    onBlur: (
      e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    readOnly: boolean;
    name: Path<ConceptualModel>;
    ref: (instance: HTMLInputElement | HTMLTextAreaElement | null) => void;
  };
}

export default function Alcance({
  hasEditingRights,
  entitiesList,
  customRegisterField,
}: AlcanceProps) {
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
        <p className="text-lg font-bold text-center">
          Definición de Alcance del Modelo Conceptual
        </p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, entradas y salidas
          del modelo de simulación
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
                {/* make a select box for the scope decision of each entity, iclude should be a select box, justification should be an imput and type of argument should be a select box with predefined values in the version.model schema, the select box should be disabled if the user does not have editing rights, matchin the same style as the other conceptual-model components  */}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Incluir
                  </label>
                  <select
                    name={`entities.${index}.scopeDecision.include`}
                    className={cn(
                      "w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none"
                    )}
                    disabled={!hasEditingRights}
                  >
                    <option value="true">Incluir</option>
                    <option value="false">Excluir</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Justificación
                  </label>
                  <Input
                    {...customRegisterField({
                      name: `entities.${index}.scopeDecision.justification`,
                    })}
                    placeholder="Describe la justificación..."
                    className="border-2 border-gray-200 focus:border-purple-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tipo de argumento
                  </label>
                  <select
                    name={`entities.${index}.scopeDecision.argumentType`}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none"
                    disabled={!hasEditingRights}
                  >
                    <option value="SALIDA">Salida</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="NO VINCULADO A OBJETIVOS">
                      No Vinculado a Objetivos
                    </option>
                    <option value="SIMPLIFICACION">Simplificación</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
