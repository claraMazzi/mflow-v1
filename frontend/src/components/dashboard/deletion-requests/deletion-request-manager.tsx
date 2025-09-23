"use client";
import { DeletionRequestManagementTable } from "@components/dashboard/deletion-requests/deletion-request-management-table";
import { DeletionRequestHistoryTable } from "@components/dashboard/deletion-requests/deletion-request-history-table";
import { Skeleton } from "@components/ui/skeleton";
import { useDeletionRequests } from "@hooks/use-deletion-requests";

export default function DeletionRequestManager() {
  const { deletionRequests, isLoading, refreshDeletionRequests } = useDeletionRequests();

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold">Gestionar Solicitudes de Eliminación</h1>
      </div>
      
      {/* Pending Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Solicitudes Pendientes</h2>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {(deletionRequests || []).filter(req => req.state === "PENDIENTE").length}
          </span>
        </div>
        <DeletionRequestManagementTable 
          deletionRequests={deletionRequests || []} 
          refreshDeletionRequests={refreshDeletionRequests} 
        />
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Historial de Solicitudes</h2>
          <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {(deletionRequests || []).filter(req => req.state === "ACEPTADA" || req.state === "RECHAZADA").length}
          </span>
        </div>
        <DeletionRequestHistoryTable 
          deletionRequests={deletionRequests || []} 
        />
      </div>
    </div>
  );
}
