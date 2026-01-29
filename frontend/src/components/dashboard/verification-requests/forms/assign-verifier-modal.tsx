"use client";

import { useState, useEffect } from "react";
import { Button } from "@components/ui/common/button";
import { Label } from "@components/ui/common/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@components/ui/common/select";
import { getVerifierRequestById } from "../actions/get-verification-requests";
import { getVerifiers } from "@components/dashboard/versions/actions/get-verifiers";
import { assignVerifierToRequest } from "../actions/assign-verifier";
import { useUI } from "@components/ui/context";
import type { User } from "#types/user";

interface AssignVerifierModalProps {
	verifierRequestId: string;
	onSuccess: () => void;
}

export function AssignVerifierModal({
	verifierRequestId,
	onSuccess,
}: AssignVerifierModalProps) {
	const { closeModal } = useUI();
	const [projectName, setProjectName] = useState("");
	const [versionTitle, setVersionTitle] = useState("");
	const [collaborators, setCollaborators] = useState<
		{ id: string; name: string; email: string }[]
	>([]);
	const [verifiers, setVerifiers] = useState<User[]>([]);
	const [selectedVerifierId, setSelectedVerifierId] = useState<string>("");
	const [isLoadingDetail, setIsLoadingDetail] = useState(true);
	const [isLoadingVerifiers, setIsLoadingVerifiers] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			setIsLoadingDetail(true);
			setError(null);
			const res = await getVerifierRequestById(verifierRequestId);
			if (res.data) {
				setProjectName(res.data.projectName);
				setVersionTitle(res.data.versionTitle);
				setCollaborators(res.data.collaborators || []);
			} else {
				setError(res.error || "Error al cargar la solicitud.");
			}
			setIsLoadingDetail(false);
		};
		load();
	}, [verifierRequestId]);

	useEffect(() => {
		const load = async () => {
			setIsLoadingVerifiers(true);
			const result = await getVerifiers();
			if (result.success && result.data?.verifiers) {
				setVerifiers(result.data.verifiers);
			}
			setIsLoadingVerifiers(false);
		};
		load();
	}, []);

	const handleAssign = async () => {
		if (!selectedVerifierId.trim()) {
			setError("Debe seleccionar un verificador.");
			return;
		}
		setIsSubmitting(true);
		setError(null);
		const result = await assignVerifierToRequest({
			verifierRequestId,
			assignedVerifierId: selectedVerifierId,
		});
		if (result.success) {
			onSuccess();
			closeModal();
		} else {
			setError(result.error || "Error al asignar el verificador.");
		}
		setIsSubmitting(false);
	};

	if (isLoadingDetail) {
		return (
			<div className="p-4 text-muted-foreground">
				Cargando datos de la solicitud...
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{error && (
				<p className="text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
			<div>
				<Label className="text-sm font-bold">
					Nombre del proyecto <span className="text-red-600">*</span>
				</Label>
				<div className="mt-1 text-sm text-gray-900">{projectName}</div>
			</div>
			<div>
				<Label className="text-sm font-bold">
					Título de la versión <span className="text-red-600">*</span>
				</Label>
				<div className="mt-1 text-sm text-gray-900">{versionTitle}</div>
			</div>
			{collaborators.length > 0 && (
				<div>
					<Label className="text-sm font-bold">
						Colaboradores del proyecto <span className="text-red-600">*</span>
					</Label>
					<ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-900">
						{collaborators.map((c) => (
							<li key={c.id}>
								{c.name} - {c.email}
							</li>
						))}
					</ul>
				</div>
			)}
			<div>
				<Label htmlFor="verifier" className="text-sm font-bold">
					Verificador <span className="text-red-600">*</span>
				</Label>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Seleccione un usuario verificador para realizar la verificación
				</p>
				{isLoadingVerifiers ? (
					<div className="mt-1 text-sm text-muted-foreground">
						Cargando verificadores...
					</div>
				) : (
					<Select
						value={selectedVerifierId}
						onValueChange={(v) => {
							setSelectedVerifierId(v);
							setError(null);
						}}
					>
						<SelectTrigger id="verifier" className="mt-1">
							<SelectValue placeholder="Seleccione un verificador" />
						</SelectTrigger>
						<SelectContent>
							{verifiers.map((v) => (
								<SelectItem key={v.id} value={v.id}>
									{v.name} {v.lastName} - {v.email}
								</SelectItem>
							))}
							{verifiers.length === 0 && (
								<div className="px-2 py-2 text-sm text-muted-foreground">
									No hay verificadores activos
								</div>
							)}
						</SelectContent>
					</Select>
				)}
			</div>
			<div className="flex justify-end border-t pt-4">
				<Button
					onClick={handleAssign}
					disabled={isSubmitting || !selectedVerifierId || isLoadingVerifiers}
				>
					{isSubmitting ? "Asignando..." : "ASIGNAR"}
				</Button>
			</div>
		</div>
	);
}
