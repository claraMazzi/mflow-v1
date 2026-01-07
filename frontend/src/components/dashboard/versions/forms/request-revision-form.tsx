"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@src/components/ui/common/button";
import { Checkbox } from "@src/components/ui/common/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@src/components/ui/common/select";
import { Label } from "@src/components/ui/common/label";
import { VersionEntity } from "@src/types/version";
import { User } from "@src/types/user";
import {
	requestRevision,
	RequestRevisionState,
} from "../actions/request-revision";
import { getVerifiers } from "../actions/get-verifiers";
import { Skeleton } from "@src/components/ui/skeleton";

interface RequestRevisionFormProps {
	version: VersionEntity;
	onSuccess?: () => void;
	onClose?: () => void;
}

const initialState: RequestRevisionState = {
	error: undefined,
	success: false,
};

export const RequestRevisionForm = ({
	version,
	onSuccess,
	onClose,
}: RequestRevisionFormProps) => {
	const [state, formAction, isPending] = useActionState(
		requestRevision,
		initialState
	);

	const [verifiers, setVerifiers] = useState<User[]>([]);
	const [isLoadingVerifiers, setIsLoadingVerifiers] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);

	const [assignRandomVerifier, setAssignRandomVerifier] = useState(false);
	const [selectedVerifierId, setSelectedVerifierId] = useState<string>("");
	const [validationError, setValidationError] = useState<string | null>(null);

	// Fetch verifiers on mount
	useEffect(() => {
		const fetchVerifiers = async () => {
			setIsLoadingVerifiers(true);
			setLoadError(null);
			const result = await getVerifiers();
			if (result.success && result.data) {
				setVerifiers(result.data.verifiers);
			} else {
				setLoadError(result.error || "Error al cargar verificadores");
			}
			setIsLoadingVerifiers(false);
		};

		fetchVerifiers();
	}, []);

	// Call onSuccess when revision request is created successfully
	useEffect(() => {
		if (state?.success && onSuccess) {
			onSuccess();
		}
	}, [state?.success, onSuccess]);

	// Clear validation error when user makes a selection
	useEffect(() => {
		if (assignRandomVerifier || selectedVerifierId) {
			setValidationError(null);
		}
	}, [assignRandomVerifier, selectedVerifierId]);

	const handleCheckboxChange = (checked: boolean) => {
		setAssignRandomVerifier(checked);
		// If checkbox is checked, clear the selected verifier
		if (checked) {
			setSelectedVerifierId("");
		}
		setValidationError(null);
	};

	const handleVerifierChange = (value: string) => {
		// If "none" is selected, clear the selection
		if (value === "none") {
			setSelectedVerifierId("");
		} else {
			setSelectedVerifierId(value);
			// If a verifier is selected, uncheck the checkbox
			setAssignRandomVerifier(false);
		}
		setValidationError(null);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate mutual exclusivity
		if (assignRandomVerifier && selectedVerifierId) {
			setValidationError("No puede seleccionar ambas opciones.");
			return;
		}

		if (!assignRandomVerifier && !selectedVerifierId) {
			setValidationError(
				"Debe seleccionar un verificador o marcar la opción para asignar uno automáticamente."
			);
			return;
		}

		const formData = new FormData();
		formData.append("versionId", version.id);
		formData.append("assignRandomVerifier", assignRandomVerifier.toString());
		if (selectedVerifierId) {
			formData.append("selectedVerifierId", selectedVerifierId);
		}

		startTransition(() => {
			formAction(formData);
		});
	};

	if (state?.success) {
		return (
			<div className="flex flex-col gap-4 justify-center p-2 items-center">
				<h2 className="font-medium text-green-600">
					¡La solicitud de revisión fue creada exitosamente!
				</h2>
				<Button className="uppercase" onClick={onClose}>
					Continuar
				</Button>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6 p-2">
			<div className="text-center">
				<p className="text-base">
					Solicitar revisión de la versión:{" "}
					<span className="font-bold">{version.title}</span>
				</p>
			</div>

			{isLoadingVerifiers ? (
				<div className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			) : loadError ? (
				<div className="text-center text-red-600">
					<p>{loadError}</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => window.location.reload()}
						className="mt-2"
					>
						Reintentar
					</Button>
				</div>
			) : (
				<>
					{/* Checkbox option */}
					<div className="flex items-center space-x-3">
						<Checkbox
							id="assignRandomVerifier"
							checked={assignRandomVerifier}
							onCheckedChange={handleCheckboxChange}
							disabled={isPending}
						/>
						<Label
							htmlFor="assignRandomVerifier"
							className="cursor-pointer font-normal"
						>
							Quiero que se me asigne un verificador.
						</Label>
					</div>

					{/* Select verifier option */}
					<div className="space-y-2">
						<Label htmlFor="verifier-select">Seleccionar verificador</Label>
						<Select
							value={selectedVerifierId || "none"}
							onValueChange={handleVerifierChange}
							disabled={isPending || assignRandomVerifier}
						>
							<SelectTrigger id="verifier-select">
								<SelectValue placeholder="Seleccione un verificador" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">-- Ninguno --</SelectItem>
								{verifiers.map((verifier) => (
									<SelectItem key={verifier.id} value={verifier.id}>
										{verifier.name} {verifier.lastName} ({verifier.email})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{verifiers.length === 0 && (
							<p className="text-sm text-gray-500">
								No hay verificadores disponibles en el sistema.
							</p>
						)}
					</div>
				</>
			)}

			{/* Validation error */}
			{validationError && (
				<p className="text-sm text-red-600 text-center">{validationError}</p>
			)}

			{/* Server error */}
			{state?.error && (
				<p className="text-sm text-red-600 text-center">{state.error}</p>
			)}

			<div className="flex justify-center space-x-3 mt-4 w-full">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onClose}
					disabled={isPending}
				>
					Cancelar
				</Button>
				<Button
					type="submit"
					size="sm"
					disabled={isPending || isLoadingVerifiers || !!loadError}
					isLoading={isPending}
				>
					Solicitar
				</Button>
			</div>
		</form>
	);
};

