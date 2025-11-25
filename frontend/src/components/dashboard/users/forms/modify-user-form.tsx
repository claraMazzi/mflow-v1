"use client";

import { type ActionState } from "../actions/modify-user";
import { startTransition, useActionState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { Checkbox } from "@components/ui/common/checkbox";
import { useUI } from "@components/ui/context";
import { User } from "#types/user";
import { Badge } from "@components/ui/common/badge";
import { getRoleBadgeVariant, getRoleDisplayName } from "@lib/utils";
import { emailRegex } from "../../../../../../backend/src/config/regular-exp";

export type ModifyUserFormData = {
	id: string;
	name: string;
	lastName: string;
	email: string;
	roles: string[];
};

interface ModifyUserFormProps {
	onSuccess?: (form?: ModifyUserFormData) => void;
	formActionCallback: (
		state: ActionState,
		formData: FormData
	) => Promise<ActionState> | ActionState;
	user: User;
	disableFieldsMapping: {
		name: boolean;
		lastName: boolean;
		email: boolean;
		roles: boolean;
	};
}

const initialState: ActionState = {
	error: undefined,
	success: false,
};

export const ModifyUserForm = ({
	onSuccess,
	formActionCallback,
	user,
	disableFieldsMapping,
}: ModifyUserFormProps) => {
	const [state, formAction, isPending] = useActionState(
		formActionCallback,
		initialState
	);

	const { closeModal } = useUI();

	const form = useForm<ModifyUserFormData>({
		defaultValues: {
			id: user.id,
			name: user.name,
			lastName: user.lastName,
			email: user.email,
			roles: user.roles || ["MODELADOR"],
		},
		mode: "onBlur",
	});

	useEffect(() => {
		if (state?.success && onSuccess) {
			console.log("prev");
			onSuccess(form.getValues());
		}
	}, [state?.success, onSuccess, form]);

	const onSubmit = (data: ModifyUserFormData) => {
		const formData = new FormData();
		formData.append("id", data.id);
		formData.append("name", data.name);
		formData.append("lastName", data.lastName);
		formData.append("email", data.email);
		formData.append("roles", JSON.stringify(data.roles));
		startTransition(() => {
			formAction(formData);
		});
	};

	if (!user) return <></>;

	if (state?.success) {
		return (
			<div className="flex flex-col gap-4 justify-center p-6 items-center">
				<h2 className="font-medium text-lg">
					Se ha modificado el usuario exitosamente!
				</h2>
				<Button className="uppercase" onClick={closeModal}>
					Continuar
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
			<h2 className="text-3xl font-medium text-center">Editar usuario</h2>

			{/* Hidden ID field */}
			<div className="hidden">
				<Input
					type="text"
					{...form.register("id", {
						required: "ID is required",
					})}
					required
				/>
				{form.formState.errors.id && (
					<p className="text-sm text-red-600">
						{form.formState.errors.id.message}
					</p>
				)}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Nombre <span className="text-red-500">*</span>
					</label>
					<Input
						{...form.register("name", {
							required: "Nombre es requerido",
							maxLength: {
								value: 100,
								message:
									"La longitud del nombre no puede exceder los 100 caracteres.",
							},
						})}
						type="text"
						placeholder={user.name}
						disabled={disableFieldsMapping.name}
						className="border-2 border-blue-200 focus:border-blue-400"
					/>
					{form.formState.errors.name && (
						<p className="text-sm text-red-600">
							{form.formState.errors.name.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Apellido <span className="text-red-500">*</span>
					</label>
					<Input
						{...form.register("lastName", {
							required: "Apellido es requerido",
							maxLength: {
								value: 100,
								message:
									"La longitud del apellido no puede exceder los 100 caracteres.",
							},
						})}
						type="text"
						placeholder={user.lastName}
						disabled={disableFieldsMapping.lastName}
					/>
					{form.formState.errors.lastName && (
						<p className="text-sm text-red-600">
							{form.formState.errors.lastName.message}
						</p>
					)}
				</div>

				<div className="col-span-2 space-y-2">
					<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
						Email <span className="text-red-500">*</span>
					</label>
					<Input
						{...form.register("email", {
							required: "Email es requerido",
							pattern: {
								value: emailRegex,
								message: "Email inválido",
							},
							maxLength: {
								value: 100,
								message:
									"La longitud del email no puede exceder los 100 caracteres.",
							},
						})}
						type="email"
						placeholder="juanignacioalbani@gmail.com"
						disabled={disableFieldsMapping.email}
					/>
					{form.formState.errors.email && (
						<p className="text-sm text-red-600">
							{form.formState.errors.email.message}
						</p>
					)}
				</div>
			</div>

			<div className="space-y-4">
				<h3 className="text-lg font-medium">Roles</h3>
				{disableFieldsMapping.roles ? (
					<div className="flex flex-wrap gap-1">
						{user.roles.map((role) => {
							return (
								<Badge key={role} color={getRoleBadgeVariant(role)}>
									{getRoleDisplayName(role)}
								</Badge>
							);
						})}
					</div>
				) : (
					<div className="space-y-2">
						<div className="flex gap-6">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="admin"
									name="roles"
									value="ADMIN"
									disabled={disableFieldsMapping.roles}
									checked={form.watch("roles")?.includes("ADMIN")}
									onCheckedChange={(checked) => {
										const currentRoles = form.getValues("roles") || [];
										if (checked) {
											form.setValue("roles", [
												...currentRoles.filter((r) => r !== "ADMIN"),
												"ADMIN",
											]);
										} else {
											form.setValue(
												"roles",
												currentRoles.filter((r) => r !== "ADMIN")
											);
										}
										form.trigger("roles");
									}}
									className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
								/>
								<label htmlFor="admin" className="text-sm font-medium">
									Administrador
								</label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="verificador"
									name="roles"
									value="VERIFICADOR"
									disabled={disableFieldsMapping.roles}
									checked={form.watch("roles")?.includes("VERIFICADOR")}
									onCheckedChange={(checked) => {
										const currentRoles = form.getValues("roles") || [];
										if (checked) {
											form.setValue("roles", [
												...currentRoles.filter((r) => r !== "VERIFICADOR"),
												"VERIFICADOR",
											]);
										} else {
											form.setValue(
												"roles",
												currentRoles.filter((r) => r !== "VERIFICADOR")
											);
										}
										form.trigger("roles");
									}}
									className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
								/>
								<label htmlFor="verificador" className="text-sm font-medium">
									Verificador
								</label>
							</div>

							<div className="flex items-center space-x-2">
								<Checkbox
									id="modelador"
									name="roles"
									value="MODELADOR"
									disabled
									checked={form.watch("roles")?.includes("MODELADOR")}
									onCheckedChange={(checked) => {
										const currentRoles = form.getValues("roles") || [];
										if (checked) {
											form.setValue("roles", [
												...currentRoles.filter((r) => r !== "MODELADOR"),
												"MODELADOR",
											]);
										} else {
											form.setValue(
												"roles",
												currentRoles.filter((r) => r !== "MODELADOR")
											);
										}
										form.trigger("roles");
									}}
									className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
								/>
								<label htmlFor="modelador" className="text-sm font-medium">
									Modelador
								</label>
							</div>
						</div>
						{form.formState.errors.roles && (
							<p className="text-sm text-red-600">
								{form.formState.errors.roles.message}
							</p>
						)}
					</div>
				)}
			</div>

			{state?.error && <p className="text-sm text-red-600">{state.error}</p>}

			<div className="flex justify-center pt-4">
				<Button
					type="submit"
					className="uppercase bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium"
					disabled={isPending || !form.formState.isValid}
				>
					{isPending ? "Guardando..." : "Guardar Cambios"}
				</Button>
			</div>
		</form>
	);
};
