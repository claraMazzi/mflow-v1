"use client";

import { MouseEvent, ChangeEvent, useEffect, useRef } from "react";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";
import cn from "clsx";

interface AlcanceProps {
  hasEditingRights: boolean;
  inputList: ReturnType<typeof useFieldArray<ConceptualModel, "inputs">>;
  outputList: ReturnType<typeof useFieldArray<ConceptualModel, "outputs">>;
  entitiesList: ReturnType<typeof useFieldArray<ConceptualModel, "entities">>;
  watch: (name?: Path<ConceptualModel>) => unknown;
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
    itemType: "input" | "output" | "entity";
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

export default function Alcance({
  hasEditingRights,
  entitiesList,
  customRegisterField,
}: AlcanceProps) {
  // const previousInputsLength = useRef(inputList.fields.length);
  // const previousOutputsLength = useRef(
  //   outputList.fields.length
  // );

  // // Focus on the last added item when the list changes
  // useEffect(() => {
  //   if (inputList.fields.length > previousInputsLength.current) {
  //     // A new item was added, focus on the last one
  //     const lastIndex = inputList.fields.length - 1;
  //     const input = document.querySelector<
  //       HTMLInputElement | HTMLTextAreaElement
  //     >(`[name="inputs.${lastIndex}.description"]`);
  //     if (input) {
  //       // Use setTimeout to ensure the DOM is updated
  //       setTimeout(() => {
  //         input.focus();
  //       }, 0);
  //     }
  //   }
  //   previousInputsLength.current = inputList.fields.length;
  // }, [inputList.fields.length]);

  // useEffect(() => {
  //   if (
  //     outputList.fields.length > previousOutputsLength.current
  //   ) {
  //     // A new item was added, focus on the last one
  //     const lastIndex = outputList.fields.length - 1;
  //     const input = document.querySelector<
  //       HTMLInputElement | HTMLTextAreaElement
  //     >(`[name="outputs.${lastIndex}.description"]`);
  //     if (input) {
  //       // Use setTimeout to ensure the DOM is updated
  //       setTimeout(() => {
  //         input.focus();
  //       }, 0);
  //     }
  //   }
  //   previousOutputsLength.current = outputList.fields.length;
  // }, [outputList.fields.length]);

  // const addItemToList = ({
  //   listPropertyPath,
  //   itemType,
  //   e,
  // }: {
  //   listPropertyPath: string;
  //   itemType: "input" | "output";
  //   e: MouseEvent;
  // }) => {
  //   switch (listPropertyPath) {
  //     case "inputs":
  //       {
  //         // Get current form values instead of using inputList.fields
  //         const currentInputs =
  //           (watch("inputs") as { description?: string }[]) || [];
  //         const firstEmptyIndex = currentInputs.findIndex(
  //           (input: { description?: string }) =>
  //             !input?.description || input.description.trim() === ""
  //         );

  //         if (firstEmptyIndex !== -1) {
  //           const input = document.querySelector<
  //             HTMLInputElement | HTMLTextAreaElement
  //           >(`[name="inputs.${firstEmptyIndex}.description"]`);
  //           if (input) {
  //             input.focus();
  //           }
  //           return;
  //         }

  //         handleAddItemToList({
  //           e: e,
  //           listPropertyPath,
  //           itemType,
  //         });
  //       }
  //       break;
  //     case "outputs":
  //       {
  //         // Get current form values instead of using outputList.fields
  //         const currentOutputs =
  //           (watch("outputs") as { description?: string }[]) || [];
  //         const firstEmptyIndex = currentOutputs.findIndex(
  //           (output: { description?: string }) =>
  //             !output?.description ||
  //             output.description.trim() === ""
  //         );

  //         if (firstEmptyIndex !== -1) {
  //           const input = document.querySelector<
  //             HTMLInputElement | HTMLTextAreaElement
  //           >(`[name="outputs.${firstEmptyIndex}.description"]`);
  //           if (input) {
  //             input.focus();
  //           }
  //           return;
  //         }

  //         handleAddItemToList({ e, listPropertyPath, itemType });
  //       }
  //       break;
  //   }
  // };

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

      {entitiesList.fields.map((entity, index) => (
        <div key={entity._id} className="flex flex-col gap-4">
          <p>
            Entidad: <strong>{entity.name}</strong>
          </p>
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
      ))}
    </div>
  );
}
