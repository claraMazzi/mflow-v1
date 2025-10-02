"use client";

import { MouseEvent, ChangeEvent } from "react";
import { useFieldArray, RegisterOptions, Path } from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";

interface ObjetivosSuposicionesProps {
  hasEditingRights: boolean;
  assumptionList: ReturnType<typeof useFieldArray<ConceptualModel, "assumptions">>;
  simplificationList: ReturnType<typeof useFieldArray<ConceptualModel, "simplifications">>;
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

export default function ObjetivosSuposiciones({
  hasEditingRights,
  assumptionList,
  simplificationList,
  customRegisterField,
  handleAddItemToList,
  handleRemoveItemFromList,
}: ObjetivosSuposicionesProps) {
  return (
    <div>
      <label>Objetivo del Modelo Conceptual: </label>
      <input {...customRegisterField({ name: "objective" })} />
      
      <h2>Suposiciones</h2>
      <button
        disabled={!hasEditingRights}
        onClick={(e) =>
          handleAddItemToList({
            e,
            listPropertyPath: "assumptions",
            itemType: "assumption",
          })
        }
      >
        Agregar Suposición
      </button>
      <ul>
        {assumptionList.fields.map((field, index) => {
          return (
            <li key={field.id}>
              <label>
                {`Assumption Id: ${field._id}`} - Description:
              </label>
              <input
                {...customRegisterField({
                  name: `assumptions.${index}.description`,
                  propertyPath: `assumptions:${field._id}.description`,
                })}
              />
              <button
                disabled={!hasEditingRights}
                onClick={(e) =>
                  handleRemoveItemFromList({
                    e,
                    listPropertyPath: "assumptions",
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
      
      <h2>Simplificaciones</h2>
      <button
        disabled={!hasEditingRights}
        onClick={(e) =>
          handleAddItemToList({
            e,
            listPropertyPath: "simplifications",
            itemType: "simplification",
          })
        }
      >
        Agregar Simplificacion
      </button>
      <ul>
        {simplificationList.fields.map((field, index) => {
          return (
            <li key={field.id}>
              <label>
                {`Simplification Id: ${field._id}`} - Description:
              </label>
              <input
                {...customRegisterField({
                  name: `simplifications.${index}.description`,
                  propertyPath: `simplifications:${field._id}.description`,
                })}
              />
              <button
                disabled={!hasEditingRights}
                onClick={(e) =>
                  handleRemoveItemFromList({
                    e,
                    listPropertyPath: "simplifications",
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
