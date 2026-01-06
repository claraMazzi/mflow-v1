"use client";

import { MouseEvent, ChangeEvent, useEffect, useRef, useMemo } from "react";
import { useFieldArray, RegisterOptions, Path, FieldArrayWithId } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";

// Type for the customRegisterField function - includes HTMLSelectElement for proper select handling
type CustomRegisterFieldFn = ({
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
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readOnly: boolean;
  name: Path<ConceptualModel>;
  ref: (instance: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => void;
};

// Extracted OutputItem component to properly handle select registration
interface OutputItemProps {
  field: FieldArrayWithId<ConceptualModel, "outputs", "id">;
  index: number;
  hasEditingRights: boolean;
  customRegisterField: CustomRegisterFieldFn;
  entitiesList: ReturnType<typeof useFieldArray<ConceptualModel, "entities">>;
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

function OutputItem({
  field,
  index,
  hasEditingRights,
  customRegisterField,
  entitiesList,
  handleRemoveItemFromList,
}: OutputItemProps) {
  // Register the entity select field once at component level
  // The customRegisterField now properly handles select elements with immediate propagation
  const entityFieldRegistration = useMemo(
    () => customRegisterField({
      name: `outputs.${index}.entity` as Path<ConceptualModel>,
      propertyPath: `outputs:${field._id}.entity`,
    }),
    [customRegisterField, index, field._id]
  );

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción de la salida
          </label>
          <Input
            {...customRegisterField({
              name: `outputs.${index}.description`,
              propertyPath: `outputs:${field._id}.description`,
            })}
            placeholder="Describe la salida..."
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
              listPropertyPath: "outputs",
              itemId: field._id,
            })
          }
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X size={16} />
        </Button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Entidad
        </label>
        <select
          {...entityFieldRegistration}
          className={`w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none ${
            !hasEditingRights ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          disabled={!hasEditingRights}
        >
          {entitiesList.fields.map((entity) => (
            <option key={entity._id} value={entity._id}>
              {entity.name || `Entidad ${entity._id.slice(-4)}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Extracted InputItem component to properly handle select registration
interface InputItemProps {
  field: FieldArrayWithId<ConceptualModel, "inputs", "id">;
  index: number;
  hasEditingRights: boolean;
  customRegisterField: CustomRegisterFieldFn;
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

function InputItem({
  field,
  index,
  hasEditingRights,
  customRegisterField,
  handleRemoveItemFromList,
}: InputItemProps) {
  // Register the type select field once at component level
  const typeFieldRegistration = useMemo(
    () => customRegisterField({
      name: `inputs.${index}.type` as Path<ConceptualModel>,
      propertyPath: `inputs:${field._id}.type`,
    }),
    [customRegisterField, index, field._id]
  );

  return (
    <div className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg border">
      <div className="space-y-2 flex-1">
        <label className="block text-sm font-medium text-gray-700">
          {index + 1}. Descripción de la entrada
        </label>
        <Input
          {...customRegisterField({
            name: `inputs.${index}.description`,
            propertyPath: `inputs:${field._id}.description`,
          })}
          placeholder="Describe la entrada..."
          className="border-2 border-gray-200 focus:border-purple-400"
        />
      </div>
      <div className="w-48 space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tipo de entrada
        </label>
        <select
          {...typeFieldRegistration}
          className={`w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none ${
            !hasEditingRights ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          disabled={!hasEditingRights}
        >
          <option value="PARAMETRO">Parámetro</option>
          <option value="FACTOR EXPERIMENTAL">Factor Experimental</option>
        </select>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={!hasEditingRights}
        onClick={(e) =>
          handleRemoveItemFromList({
            e,
            listPropertyPath: "inputs",
            itemId: field._id,
          })
        }
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        <X size={16} />
      </Button>
    </div>
  );
}

interface ObjetivosEntradasSalidasProps {
  hasEditingRights: boolean;
  inputList: ReturnType<typeof useFieldArray<ConceptualModel, "inputs">>;
  outputList: ReturnType<typeof useFieldArray<ConceptualModel, "outputs">>;
  entitiesList: ReturnType<typeof useFieldArray<ConceptualModel, "entities">>;
  watch: (name?: Path<ConceptualModel>) => unknown;
  customRegisterField: CustomRegisterFieldFn;
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

export default function ObjetivosEntradasSalidas({
  hasEditingRights,
  inputList,
  outputList,
  entitiesList,
  watch,
  customRegisterField,
  handleAddItemToList,
  handleRemoveItemFromList,
}: ObjetivosEntradasSalidasProps) {
  const previousInputsLength = useRef(inputList.fields.length);
  const previousOutputsLength = useRef(
    outputList.fields.length
  );

  // Focus on the last added item when the list changes
  useEffect(() => {
    if (inputList.fields.length > previousInputsLength.current) {
      // A new item was added, focus on the last one
      const lastIndex = inputList.fields.length - 1;
      const input = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`[name="inputs.${lastIndex}.description"]`);
      if (input) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
    previousInputsLength.current = inputList.fields.length;
  }, [inputList.fields.length]);

  useEffect(() => {
    if (
      outputList.fields.length > previousOutputsLength.current
    ) {
      // A new item was added, focus on the last one
      const lastIndex = outputList.fields.length - 1;
      const input = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`[name="outputs.${lastIndex}.description"]`);
      if (input) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
    previousOutputsLength.current = outputList.fields.length;
  }, [outputList.fields.length]);


  const addItemToList = ({
    listPropertyPath,
    itemType,
    e,
  }: {
    listPropertyPath: string;
    itemType: "input" | "output";
    e: MouseEvent;
  }) => {
    switch (listPropertyPath) {
      case "inputs":
        {
          // Get current form values instead of using inputList.fields
          const currentInputs =
            (watch("inputs") as { description?: string }[]) || [];
          const firstEmptyIndex = currentInputs.findIndex(
            (input: { description?: string }) =>
              !input?.description || input.description.trim() === ""
          );

          if (firstEmptyIndex !== -1) {
            const input = document.querySelector<
              HTMLInputElement | HTMLTextAreaElement
            >(`[name="inputs.${firstEmptyIndex}.description"]`);
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
        }
        break;
      case "outputs":
        {
          // Get current form values instead of using outputList.fields
          const currentOutputs =
            (watch("outputs") as { description?: string }[]) || [];
          const firstEmptyIndex = currentOutputs.findIndex(
            (output: { description?: string }) =>
              !output?.description ||
              output.description.trim() === ""
          );

          if (firstEmptyIndex !== -1) {
            const input = document.querySelector<
              HTMLInputElement | HTMLTextAreaElement
            >(`[name="outputs.${firstEmptyIndex}.description"]`);
            if (input) {
              input.focus();
            }
            return;
          }

          handleAddItemToList({ e, listPropertyPath, itemType });
        }
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">Objetivos, Entradas y Salidas del Sistema</p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, entradas y
          salidas del modelo de simulación
        </p>
      </div>

      {/* Objective Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Objetivo del Modelo Conceptual
        </label>
        <Input
          {...customRegisterField({ name: "objective" })}
          placeholder="Describe el objetivo del modelo conceptual..."
          className="border-2 border-gray-200 focus:border-purple-400"
        />
      </div>

      {/* Inputs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Entradas</h2>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              addItemToList({
                e,
                listPropertyPath: "inputs",
                itemType: "input",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Entrada
          </Button>
        </div>

        {inputList.fields.length > 0 ? (
          <div className="space-y-3">
            {inputList.fields.map((field, index) => {
              return (
                <InputItem
                  key={field.id}
                  field={field}
                  index={index}
                  hasEditingRights={hasEditingRights}
                  customRegisterField={customRegisterField}
                  handleRemoveItemFromList={handleRemoveItemFromList}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p>No hay entradas agregadas</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar Entrada&quot; para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Outputs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Salidas
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              addItemToList({
                e,
                listPropertyPath: "outputs",
                itemType: "output",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Salida
          </Button>
        </div>

        {outputList.fields.length > 0 ? (
          <div className="space-y-3">
            {outputList.fields.map((field, index) => (
              <OutputItem
                key={field.id}
                field={field}
                index={index}
                hasEditingRights={hasEditingRights}
                customRegisterField={customRegisterField}
                entitiesList={entitiesList}
                handleRemoveItemFromList={handleRemoveItemFromList}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p>No hay salidas agregadas</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar Salida&quot; para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
