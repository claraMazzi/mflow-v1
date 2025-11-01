"use client";

import { startTransition, useActionState, useEffect, useMemo } from "react";
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
import { VersionEntity } from "@src/types/version";

export type CreateVersionFormData = {
	title: string;
	parentVersionId?: string;
};

interface CreateVersionFormProps {
	projectId: string;
	existingVersions: VersionEntity[];
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
	onSuccess,
	onClose,
}: CreateVersionFormProps) => {
	const [state, formAction, isPending] = useActionState(
		createVersion,
		initialState
	);

	const readOnlyVersions = useMemo(() => {
		return existingVersions.filter((v) => v.state !== "EN EDICION");
	}, [existingVersions]);

	const form = useForm<CreateVersionFormData>({
		defaultValues: {
			title: "",
			parentVersionId: undefined,
		},
		mode: "onBlur",
	});

	// Call onSuccess when version is created successfully
	useEffect(() => {
		if (state?.success && onSuccess) {
			onSuccess();
		}
	}, [state?.success, onSuccess]);

	const parseErrorMessage = (error: string) => {
		console.log("Create version error:", error);
		switch (error) {
			case "Not authenticated":
				return "Debes iniciar sesión para crear una versión";
			case "Version title is required":
				return "El título de la versión es requerido";
			case "Project not found":
				return "Proyecto no encontrado";
			case "Something went wrong.":
			default:
				return "Ocurrió un error inesperado";
		}
	};

	const onSubmit = (data: CreateVersionFormData) => {
		const formData = new FormData();
		formData.append("projectId", projectId);
		formData.append("title", data.title);
		if (data.parentVersionId) {
			formData.append("parentVersionId", data.parentVersionId);
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
						required: "El título de la versión es requerido",
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
					onValueChange={(value) =>
						form.setValue(
							"parentVersionId",
							value === "none" ? undefined : value
						)
					}
					disabled={isPending || readOnlyVersions.length === 0}
				>
					<SelectTrigger>
						<SelectValue placeholder="Seleccionar versión padre" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">Ninguna</SelectItem>
						{readOnlyVersions.map((version) => (
							<SelectItem key={version.id} value={version.id}>
								{version.title}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{readOnlyVersions.length === 0 && (
					<p className="text-sm text-gray-500">
						No hay versiones no editables disponibles para seleccionar
					</p>
				)}
			</div>

			{state?.error && (
				<p className="text-sm text-red-600">{parseErrorMessage(state.error)}</p>
			)}

			<Button type="submit" className="uppercase w-full" isLoading={isPending}>
				Crear versión
			</Button>
		</form>
	);
};
