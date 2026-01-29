"use client";

import { VerificationRequestManagementTable } from "@components/dashboard/verification-requests/verification-request-management-table";
import { VerificationRequestHistoryTable } from "@components/dashboard/verification-requests/verification-request-history-table";
import { Skeleton } from "@components/ui/skeleton";
import { useVerificationRequests } from "@hooks/use-verification-requests";

export default function VerificationRequestManager() {
	const {
		pendingRequests,
		finalizedRequests,
		isLoading,
		error,
		refreshVerificationRequests,
	} = useVerificationRequests();

	if (isLoading) {
		return <Skeleton className="h-screen w-full" />;
	}

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="flex w-full justify-between border-b border-accent-100 py-2">
				<h1 className="text-2xl font-bold">
					Gestionar Solicitudes de Asignación de Verificador
				</h1>
			</div>
			{error && (
				<p className="text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
			{/* Pending requests */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h2 className="text-xl font-semibold">PENDIENTE</h2>
					<span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
						{pendingRequests.length}
					</span>
				</div>
				<VerificationRequestManagementTable
					pendingRequests={pendingRequests}
					refreshVerificationRequests={refreshVerificationRequests}
				/>
			</div>
			{/* History */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<h2 className="text-xl font-semibold">
						Historial de solicitudes finalizadas
					</h2>
					<span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
						{finalizedRequests.length}
					</span>
				</div>
				<VerificationRequestHistoryTable finalizedRequests={finalizedRequests} />
			</div>
		</div>
	);
}
