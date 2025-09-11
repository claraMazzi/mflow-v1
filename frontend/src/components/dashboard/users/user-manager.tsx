import { getUsers } from "./actions/get-users";
import { UserManagementTable } from "@components/dashboard/users/user-managment-table";
import { Button } from "@components/ui/common/button";
import { User } from "#types/user";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@components/ui/skeleton";
import { useUsers } from "@hooks/use-users";
import { useUI } from "@components/ui/context";
import { InviteUserForm } from "./forms/invite-user-form";

export default function UserManager() {
  const { users, isLoading, refreshUsers } = useUsers();
  const { openModal } = useUI();
  const handleInviteUser = () => {
    openModal({
      name: "fullscreen-modal",
      title: "Modificar Usuario",
      size: "lg",
      showCloseButton: false,
      content: <InviteUserForm />,
    });
  };

  if (isLoading) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    // <div className="w-full flex flex-col gap-4">
    //   <div className="flex items-center justify-between mb-8">
    //     <h1 className="text-3xl font-bold text-foreground">
    //       Gestionar Usuarios
    //     </h1>
    //     <Button className="bg-slate-600 hover:bg-slate-700 text-white">
    //       <Plus className="mr-2 h-4 w-4" />
    //       INVITAR USUARIO
    //     </Button>
    //   </div>
    //   <div>
    //     {users && users.length > 0 ? (
    //       <UserManagementTable users={users} />
    //     ) : (
    //       <p>No users found. {error}</p>
    //     )}
    //   </div>
    // </div>

    <div className="w-full flex flex-col gap-4">
      <div className="flex w-full justify-between border-b border-accent-100 py-2">
        <h1 className="text-2xl font-bold"> Gestionar Usuarios</h1>
        <Button className="uppercase" onClick={handleInviteUser}>
          <Plus />
          Invitar usuarios{" "}
        </Button>
      </div>
      <UserManagementTable users={users} refreshUsers={refreshUsers} />
    </div>
  );
}
