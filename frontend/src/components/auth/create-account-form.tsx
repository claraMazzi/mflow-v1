"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@components/ui/common/input";
import { Button } from "@components/ui/common/button";
import { Checkbox } from "@components/ui/common/checkbox";
import { createAccount, RegisterUserFormData } from "./actions/create-account";
import cn from "clsx";
import {
	emailRegex,
	passwordRegex,
	personNameRegex,
} from "@lib/utils";

type CreateAccountFormValues = RegisterUserFormData & {
	confirmPassword: string;
};

function filterPersonNameInput(value: string) {
	return value.replace(/[^\p{L}\s']/gu, "");
}

interface CreateAccountFormProps {
	defaultValues?: Partial<CreateAccountFormValues>;
	successMessage?: string;
	title?: string;
	submitButtonText?: string;
	showLoginLink?: boolean;
	loginLinkText?: string;
	loginLinkHref?: string;
	onSuccess?: () => void;
	className?: string;
}

export default function CreateAccountForm({
	defaultValues = {
		name: "",
		lastName: "",
		email: "",
		password: "",
		confirmPassword: "",
		roles: ["MODELADOR"],
	},
	successMessage = "¡Te registraste correctamente! Por favor revisa tu casilla de correo. Recibirás un email con un link para validar el correo electronico ingresado.",
	title = "MFLOW",
	submitButtonText = "CREAR CUENTA",
	showLoginLink = true,
	loginLinkText = "INICIAR SESION",
	loginLinkHref = "/login",
	onSuccess,
	className = "",
}: CreateAccountFormProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm<CreateAccountFormValues>({
		defaultValues: {
			name: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
			roles: ["MODELADOR"],
			...defaultValues,
		},
		mode: "onBlur",
	});

	const passwordValue = form.watch("password");

	useEffect(() => {
		const confirm = form.getValues("confirmPassword");
		if (
			confirm.length > 0 ||
			form.formState.touchedFields.confirmPassword
		) {
			void form.trigger("confirmPassword");
		}
	}, [passwordValue]);

	const handleSubmit = async ({
		confirmPassword: _confirm,
		...data
	}: CreateAccountFormValues) => {
		setIsLoading(true);
		setErrorMessage(null);

		const result = await createAccount(data);

		if (result.success) {
			setIsSubmitted(true);
			onSuccess?.();
		} else {
			setErrorMessage(
				result.error ||
					"Se ha producido un error. Por favor, inténtelo de nuevo más tarde."
			);
		}

		setIsLoading(false);
	};

	const { onChange: onNameChange, ...nameFieldReg } = form.register("name", {
		required: "Nombre es obligatorio.",
		maxLength: {
			value: 100,
			message:
				"La longitud del nombre no puede exceder los 100 caracteres.",
		},
		pattern: {
			value: personNameRegex,
			message:
				"Solo se permiten letras, espacios y el apóstrofo (') (sin números ni otros símbolos).",
		},
	});

	const { onChange: onLastNameChange, ...lastNameFieldReg } = form.register(
		"lastName",
		{
			required: "Apellido es obligatorio.",
			maxLength: {
				value: 100,
				message:
					"La longitud del apellido no puede exceder los 100 caracteres.",
			},
			pattern: {
				value: personNameRegex,
				message:
					"Solo se permiten letras, espacios y el apóstrofo (') (sin números ni otros símbolos).",
			},
		}
	);

	const handlePersonNameChange =
		(
			field: "name" | "lastName",
			onChange: (e: ChangeEvent<HTMLInputElement>) => void
		) =>
		(e: ChangeEvent<HTMLInputElement>) => {
			const filtered = filterPersonNameInput(e.target.value);
			form.setValue(field, filtered, {
				shouldValidate: true,
				shouldDirty: true,
			});
			void onChange({
				...e,
				target: { ...e.target, value: filtered },
			});
		};

	return (
		<div
			className={`min-h-screen flex flex-col gap-4 items-center justify-center bg-purple-200 p-4 ${className}`}
		>
			<div className="w-full max-w-xl flex flex-col gap-6 bg-white shadow-md rounded-md p-8 border border-gray-200">
				{isSubmitted ? (
					<div className="text-center space-y-4">
						<h2 className="text-2xl font-medium text-purple-600">
							{successMessage.split("!")[0]}!
						</h2>
						<p className="text-lg">
							{successMessage.split("!").slice(1).join("!").trim()}
						</p>
					</div>
				) : (
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="space-y-6"
					>
						<div className="flex flex-col text-center gap-2">
							<h1 className="text-3xl font-medium text-center text-purple-600">
								{title}
							</h1>
							<p>Creá tu cuenta</p>
						</div>
						<div className="flex flex-col gap-4">
							<div className="space-y-2">
								<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Nombre <span className="text-red-500">*</span>
								</label>
								<Input
									placeholder="Tu nombre"
									{...nameFieldReg}
									onChange={handlePersonNameChange("name", onNameChange)}
									value={form.watch("name") || ""}
								/>
								{form.formState.errors.name && (
									<p className="text-sm text-red-600">
										{form.formState.errors.name.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Apellido<span className="text-red-500">*</span>
								</label>
								<Input
									placeholder="Tu apellido"
									{...lastNameFieldReg}
									onChange={handlePersonNameChange(
										"lastName",
										onLastNameChange
									)}
									value={form.watch("lastName") || ""}
								/>
								{form.formState.errors.lastName && (
									<p className="text-sm text-red-600">
										{form.formState.errors.lastName.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Correo electrónico
									<span className="text-red-500">*</span>
								</label>
								<Input
									placeholder="tu@email.com"
									{...form.register("email", {
										required: "Correo electrónico es obligatorio.",
										maxLength: {
											value: 100,
											message:
												"La longitud del correo electrónico no puede exceder los 100 caracteres.",
										},
										pattern: {
											value: emailRegex,
											message: "Correo electrónico inválido.",
										},
									})}
									value={form.watch("email") || ""}
								/>
								{form.formState.errors.email && (
									<p className="text-sm text-red-600">
										{form.formState.errors.email.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Contraseña<span className="text-red-500">*</span>
								</label>
								<Input
									type="password"
									placeholder="Tu contraseña"
									{...form.register("password", {
										required: "Contraseña es obligatoria.",
										pattern: {
											value: passwordRegex,
											message:
												"Contraseña debe tener entre 6-25 caracteres con al menos una minúscula, una mayúscula, un número y un caracter especial (@$!%*?&).",
										},
									})}
									value={form.watch("password") || ""}
								/>
								{form.formState.errors.password && (
									<p className="text-sm text-red-600">
										{form.formState.errors.password.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
									Confirmar contraseña
									<span className="text-red-500">*</span>
								</label>
								<Input
									type="password"
									placeholder="Repetí tu contraseña"
									{...form.register("confirmPassword", {
										required: "Confirmá tu contraseña.",
										validate: (value) =>
											value === form.getValues("password") ||
											"Las contraseñas no coinciden.",
									})}
									value={form.watch("confirmPassword") || ""}
								/>
								{form.formState.errors.confirmPassword && (
									<p className="text-sm text-red-600">
										{form.formState.errors.confirmPassword.message}
									</p>
								)}
							</div>

							<div className="self-baseline">
								<div className="space-y-2">
									<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
										Roles a asignar:
									</label>
									<div className="flex flex-col gap-2 ml-2">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="modelador"
												checked={form.watch("roles")?.includes("MODELADOR")}
												disabled
												className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
											/>
											<label
												htmlFor="modelador"
												className="text-sm font-medium"
											>
												Modelador
											</label>
										</div>
										<div
											className={cn(
												"flex items-center space-x-2",
												!form.watch("roles")?.includes("ADMIN") ? "hidden" : ""
											)}
										>
											<Checkbox
												id="admin"
												checked={form.watch("roles")?.includes("ADMIN")}
												disabled
												className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
											/>
											<label htmlFor="admin" className="text-sm font-medium">
												Administrador
											</label>
										</div>

										<div
											className={cn(
												"flex items-center space-x-2",
												!form.watch("roles")?.includes("VERIFICADOR")
													? "hidden"
													: ""
											)}
										>
											<Checkbox
												id="verificador"
												checked={form.watch("roles")?.includes("VERIFICADOR")}
												disabled
												className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
											/>
											<label
												htmlFor="verificador"
												className="text-sm font-medium"
											>
												Verificador
											</label>
										</div>
									</div>
									{form.formState.errors.roles && (
										<p className="text-sm text-red-600">
											{form.formState.errors.roles.message}
										</p>
									)}
								</div>
							</div>
							<div className="h-full w-full flex items-end row-start-4 col-span-2 justify-center">
								<Button
									type="submit"
									disabled={isLoading}
									className="h-fit w-full items-end"
								>
									{isLoading ? "Creando..." : submitButtonText}
								</Button>
							</div>
						</div>

						{errorMessage && (
							<p className="text-sm text-red-600">{errorMessage}</p>
						)}
					</form>
				)}
			</div>

			{showLoginLink && !isSubmitted && (
				<div className="w-full max-w-xl flex flex-col gap-6 bg-white shadow-md rounded-md p-8 border border-gray-200">
					<div className="w-full flex flex-col items-center gap-2">
						<p className="text-gray-600 text-sm">Ya tienes una cuenta?</p>
						<Button
							asChild
							as="a"
							href={loginLinkHref}
							variant="outline"
							className="h-fit w-fit bg-transparent"
						>
							{loginLinkText}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
