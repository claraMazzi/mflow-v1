"use client";

import { ChangeEvent, useState, useMemo } from "react";
import {
	useFieldArray,
	RegisterOptions,
	Path,
	FieldArrayWithId,
	UseFormReturn,
	useWatch,
} from "react-hook-form";
import { ConceptualModel, Entity } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { ChevronDown, ChevronRight } from "lucide-react";
import cn from "clsx";
import { CustomRegisterFieldFn } from "@src/types/collaboration";

// Extracted component to prevent infinite re-renders from inline customRegisterField calls
interface EntityScopeEditorProps {
	entity: Entity;
	index: number;
	hasEditingRights: boolean;
	customRegisterField: CustomRegisterFieldFn;
	watch: UseFormReturn<ConceptualModel>["watch"];
}

function EntityScopeEditor({
	entity,
	index,
	hasEditingRights,
	customRegisterField,
	watch,
}: EntityScopeEditorProps) {
	const argumentTypeValue = watch(
		`entities.${index}.scopeDecision.argumentType`,
	);

	return (
		<div className="p-4 pt-0 space-y-4">
			<div className="flex items-center gap-2">
				<label className="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						{...customRegisterField({
							name: `entities.${index}.scopeDecision.include` as Path<ConceptualModel>,
							propertyPath: `entities:${entity._id}.scopeDecision.include`,
							propagateUpdateOnChange: true,
						})}
						className="rounded border-gray-300"
					/>
					<span className="text-sm font-medium text-gray-700">Incluir en el alcance del modelo</span>
				</label>
			</div>

			<div className="space-y-2">
				<label className="block text-sm font-medium text-gray-700">
					Justificación
				</label>
				<Input
					{...customRegisterField({
						name: `entities.${index}.scopeDecision.justification`,
						propertyPath: `entities:${entity._id}.scopeDecision.justification`,
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
					{...customRegisterField({
						name: `entities.${index}.scopeDecision.argumentType` as Path<ConceptualModel>,
						propertyPath: `entities:${entity._id}.scopeDecision.argumentType`,
					})}
					className={cn(
						"w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none",
						!hasEditingRights ? "bg-gray-100 cursor-not-allowed" : "bg-white",
					)}
					disabled={!hasEditingRights}
					value={
						(argumentTypeValue as string) ??
						entity.scopeDecision?.argumentType ??
						"SALIDA"
					}
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
	);
}

interface AlcanceProps {
	hasEditingRights: boolean;
	customRegisterField: CustomRegisterFieldFn;
	watch: UseFormReturn<ConceptualModel>["watch"];
	control: UseFormReturn<ConceptualModel>["control"];
}

export default function Alcance({
	hasEditingRights,
	customRegisterField,
	watch,
	control,
}: AlcanceProps) {
	const watchedEntities = useWatch({ control, name: "entities" });

	const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(
		new Set(),
	);

	// Toggle collapse state for a specific entity
	const toggleCollapse = (entityId: string) => {
		setCollapsedEntities((prev) => {
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

			{watchedEntities && watchedEntities.length > 0 ? (
				watchedEntities.map((entity, index) => {
					const isCollapsed = collapsedEntities.has(entity._id);

					return (
						<div
							key={entity._id}
							className="border border-gray-200 rounded-lg bg-gray-50"
						>
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
									isCollapsed
										? "max-h-0 opacity-0"
										: "max-h-[500px] opacity-100",
								)}
							>
								<EntityScopeEditor
									entity={entity}
									index={index}
									hasEditingRights={hasEditingRights}
									customRegisterField={customRegisterField}
									watch={watch}
								/>
							</div>
						</div>
					);
				})
			) : (
				<div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<p>No hay entidades agregadas</p>
					<p className="text-sm">
						Ingrese al menos una entidad en la seccion &quot;Entidades y
						Diagramas Dinámicas&quot; para poder definir el alcance del modelo
						conceptual
					</p>
				</div>
			)}
		</div>
	);
}
