"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DeletionRequest } from "#types/deletion-request";
import { Button } from "@components/ui/common/button";
import { Textarea } from "@components/ui/common/textarea";
import { Label } from "@components/ui/common/label";
import { ExternalLink } from "lucide-react";
import { approveDeletionRequest } from "../actions/approve-deletion-request";
import { denyDeletionRequest } from "../actions/deny-deletion-request";
import { useUI } from "@components/ui/context";
import Link from "next/link";
import { formatDate } from "@src/lib/utils";

interface ManageDeletionRequestModalProps {
	deletionRequest: DeletionRequest;
	onSuccess: () => void;
}

export function ManageDeletionRequestModal({
	deletionRequest,
	onSuccess,
}: ManageDeletionRequestModalProps) {
	const { data: session } = useSession();
	const { closeModal } = useUI();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [action, setAction] = useState<"approve" | null>(null);

	const handleApprove = async () => {
		if (!session?.user?.id) return;

		setIsLoading(true);
		setError(null);
		try {
			const result = await approveDeletionRequest({
				deletionRequestId: deletionRequest.id,
			});

			if (result.success) {
				onSuccess();
				closeModal();
			} else {
				console.error("Error approving deletion request:", result.error);
				setError(result.error!);
			}
		} catch (error) {
			console.error("Error approving deletion request:", error);
			setError(
				"Ha ocurrido un error al aprobar la solicitud. Por favor, inténtelo de nuevo más tarde.",
			);
		} finally {
			setAction(null);
			setIsLoading(false);
		}
	};

	const handleDeny = async () => {
		if (!session?.user?.id) return;

		setIsLoading(true);
		setError(null);
		try {
			const result = await denyDeletionRequest({
				deletionRequestId: deletionRequest.id,
			});

			if (result.success) {
				onSuccess();
				closeModal();
			} else {
				console.error("Error denying deletion request:", result.error);
				setError(result.error!);
			}
		} catch (error) {
			console.error("Error denying deletion request:", error);
			setError(
				"Ha ocurrido un error al denegar la solicitud. Por favor, inténtelo de nuevo más tarde.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (action === "approve") {
		return (
			<div className="flex max-w-md flex-col mx-auto justify-center items-center p-4">
				<p className="text-sm text-center">
					¿Está seguro de que desea aprobar esta solicitud de eliminación? Esta
					acción no se puede deshacer.
				</p>
				<div className="flex justify-end space-x-3 mt-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setAction(null)}
						disabled={isLoading}
					>
						CANCELAR
					</Button>
					<Button size="sm" onClick={handleApprove} disabled={isLoading}>
						{isLoading ? "APROBANDO..." : "CONFIRMAR"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-3xl font-medium text-center">Gestionar solicitud</h2>

			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="project-name" className="text-sm font-bold">
							Fecha de solicitud
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{formatDate(deletionRequest.registeredAt)}
						</div>
					</div>

					<div>
						<Label htmlFor="project-name" className="text-sm font-bold">
							Nombre del proyecto
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{deletionRequest.project.title}
						</div>
					</div>

					<div>
						<Label htmlFor="requesting-user" className="text-sm font-bold">
							Usuario Solicitante
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{deletionRequest.requestingUser.name}{" "}
							{deletionRequest.requestingUser.lastName} -{" "}
							{deletionRequest.requestingUser.email}
						</div>
					</div>

					<div>
						<Label htmlFor="project-owner" className="text-sm font-bold">
							Dueño del proyecto
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{deletionRequest.project.owner.name}{" "}
							{deletionRequest.project.owner.lastName} -{" "}
							{deletionRequest.project.owner.email}
						</div>
					</div>
				</div>
				{deletionRequest.project.collaborators.length > 0 ? (
					<div>
						<Label htmlFor="collaborators" className="text-sm font-bold">
							Colaboradores del proyecto{" "}
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							<ul className="list-disc list-inside space-y-1">
								{deletionRequest.project.collaborators.map((collaborator) => (
									<li key={collaborator._id}>
										{collaborator.name} {collaborator.lastName} -{" "}
										{collaborator.email}
									</li>
								))}
							</ul>
						</div>
					</div>
				) : (
					<div>
						<Label htmlFor="collaborators" className="text-sm font-bold">
							Colaboradores del proyecto{" "}
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							Este proyecto no tiene colaboradores
						</div>
					</div>
				)}

				<div>
					<Label htmlFor="motive" className="text-sm font-bold">
						Motivo de la solicitud de eliminación{" "}
					</Label>
					<div className="mt-1 p-3 bg-gray-50 rounded-md">
						<p className="text-sm text-gray-700 whitespace-pre-wrap">
							{deletionRequest.motive}
						</p>
					</div>
				</div>

				<div>
					<Link
						href={`/dashboard/projects/${deletionRequest.project._id}/versions`}
						target="_blank"
						className="flex items-center text-purple-600 hover:text-purple-700 p-0 h-auto"
					>
						<ExternalLink className="h-4 w-4 mr-2" />
						Ver Proyecto
					</Link>
				</div>
			</div>

			{error && (
				<p className="text-sm text-red-600" role="alert">
					{error}
				</p>
			)}

			<div className="flex justify-center space-x-3 pt-4 border-t">
				<Button onClick={handleDeny} disabled={isLoading || action === "deny"}>
					DENEGAR
				</Button>

				<Button
					onClick={() => setAction("approve")}
					disabled={isLoading || action === "approve"}
					variant="outline"
				>
					ACEPTAR
				</Button>
			</div>
		</div>
	);
}
