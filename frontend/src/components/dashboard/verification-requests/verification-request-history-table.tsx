"use client";

import type { FinalizedVerifierRequest } from "#types/verification-request";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@components/ui/table";

interface VerificationRequestHistoryTableProps {
	finalizedRequests: FinalizedVerifierRequest[];
}

export function VerificationRequestHistoryTable({
	finalizedRequests,
}: VerificationRequestHistoryTableProps) {
	if (!finalizedRequests?.length) {
		return (
			<p className="text-muted-foreground">
				No hay historial de solicitudes de verificador finalizadas.
			</p>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader className="bg-gray-200 hover:bg-gray-200">
					<TableRow>
						<TableHead className="font-semibold text-foreground">
							Nombre de la versión
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Usuario Solicitante
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Verificador asignado
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Revisor
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="bg-white">
					{finalizedRequests.map((request) => (
						<TableRow key={request.id} className="hover:bg-muted/30">
							<TableCell className="font-medium">
								{request.versionTitle}
							</TableCell>
							<TableCell>{request.requestingUser}</TableCell>
							<TableCell>{request.assignedVerifier}</TableCell>
							<TableCell>{request.reviewerName}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
