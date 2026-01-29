"use client";

import type { PendingVerifierRequest } from "#types/verification-request";
import { Button } from "@components/ui/common/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@components/ui/table";
import { Edit } from "lucide-react";
import { useUI } from "@components/ui/context";
import { AssignVerifierModal } from "./forms/assign-verifier-modal";

interface VerificationRequestManagementTableProps {
	pendingRequests: PendingVerifierRequest[];
	refreshVerificationRequests: () => void;
}

export function VerificationRequestManagementTable({
	pendingRequests,
	refreshVerificationRequests,
}: VerificationRequestManagementTableProps) {
	const { openModal } = useUI();

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear().toString().slice(-2);
		return `${day}/${month}/${year}`;
	};

	const handleManage = (request: PendingVerifierRequest) => {
		openModal({
			name: "fullscreen-modal",
			title: "Asignar un verificador a la revisión",
			size: "lg",
			showCloseButton: true,
			content: (
				<AssignVerifierModal
					verifierRequestId={request.id}
					onSuccess={() => {
						refreshVerificationRequests();
					}}
				/>
			),
		});
	};

	if (!pendingRequests?.length) {
		return (
			<p className="text-muted-foreground">
				No se han encontrado solicitudes de asignación de verificador pendientes.
			</p>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader className="bg-gray-200 hover:bg-gray-200">
					<TableRow>
						<TableHead className="font-semibold text-foreground">
							Nombre del Proyecto
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Título de la versión
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Usuario Solicitante
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Dueño del Proyecto
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Fecha de solicitud
						</TableHead>
						<TableHead className="font-semibold text-foreground text-center">
							Gestionar
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="bg-white">
					{pendingRequests.map((request) => (
						<TableRow key={request.id} className="hover:bg-muted/30">
							<TableCell className="font-medium">{request.projectName}</TableCell>
							<TableCell className="font-medium">{request.versionTitle}</TableCell>
							<TableCell>
								{request.requestingUser?.name ?? "—"}
							</TableCell>
							<TableCell>{request.projectOwnerName || "—"}</TableCell>
							<TableCell className="font-medium">
								{formatDate(request.createdAt)}
							</TableCell>
							<TableCell className="text-center">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 !p-0 hover:bg-muted"
									onClick={() => handleManage(request)}
								>
									<Edit className="h-4 w-4" />
									<span className="sr-only">
										Gestionar solicitud de {request.versionTitle}
									</span>
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
