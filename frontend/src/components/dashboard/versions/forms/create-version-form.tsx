"use client";

import { startTransition, useActionState, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionState, createVersion } from "../actions/create-version";
import { Button } from "@src/components/ui/common/button";
import { Input } from "@src/components/ui/common/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@src/components/ui/common/select";
import { Checkbox } from "@src/components/ui/common/checkbox";
import { VersionEntity } from "@src/types/version";

// Valid states for parent versions
const VALID_PARENT_VERSION_STATES = ["FINALIZADA", "PENDIENTE DE REVISION", "REVISADA"];

export type CreateVersionFormData = {
	title: string;
	parentVersionId?: string;
	migrateTodoItems: boolean;
};

interface CreateVersionFormProps {
	projectId: string;
	existingVersions: VersionEntity[];
	/** When opening the form from a version card, preselect that version as parent */
	defaultParentVersionId?: string;
	onSuccess?: () => void;
	onClose?: () => void;
}

const initialState: ActionState = {
	error: undefined,
	success: false,
};

export const CreateVersionForm = ({
	projectId,
	existingVersions,
	defaultParentVersionId,
	onSuccess,
	onClose,
}: CreateVersionFormProps) => {
	const [state, formAction, isPending] = useActionState(
		createVersion,
		initialState
	);

	// Filter versions that are valid to be parent versions
	const validParentVersions = useMemo(() => {
		return existingVersions.filter((v) =>
			VALID_PARENT_VERSION_STATES.includes(v.state)
		);
	}, [existingVersions]);

	const isValidDefaultParent = Boolean(
		defaultParentVersionId &&
			validParentVersions.some((v) => v.id === defaultParentVersionId)
	);

	// Track whether a parent version is selected (not "none")
	const [hasParentSelected, setHasParentSelected] = useState(isValidDefaultParent);
	const [migrateTodoItems, setMigrateTodoItems] = useState(true);

	const form = useForm<CreateVersionFormData>({
		defaultValues: {
			title: "",
			parentVersionId: isValidDefaultParent ? defaultParentVersionId : undefined,
			migrateTodoItems: true,
		},
		mode: "onBlur",
	});

	// Call onSuccess when version is created successfully
	useEffect(() => {
		if (state?.success && onSuccess) {
			onSuccess();
		}
	}, [state?.success, onSuccess]);

	const handleParentVersionChange = (value: string) => {
		const isParentSelected = value !== "none" && value !== "";
		setHasParentSelected(isParentSelected);
		form.setValue("parentVersionId", isParentSelected ? value : undefined);
		
		// Reset checkbox to checked when selecting a parent
		if (isParentSelected) {
			setMigrateTodoItems(true);
		}
	};

	const onSubmit = (data: CreateVersionFormData) => {
		const formData = new FormData();
		formData.append("projectId", projectId);
		formData.append("title", data.title);
		
		if (data.parentVersionId && hasParentSelected) {
			formData.append("parentVersionId", data.parentVersionId);
			formData.append("migrateTodoItems", migrateTodoItems.toString());
		}
		
		startTransition(() => {
			formAction(formData);
		});
	};

	if (state?.success) {
		return (
			<div className="flex flex-col gap-4 justify-center p-2 items-center">
				<h2 className="font-medium">Se ha creado la versión exitosamente!</h2>
				<Button className="uppercase" onClick={onClose}>
					Continuar
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			<h2 className="text-3xl font-medium text-center">Crear versión</h2>

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Título de la versión{" "}
						<span className="text-sm text-red-600"> *</span>
					</label>
					<span className="text-sm text-gray-500">Máximo 100 caracteres</span>
				</div>
				<Input
					type="text"
					placeholder="v1.0.0"
					{...form.register("title", {
						required: "El título de la versión es obligatorio",
						maxLength: {
							value: 100,
							message: "Máximo 100 caracteres",
						},
					})}
					maxLength={100}
					disabled={isPending}
				/>
				{form.formState.errors.title && (
					<p className="text-sm text-red-600">
						{form.formState.errors.title.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
					Versión padre (opcional)
				</label>
				<Select
					onValueChange={handleParentVersionChange}
					disabled={isPending}
					defaultValue={isValidDefaultParent ? defaultParentVersionId : "none"}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar versión padre" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">No aplica</SelectItem>
						{validParentVersions.map((version) => (
							<SelectItem key={version.id} value={version.id}>
								{version.title} ({version.state})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{validParentVersions.length === 0 && (
					<p className="text-sm text-gray-500">
						No hay versiones disponibles para seleccionar como padre. Una versión debe estar en estado FINALIZADA, PENDIENTE DE REVISION o REVISADA para poder seleccionada.
					</p>
				)}
			</div>

			{/* Checkbox - only visible when a parent version is selected */}
			{/* {hasParentSelected && (
				<div className="flex items-center space-x-2">
					<Checkbox
						id="migrateTodoItems"
						checked={migrateTodoItems}
						onCheckedChange={(checked) => setMigrateTodoItems(checked === true)}
						disabled={isPending}
					/>
					<label
						htmlFor="migrateTodoItems"
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
					>
						Migrar To Do items a la nueva versión
					</label>
				</div>
			)} */}

			{state?.error && (
				<p className="text-sm text-red-600">{state.error}</p>
			)}

			<Button type="submit" className="uppercase w-full" isLoading={isPending}>
				Crear versión
			</Button>
		</form>
	);
};
