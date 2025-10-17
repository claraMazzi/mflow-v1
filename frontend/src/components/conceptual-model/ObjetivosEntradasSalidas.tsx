"use client";

import { MouseEvent, ChangeEvent, useEffect, useRef } from "react";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";

interface DescripcionDelSistemaProps {
  hasEditingRights: boolean;
  assumptionList: ReturnType<
    typeof useFieldArray<ConceptualModel, "assumptions">
  >;
  simplificationList: ReturnType<
    typeof useFieldArray<ConceptualModel, "simplifications">
  >;
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

export default function DescripcionDelSistema({
  hasEditingRights,
  assumptionList,
  simplificationList,
  watch,
  customRegisterField,
  handleAddItemToList,
  handleRemoveItemFromList,
}: DescripcionDelSistemaProps) {
  const previousAssumptionsLength = useRef(assumptionList.fields.length);
  const previousSimplificationsLength = useRef(
    simplificationList.fields.length
  );

  // Focus on the last added item when the list changes
  useEffect(() => {
    if (assumptionList.fields.length > previousAssumptionsLength.current) {
      // A new item was added, focus on the last one
      const lastIndex = assumptionList.fields.length - 1;
      const input = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`[name="assumptions.${lastIndex}.description"]`);
      if (input) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
    previousAssumptionsLength.current = assumptionList.fields.length;
  }, [assumptionList.fields.length]);

  useEffect(() => {
    if (
      simplificationList.fields.length > previousSimplificationsLength.current
    ) {
      // A new item was added, focus on the last one
      const lastIndex = simplificationList.fields.length - 1;
      const input = document.querySelector<
        HTMLInputElement | HTMLTextAreaElement
      >(`[name="simplifications.${lastIndex}.description"]`);
      if (input) {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
    previousSimplificationsLength.current = simplificationList.fields.length;
  }, [simplificationList.fields.length]);

  const addItemToList = ({
    listPropertyPath,
    itemType,
    e,
  }: {
    listPropertyPath: string;
    itemType: "assumption" | "simplification";
    e: MouseEvent;
  }) => {
    switch (listPropertyPath) {
      case "assumptions":
        {
          // Get current form values instead of using assumptionList.fields
          const currentAssumptions =
            (watch("assumptions") as { description?: string }[]) || [];
          const firstEmptyIndex = currentAssumptions.findIndex(
            (assumption: { description?: string }) =>
              !assumption?.description || assumption.description.trim() === ""
          );

          if (firstEmptyIndex !== -1) {
            const input = document.querySelector<
              HTMLInputElement | HTMLTextAreaElement
            >(`[name="assumptions.${firstEmptyIndex}.description"]`);
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
      case "simplifications":
        {
          // Get current form values instead of using assumptionList.fields
          const currentSimplifications =
            (watch("simplifications") as { description?: string }[]) || [];
          console.log("currentSimplifications", currentSimplifications);
          const firstEmptyIndex = currentSimplifications.findIndex(
            (simplification: { description?: string }) =>
              !simplification?.description ||
              simplification.description.trim() === ""
          );

          if (firstEmptyIndex !== -1) {
            const input = document.querySelector<
              HTMLInputElement | HTMLTextAreaElement
            >(`[name="simplifications.${firstEmptyIndex}.description"]`);
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
        <p className="text-lg font-bold text-center">Descripción inicial del sistema</p>
        <p className="text-sm text-gray-500">
          Es necesaria para poder establecer los objetivos, suposiciones y
          simplificaciones del modelo de simulación
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

      {/* Assumptions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Suposiciones</h2>
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
                listPropertyPath: "assumptions",
                itemType: "assumption",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Suposición
          </Button>
        </div>

        {assumptionList.fields.length > 0 ? (
          <div className="space-y-3">
            {assumptionList.fields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <Input
                      {...customRegisterField({
                        name: `assumptions.${index}.description`,
                        propertyPath: `assumptions:${field._id}.description`,
                      })}
                      placeholder="Describe la suposición..."
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
                        listPropertyPath: "assumptions",
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
            <p>No hay suposiciones agregadas</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar Suposición&quot; para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Simplifications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Simplificaciones
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasEditingRights}
            onClick={(e) =>
              addItemToList({
                e,
                listPropertyPath: "simplifications",
                itemType: "simplification",
              })
            }
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Simplificación
          </Button>
        </div>

        {simplificationList.fields.length > 0 ? (
          <div className="space-y-3">
            {simplificationList.fields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <Input
                      {...customRegisterField({
                        name: `simplifications.${index}.description`,
                        propertyPath: `simplifications:${field._id}.description`,
                      })}
                      placeholder="Describe la simplificación..."
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
                        listPropertyPath: "simplifications",
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
            <p>No hay simplificaciones agregadas</p>
            <p className="text-sm">
              Haz clic en &quot;Agregar Simplificación&quot; para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
