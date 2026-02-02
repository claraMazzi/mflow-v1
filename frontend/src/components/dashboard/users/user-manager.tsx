import { UserManagementTable } from "@components/dashboard/users/user-managment-table";
import { Button } from "@components/ui/common/button";
import { Plus } from "lucide-react";
import { DashboardPageSkeleton } from "@components/dashboard/dashboard-page-skeleton";
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
    return <DashboardPageSkeleton />;
  }

  return (
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
