"use client";
import { DeletionRequestManagementTable } from "@components/dashboard/deletion-requests/deletion-request-management-table";
import { Skeleton } from "@components/ui/skeleton";
import { useDeletionRequests } from "@hooks/use-deletion-requests";

export default function DeletionRequestManager() {
  const { deletionRequests, isLoading, refreshDeletionRequests } = useDeletionRequests();

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold">Gestionar Solicitudes de Eliminación</h1>
      </div>
      <DeletionRequestManagementTable 
        deletionRequests={deletionRequests || []} 
        refreshDeletionRequests={refreshDeletionRequests} 
      />
    </div>
  );
}
