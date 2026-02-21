import type { DeletionRequest } from "#types/deletion-request";
import { Badge, StaticColor } from "@components/ui/common/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@components/ui/table";

interface DeletionRequestHistoryTableProps {
	deletionRequests: DeletionRequest[];
}

export function DeletionRequestHistoryTable({
	deletionRequests,
}: DeletionRequestHistoryTableProps) {
	// Filter approved and denied requests and sort by review date (newest to oldest)
	const historyRequests = deletionRequests
		.filter(
			(request) =>
				request.state === "ACEPTADA" || request.state === "RECHAZADA",
		)
		.sort(
			(a, b) =>
				new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime(),
		);

	// Format date to dd/MM/yy; accepts string, Date, or { $date: string }. Returns "—" if invalid or missing
	const formatDate = (
		value: string | Date | undefined | null | { $date?: string },
	) => {
		if (value == null) return "—";
		const date =
			value instanceof Date
				? value
				: new Date(
						typeof value === "string"
							? value
							: ((value as { $date?: string })?.$date ?? ""),
					);
		if (Number.isNaN(date.getTime())) return "—";
		const day = date.getDate();
		const month = date.getMonth() + 1;
		const year = date.getFullYear();
		if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year))
			return "—";
		return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
	};

	const getStateBadgeVariant = (state: string): StaticColor => {
		switch (state) {
			case "ACEPTADA":
				return "light-green";
			case "RECHAZADA":
				return "bordo";
			default:
				return "gray";
		}
	};

	const getStateDisplayName = (state: string) => {
		switch (state) {
			case "ACEPTADA":
				return "Aceptada";
			case "RECHAZADA":
				return "Rechazada";
			default:
				return state;
		}
	};

	if (!historyRequests || !historyRequests.length) {
		return <p>No se han encontrado solicitudes de eliminación procesadas.</p>;
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader className="bg-gray-200 hover:bg-gray-200">
					<TableRow>
						<TableHead className="font-semibold text-foreground">
							Fecha de Solicitud
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Fecha de Resolución
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Nombre del Proyecto
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Usuario Solicitante
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Dueño del Proyecto
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Motivo de solicitud
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Estado
						</TableHead>
						<TableHead className="font-semibold text-foreground">
							Revisado por
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody className="bg-white">
					{historyRequests.map((deletionRequest) => (
						<TableRow key={deletionRequest.id} className="hover:bg-muted/30">
							<TableCell className="font-medium">
								{formatDate(deletionRequest.registeredAt)}
							</TableCell>
							<TableCell className="font-medium">
								{formatDate(deletionRequest.reviewedAt)}
							</TableCell>
							<TableCell className="font-medium">
								{deletionRequest.project.title}
							</TableCell>
							<TableCell>
								{`${deletionRequest.requestingUser.name} ${deletionRequest.requestingUser.lastName}`}
							</TableCell>
							<TableCell>
								{`${deletionRequest.project.owner.name} ${deletionRequest.project.owner.lastName}`}
							</TableCell>
							<TableCell className="max-w-xs">
								<div className="truncate">{deletionRequest.motive}</div>
							</TableCell>
							<TableCell>
								<Badge color={getStateBadgeVariant(deletionRequest.state)}>
									{getStateDisplayName(deletionRequest.state)}
								</Badge>
							</TableCell>
							<TableCell>
								{deletionRequest.reviewer
									? `${deletionRequest.reviewer.name} ${deletionRequest.reviewer.lastName}`
									: "N/A"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
