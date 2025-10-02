"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { Role } from "#types/common";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@components/ui/common/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@components/dashboard/sidebar/sidebar";
import { useState } from "react";

type RoleSwitcherProps = {
	userRoles: Role[];
	activeRoleId: string;
	onRoleChange: (roleId: string) => void;
};

export function RoleSwitcher({
	userRoles,
	activeRoleId,
	onRoleChange,
}: RoleSwitcherProps) {
	const activeRole =
		userRoles.find(
			(role) => role.roleId.toUpperCase() === activeRoleId.toUpperCase()
		) ?? userRoles[0];
	const handleRoleChange = (role: Role) => {
		onRoleChange(role.roleId);
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							// className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
								<activeRole.logo className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">
									{activeRole.name}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						align="start"
						side={"right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-xs text-muted-foreground">
							Roles
						</DropdownMenuLabel>
						{userRoles.map((role, index) => (
							<DropdownMenuItem
								key={role.name}
								onClick={() => handleRoleChange(role)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-sm border">
									<role.logo className="size-4 shrink-0" />
								</div>
								{role.name}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
