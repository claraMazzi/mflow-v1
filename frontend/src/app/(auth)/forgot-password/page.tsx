"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@components/ui/common/button";
import { Input } from "@components/ui/common/input";
import { Label } from "@components/ui/common/label";

interface FormData {
	email: string;
}

export default function ForgotPassword() {
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const form = useForm<FormData>({
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = async (data: FormData) => {
		setIsLoading(true);
		setSuccessMessage(null);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message ||
						"Ocurrió un error al enviar el correo para restablecer la contraseña."
				);
			}

			const body = await response.json();
			setSuccessMessage(body.data);
			form.reset();
		} catch (error) {
			setErrorMessage(
				"Se ha producido un error. Por favor, inténtelo de nuevo más tarde."
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-purple-200 p-5">
			<div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<h2 className="text-2xl font-medium text-center text-gray-900">
						¿Olvidaste tu contraseña?
					</h2>
					<p className="text-sm text-center text-gray-600">
						Por favor ingresá tu e-mail. Las instrucciones para restablecer tu
						contraseña serán enviadas a tu correo electrónico.
					</p>

					<div className="space-y-2">
						<Label htmlFor="email">Correo electrónico</Label>
						<Input
							type="email"
							id="email"
							placeholder="tu@email.com"
							{...form.register("email", {
								maxLength: {
									value: 100,
									message:
										"La longitud del correo electrónico no puede exceder los 100 caracteres.",
								},
								required: "Correo electrónico es requerido.",
								pattern: {
									value: /^\S+@\S+$/i,
									message: "Correo electrónico inválido.",
								},
							})}
						/>
						{form.formState.errors.email && (
							<p className="text-sm text-red-600">
								{form.formState.errors.email.message}
							</p>
						)}
					</div>

					{successMessage && (
						<p className="text-sm text-green-600 text-center">
							{successMessage}
						</p>
					)}
					{errorMessage && (
						<p className="text-sm text-red-600 text-center">{errorMessage}</p>
					)}

					<Button
						type="submit"
						variant="primary"
						fullWidth
						isLoading={isLoading}
					>
						Restablecer contraseña
					</Button>

					<div className="text-center">
						<Link
							href="/login"
							className="text-sm text-purple-600 hover:text-purple-500"
						>
							Volver al inicio de sesión
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
