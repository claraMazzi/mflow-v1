"use client";

import {
	ChangeEvent,
	MouseEvent,
	useEffect,
	useRef,
	useState,
	useMemo,
} from "react";
import {
	useFieldArray,
	RegisterOptions,
	Path,
	Control,
	FieldArrayWithId,
	UseFormReturn,
	useWatch,
} from "react-hook-form";
import { ConceptualModel } from "#types/conceptual-model";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { X, Plus } from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import cn from "clsx";
import { CustomRegisterFieldFn } from "@src/types/collaboration";

// Type for handleRemoveItemFromList function
type HandleRemoveItemFromListFn = ({
	e,
	listPropertyPath,
	itemId,
}: {
	e: MouseEvent;
	listPropertyPath: string;
	itemId: string;
}) => void;

// Type for handleAddItemToList function
type HandleAddItemToListFn = ({
	e,
	listPropertyPath,
	itemType,
}: {
	e: MouseEvent;
	listPropertyPath: string;
	itemType: "property";
}) => void;

// Extracted component to prevent infinite re-renders from inline customRegisterField calls
interface PropertyEditorProps {
	field: FieldArrayWithId<
		ConceptualModel,
		`entities.${number}.properties`,
		"id"
	>;
	propIndex: number;
	entityIndex: number;
	entityId: string;
	control: Control<ConceptualModel>;
	isCollapsed: boolean;
	onToggleCollapse: () => void;
	hasEditingRights: boolean;
	customRegisterField: CustomRegisterFieldFn;
	handleRemoveItemFromList: HandleRemoveItemFromListFn;
}

function PropertyEditor({
	field,
	propIndex,
	entityIndex,
	entityId,
	control,
	isCollapsed,
	onToggleCollapse,
	hasEditingRights,
	customRegisterField,
	handleRemoveItemFromList,
}: PropertyEditorProps) {
	const propertyName = useWatch({
		control,
		name: `entities.${entityIndex}.properties.${propIndex}.name` as Path<ConceptualModel>,
	});

	const displayName =
		typeof propertyName === "string" && propertyName.trim()
			? propertyName.trim()
			: "Propiedad sin nombre";

	return (
		<div className="flex flex-col bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
			<div className="flex items-stretch gap-1">
				<button
					type="button"
					onClick={onToggleCollapse}
					className="flex flex-1 min-w-0 items-center gap-3 p-3 text-left hover:bg-gray-100/80 transition-colors rounded-none"
				>
					{isCollapsed ? (
						<ChevronRight className="w-4 h-4 shrink-0 text-gray-500" />
					) : (
						<ChevronDown className="w-4 h-4 shrink-0 text-gray-500" />
					)}
					{isCollapsed ? (
						<span className="text-sm font-medium text-gray-900 truncate">
							{displayName}
						</span>
					) : (
						<span className="text-sm font-medium text-gray-700">
							Nombre de la propiedad
						</span>
					)}
				</button>
				<div className="flex items-center pr-2">
					<Button
						variant="ghost"
						size="sm"
						disabled={!hasEditingRights}
						onClick={(e) => {
							e.stopPropagation();
							handleRemoveItemFromList({
								e: e,
								listPropertyPath: `entities.${entityIndex}.properties`,
								itemId: field._id,
							});
						}}
						className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
					>
						<X size={16} />
					</Button>
				</div>
			</div>

			<div
				className={cn(
					"transition-all duration-300 ease-in-out px-3",
					isCollapsed
						? "max-h-0 opacity-0 overflow-hidden py-0"
						: "max-h-[2000px] opacity-100 overflow-y-auto pb-3 space-y-3",
				)}
			>
				<div className="space-y-2">
					<Input
						{...customRegisterField({
							name: `entities.${entityIndex}.properties.${propIndex}.name` as Path<ConceptualModel>,
							propertyPath: `entities:${entityId}.properties:${field._id}.name`,
						})}
						placeholder="Nombre..."
						className="border-2 border-gray-200 focus:border-purple-400"
					/>
				</div>

			<div className="grid grid-cols-1 gap-3">
				<div className="space-y-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							{...customRegisterField({
								name: `entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.include` as Path<ConceptualModel>,
								propertyPath: `entities:${entityId}.properties:${field._id}.detailLevelDecision.include`,
								propagateUpdateOnChange: true,
							})}
							className="rounded border-gray-300"
						/>
						<span className="text-sm font-medium text-gray-700">
							Incluir en el nivel de detalle del modelo
						</span>
					</label>
				</div>

				<div className="space-y-2">
					<label className="block text-sm font-medium text-gray-700">
						Justificación
					</label>
					<Input
						{...customRegisterField({
							name: `entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.justification` as Path<ConceptualModel>,
							propertyPath: `entities:${entityId}.properties:${field._id}.detailLevelDecision.justification`,
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
							name: `entities.${entityIndex}.properties.${propIndex}.detailLevelDecision.argumentType` as Path<ConceptualModel>,
							propertyPath: `entities:${entityId}.properties:${field._id}.detailLevelDecision.argumentType`,
						})}
						className={cn(
							"w-full px-3 py-2 border-2 border-gray-200 rounded-md focus:border-purple-400 focus:outline-none",
							!hasEditingRights ? "bg-gray-100 cursor-not-allowed" : "bg-white",
						)}
						disabled={!hasEditingRights}
					>
						<option value="CALCULO SALIDA">Cálculo de salida</option>
						<option value="DATO DE ENTRADA">Dato de entrada</option>
						<option value="SIMPLIFICACION">Simplificación</option>
					</select>
				</div>
			</div>
			</div>
		</div>
	);
}

