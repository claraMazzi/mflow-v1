"use client";

import { Bell, ChevronsUpDown, LogOut, Sparkles, X } from "lucide-react";
import { useUI } from "@components/ui/context";
import { Avatar, AvatarFallback } from "@components/ui/common/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/common/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@components/dashboard/sidebar/sidebar";
import LogoutButton from "@components/auth/logout-button";
import { getLoggedUser } from "@components/dashboard/users/actions/get-users";
import { User } from "#types/user";
import { useState, useEffect } from "react";
import { ModifyUserForm, ModifyUserFormData } from "@components/dashboard/users/forms/modify-user-form";
import { modifyUserData } from "@components/dashboard/users/actions/modify-user";
import { DeleteUserForm } from "@components/dashboard/users/forms/delete-user-form";
import { deleteUserData } from "@components/dashboard/users/actions/delete-user";
import { useSession } from "next-auth/react";

export function NavUser({
  name,
  email,
  avatar,
}: {
  name: string;
  email: string;
  avatar: string;
}) {
  const { openModal, closeModal } = useUI();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDetails, setuserDetails] = useState<User>();
  const { data: session, update } = useSession();

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await getLoggedUser();
      if (response.success && response.data.user) {
        setuserDetails(response.data.user as User);
      }
    };

    fetchUserData();
  }, []);

  const updateSession = async (form: ModifyUserFormData) =>{
    console.log('update', form)

      await update({
        user: {
          ...session?.user,
          name: form.name,
          lastName: form?.lastName,
        },
      });
  }

  const onSuccess = (form?: ModifyUserFormData) =>{ 
    console.log('on success', form)
    if (form)
    updateSession(form)
  }

  const onDeleteSuccess = () => {
    // Close the modal and redirect to logout or home
    closeModal();
    // You might want to redirect to logout or show a message
    window.location.href = '/login';
  }

  const handleEditUser = () => {
    if (userDetails){
      setDropdownOpen(false);

    openModal({
      name: "fullscreen-modal",
      title: "Modificar Usuario",
      size: "lg",
      showCloseButton: false,
      content: (
        <ModifyUserForm
          disableFieldsMapping={{
            name: false,
            lastName: false,
            email: true,
            roles: true,
          }}
          formActionCallback={modifyUserData}
          user={userDetails}
          onSuccess={onSuccess}
        />
      ),
    });

}
  };

  const handleDeleteUser = () => {
    if (userDetails) {
      setDropdownOpen(false);

      openModal({
        name: "fullscreen-modal",
        title: "Eliminar Usuario",
        size: "md",
        showCloseButton: false,
        content: (
          <DeleteUserForm
            user={userDetails}
            formActionCallback={deleteUserData}
            onSuccess={onDeleteSuccess}
          />
        ),
      });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{avatar}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={"right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* <AvatarImage src={avatar} alt={name} /> */}
                  <AvatarFallback className="rounded-lg">
                    {avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Bell />
                Notificaciones
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditUser}>
                <Sparkles />
                Editar usuario
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeleteUser}>
                <X />
                Eliminar cuenta
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogoutButton
                className="w-full"
                variant="outline"
                label={
                  <>
                    <LogOut />
                    Cerrar sesión
                  </>
                }
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
