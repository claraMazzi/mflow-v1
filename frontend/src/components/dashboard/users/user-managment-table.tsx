import type { User } from "#types/user";
import { Badge } from "@components/ui/common/badge";
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
import { ModifyUserForm } from "./forms/modify-user-form";

interface UserManagementTableProps {
  users?: User[];
  refreshUsers : () => void;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "MODELADOR":
      return "bg-bordo-100 !text-bordo-500 border border-bordo-500 hover:bg-bordo-200";
    case "ADMIN":
    case "ADMINISTRADOR":
      return "bg-blue-100 !text-blue-500 border border-blue-500 hover:bg-blue-200";
    case "VERIFICADOR":
      return "bg-green-100 !text-green-800 border border-green-500 hover:bg-green-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "MODELADOR":
      return "Modelador";
    case "VERIFICADOR":
      return "Verificador";
    default:
      return role;
  }
};

export function UserManagementTable({ users, refreshUsers }: UserManagementTableProps) {
  const { openModal } = useUI();

  const handleModifyUser = (user: User) => {
    openModal({
      name: "fullscreen-modal",
      title: "Modificar Usuario",
      size: "md",
      showCloseButton: false,
      content: (
        <ModifyUserForm
          onSuccess={() => {
            refreshUsers();
          }}
          user={user}
        />
      ),
    });
  };

  if (!users || !users.length) return <p>No se han encontrado usuarios.</p>;
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-foreground">
              Nombre
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Email
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Roles
            </TableHead>
            <TableHead className="font-semibold text-foreground text-center">
              Gestionar Roles
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">
                {user.name} {user.lastName}
              </TableCell>
              <TableCell className="">
                {user.email}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((role) => (
                    <Badge
                      key={role}
                      color="black"
                      className={getRoleBadgeVariant(role)}
                    >
                      {getRoleDisplayName(role)}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-center flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 !p-0 hover:bg-muted"
                  onClick={() => handleModifyUser(user)}
                >
                  <Edit className="h-4 w-4"  />
                  <span className="sr-only">Editar roles de {user.name}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
