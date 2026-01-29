"use client";

import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { useMemo } from "react";

interface RevisionDetalleProps {
  conceptualModel: ConceptualModel;
}

export function RevisionDetalle({ conceptualModel }: RevisionDetalleProps) {
  const entities = conceptualModel.entities || [];

  // Compute included/excluded entities
  const { includedEntities, excludedEntities } = useMemo(() => {
    const included: typeof entities = [];
    const excluded: typeof entities = [];

    entities.forEach((entity) => {
      const includeValue = entity.scopeDecision?.include;
      const isIncluded =
        includeValue !== false && String(includeValue) !== "false";
      if (isIncluded) {
        included.push(entity);
      } else {
        excluded.push(entity);
      }
    });

    return { includedEntities: included, excludedEntities: excluded };
  }, [entities]);

  // Helper to get include label
  const getIncludeLabel = (include?: boolean | string) => {
    if (include === false || String(include) === "false") {
      return "Excluir";
    }
    return "Incluir";
  };

  // Helper to get argument type label
  const getArgumentTypeLabel = (argumentType?: string) => {
    switch (argumentType) {
      case "CALCULO SALIDA":
        return "Cálculo de salida";
      case "DATO DE ENTRADA":
        return "Dato de entrada";
      case "SIMPLIFICACION":
        return "Simplificación";
      default:
        return argumentType || "No especificado";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-sm">
      <div className="space-y-2">
        <p className="text-lg font-bold text-center">
          Detalle de Propiedades de Entidades
        </p>
        <p className="text-sm text-gray-500">
          Gestiona las propiedades de cada una de las entidades{" "}
          <strong>incluídas</strong> en el alcance del modelo de simulación
        </p>
      </div>

      {includedEntities.length > 0 ? (
        <div className="space-y-6">
          {includedEntities.map((entity, entityIndex) => {
            const properties = entity.properties || [];

            return (
              <div
                key={entity._id || entityIndex}
                className="border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-4"
              >
                {/* Entity Name - Always visible */}
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-gray-900">
                    Entidad: <strong>{entity.name || `Entidad ${entityIndex + 1}`}</strong>
                  </p>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {properties.length} propiedad{properties.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Properties - Always expanded */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-900">
                    Propiedades
                  </h3>

                  {properties.length > 0 ? (
                    <div className="space-y-3">
                      {properties.map((property, propIndex) => (
                        <div
                          key={property._id || propIndex}
                          className="flex flex-col gap-3 p-3 bg-white rounded-lg border"
                        >
                          

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {propIndex + 1}. Nombre de la propiedad
                            </label>
                            <Input
                              value={property.name || ""}
                              readOnly
                              disabled
                              className="border-2 border-gray-200 bg-gray-50"
                            />
                          </div>
                          
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Incluir
                              </label>
                              <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-gray-50 text-sm text-gray-600">
                                {getIncludeLabel(
                                  property.detailLevelDecision?.include
                                )}
                              </div>
                            </div>


                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Tipo de argumento
                              </label>
                              <div className="px-3 py-2 border-2 border-gray-200 rounded-md bg-gray-50 text-sm text-gray-600">
                                {getArgumentTypeLabel(
                                  property.detailLevelDecision?.argumentType
                                )}
                              </div>
                            </div>
                          </div>


                          <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Justificación
                              </label>
                              <Input
                                value={
                                  property.detailLevelDecision?.justification || ""
                                }
                                readOnly
                                disabled
                                className="border-2 border-gray-200 bg-gray-50"
                              />
                            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm">
                        No hay propiedades definidas para esta entidad
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p>No hay entidades incluidas para gestionar propiedades</p>
          <p className="text-sm mt-1">
            Todas las entidades han sido excluidas del alcance
          </p>
        </div>
      )}

      {/* Excluded entities notice */}
      {excludedEntities.length > 0 && (
        <div className="p-4 text-red-800 bg-red-50 rounded-lg border border-red-200">
          <p className="font-medium">
            Las siguientes entidades <strong>no fueron incluidas</strong> en el
            alcance del modelo de simulación:
          </p>
          <ul className="list-disc list-inside ml-2 mt-2">
            {excludedEntities.map((entity, index) => (
              <li key={entity._id || index}>{entity.name || `Entidad ${index + 1}`}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
