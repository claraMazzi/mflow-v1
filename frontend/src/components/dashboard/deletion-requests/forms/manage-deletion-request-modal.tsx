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
	const [denyReason, setDenyReason] = useState("");
	const [action, setAction] = useState<"approve" | "deny" | null>(null);

	const handleApprove = async () => {
		if (!session?.user?.id) return;

		setIsLoading(true);
		try {
			const result = await approveDeletionRequest({
				deletionRequestId: deletionRequest.id,
				reviewer: session.user.id,
			});

			if (result.success) {
				onSuccess();
				closeModal();
			} else {
				console.error("Error approving deletion request:", result.error);
			}
		} catch (error) {
			console.error("Error approving deletion request:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeny = async () => {
		if (!session?.user?.id) return;

		setIsLoading(true);
		try {
			const result = await denyDeletionRequest({
				deletionRequestId: deletionRequest.id,
				reviewer: session.user.id,
				reason: denyReason,
			});

			if (result.success) {
				onSuccess();
				closeModal();
			} else {
				console.error("Error denying deletion request:", result.error);
			}
		} catch (error) {
			console.error("Error denying deletion request:", error);
		} finally {
			setIsLoading(false);
		}
	};
	if (action === "deny") {
		return (
			<div className="flex flex-col justify-start gap-4 p-4">
				<p className="text-base font-bold">Denegar solicitud de eliminación</p>
				<div className="space-y-2">
					<Label htmlFor="deny-reason" className="text-sm font-medium">
						Motivo de la denegación
					</Label>
					<Textarea
						id="deny-reason"
						placeholder="Ingrese el motivo de la denegación..."
						value={denyReason}
						onChange={(e) => setDenyReason(e.target.value)}
						rows={3}
					/>
				</div>

				<div className="flex justify-center space-x-3 mt-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setAction(null)}
						disabled={isLoading}
					>
						Cancelar
					</Button>
					<Button size="sm" onClick={handleDeny} disabled={isLoading}>
						{isLoading ? "Denegando..." : "Confirmar"}
					</Button>
				</div>
			</div>
		);
	}

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
						Cancelar
					</Button>
					<Button size="sm" onClick={handleApprove} disabled={isLoading}>
						{isLoading ? "Aprobando..." : "Confirmar"}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<div>
					<Label htmlFor="project-name" className="text-sm font-bold">
						Nombre del proyecto <small className="text-red-600">*</small>
					</Label>
					<div className="mt-1 text-sm text-gray-900">
						{deletionRequest.project.title}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="requesting-user" className="text-sm font-bold">
							Usuario Solicitante <small className="text-red-600">*</small>
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{deletionRequest.requestingUser.name}{" "}
							{deletionRequest.requestingUser.lastName} -{" "}
							{deletionRequest.requestingUser.email}
						</div>
					</div>

					<div>
						<Label htmlFor="project-owner" className="text-sm font-bold">
							Dueño del proyecto <small className="text-red-600">*</small>
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							{deletionRequest.project.owner.name}{" "}
							{deletionRequest.project.owner.lastName} -{" "}
							{deletionRequest.project.owner.email}
						</div>
					</div>
				</div>
				{deletionRequest.project.collaborators.length > 0 && (
					<div>
						<Label htmlFor="collaborators" className="text-sm font-bold">
							Colaboradores del proyecto{" "}
							<small className="text-red-600">*</small>
						</Label>
						<div className="mt-1 text-sm text-gray-900">
							<ul className="list-disc list-inside space-y-1">
								{deletionRequest.project.collaborators.map((collaborator) => (
									<li key={collaborator.id}>
										{collaborator.name} {collaborator.lastName} -{" "}
										{collaborator.email}
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				<div>
					<Label htmlFor="motive" className="text-sm font-bold">
						Motivo de la solicitud de eliminación{" "}
						<small className="text-red-600">*</small>
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

			<div className="flex justify-center space-x-3 pt-4 border-t">
				<Button
					onClick={() => setAction("deny")}
					disabled={isLoading || action === "deny"}
				>
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