// EntityPropertiesEditor - MUST be defined outside of Detalle to prevent hooks from being recreated on every render
interface EntityPropertiesEditorProps {
	entityIndex: number;
	entityId: string;
	control: Control<ConceptualModel>;
	hasEditingRights: boolean;
	customRegisterField: CustomRegisterFieldFn;
	handleAddItemToList: HandleAddItemToListFn;
	handleRemoveItemFromList: HandleRemoveItemFromListFn;
}

function EntityPropertiesEditor({
	entityIndex,
	entityId,
	control,
	hasEditingRights,
	customRegisterField,
	handleAddItemToList,
	handleRemoveItemFromList,
}: EntityPropertiesEditorProps) {
	const propertiesList = useFieldArray({
		// TS cast because react-hook-form lacks template literal support for nested paths here
		name: `entities.${entityIndex}.properties` as const,
		control,
	});

	// Use domain Property._id, not RHF field.id — internal ids reset when the form
	// re-syncs after socket "add property", which was expanding collapsed rows.
	const [collapsedPropertyIds, setCollapsedPropertyIds] = useState<Set<string>>(
		new Set(),
	);

	const togglePropertyCollapse = (propertyId: string) => {
		setCollapsedPropertyIds((prev) => {
			const next = new Set(prev);
			if (next.has(propertyId)) {
				next.delete(propertyId);
			} else {
				next.add(propertyId);
			}
			return next;
		});
	};

	const previousPropertiesLength = useRef(propertiesList.fields.length);

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

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-md font-medium text-gray-900">Propiedades</h3>
				<Button
					variant="outline"
					size="sm"
					disabled={!hasEditingRights}
					onClick={(e) =>
						handleAddItemToList({
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
					{propertiesList.fields.map((propertyField, propIndex) => (
						<PropertyEditor
							key={propertyField._id}
							entityId={entityId}
							field={propertyField}
							propIndex={propIndex}
							entityIndex={entityIndex}
							control={control}
							isCollapsed={collapsedPropertyIds.has(propertyField._id)}
							onToggleCollapse={() =>
								togglePropertyCollapse(propertyField._id)
							}
							hasEditingRights={hasEditingRights}
							customRegisterField={customRegisterField}
							handleRemoveItemFromList={handleRemoveItemFromList}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<p>No hay propiedades agregadas</p>
					<p className="text-sm">
						Haz clic en &quot;Agregar Propiedad&quot; para comenzar
					</p>
				</div>
			)}
		</div>
	);
}

interface DetalleProps {
	hasEditingRights: boolean;
	control: Control<ConceptualModel>;
	customRegisterField: CustomRegisterFieldFn;
	handleAddItemToList: HandleAddItemToListFn;
	handleRemoveItemFromList: HandleRemoveItemFromListFn;
	watch: UseFormReturn<ConceptualModel>["watch"];
}

export default function Detalle({
	hasEditingRights,
	control,
	customRegisterField,
	handleAddItemToList,
	handleRemoveItemFromList,
	watch,
}: DetalleProps) {
	const [collapsedEntities, setCollapsedEntities] = useState<Set<string>>(
		new Set(),
	);

	const watchedEntities = useWatch({
		control,
		name: "entities",
	});

	const { includedEntities, excludedEntities } = useMemo(() => {
		const included = new Set<string>();
		const excluded = new Set<string>();

		// If we don't have data yet, return empty sets
		if (!watchedEntities || !Array.isArray(watchedEntities)) {
			return { includedEntities: included, excludedEntities: excluded };
		}

		watchedEntities.forEach((entity) => {
			// Check the value (handling boolean or "true" string)
			// Default to true if undefined
			const isIncluded = entity.scopeDecision?.include;

			if (isIncluded) {
				included.add(entity._id);
			} else {
				excluded.add(entity._id);
			}
		});

		return { includedEntities: included, excludedEntities: excluded };

		// Depend on watchedEntities so it runs every time the form array updates
	}, [watchedEntities]);

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
					Detalle de Propiedades de Entidades
				</p>
				<p className="text-sm text-gray-500">
					Gestiona las propiedades de cada una de las entidades{" "}
					<strong>incluídas</strong> en el alcance del modelo de simulación
				</p>
			</div>

			{includedEntities.size > 0 ? (
				watchedEntities.map((entity, index) => {
					if (!includedEntities.has(entity._id)) {
						return null;
					}

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
										Entidad:{" "}
										<strong>{entity.name || "Entidad sin nombre"}</strong>
									</p>
								</div>
							</button>

							{/* Collapsible Content */}
							<div
								className={cn(
									"transition-all duration-300 ease-in-out",
									isCollapsed
										? "max-h-0 opacity-0 overflow-hidden"
										: "max-h-[500px] overflow-y-auto opacity-100",
								)}
							>
								<div className="p-4 pt-0 space-y-4">
									<EntityPropertiesEditor
										entityIndex={index}
										entityId={entity._id}
										control={control}
										hasEditingRights={hasEditingRights}
										customRegisterField={customRegisterField}
										handleAddItemToList={handleAddItemToList}
										handleRemoveItemFromList={handleRemoveItemFromList}
									/>
								</div>
							</div>
						</div>
					);
				})
			) : (
				<div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
					<p>No hay entidades incluidas para gestionar propiedades</p>
					<p className="text-sm">
						Ingrese al menos una entidad en la seccion &quot;Entidades y
						Diagramas Dinámicas&quot; para poder definir el nivel de detalle de
						las mismas en el modelo conceptual
					</p>
				</div>
			)}
			{excludedEntities.size > 0 && (
				<div className="p-8 text-bordo-800 bg-bordo-50 rounded-lg border-2 border-dashed border-bordo-300">
					<p>
						Las siguientes entidades <strong>no fueron incluidas</strong> en el
						alcance del modelo de simulación:
					</p>
					<ul className="list-disc list-inside ml-2">
						{watchedEntities.map((entity, index) => {
							if (!excludedEntities.has(entity._id)) {
								return null;
							}
							if (entity) {
								return (
									<li key={entity._id}>
										{entity.name || "Entidad sin nombre"}
									</li>
								);
							}
						})}
					</ul>
				</div>
			)}
		</div>
	);
}
