"use client";

import * as React from "react";
import { DynamicSidebarContent } from "./dynamic-sidebar-content";
import { RoleSwitcher } from "./role-switcher";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@components/dashboard/sidebar/sidebar";
import { TooltipProvider } from "@components/ui/tooltip";
import { useSession } from "next-auth/react";
import { getActiveSidebarOption, getUserRolesItems } from "../navigation";
import { useLayoutActions, useLayoutState } from "@components/global/Context";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Skeleton } from "@components/ui/common/skeleton";
import { useRouter } from "next/navigation";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { activeRole, activeSidebarOption } = useLayoutState();
  const { setActiveRole, setActiveSidebarOption } = useLayoutActions();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Memoize user data to prevent recalculations
  const userData = useMemo(() => {
    if (!session) return null;
    return {
      userName: `${session.user.name} ${session.user.lastName}`,
      avatar:
        session.user.name.charAt(0).toUpperCase() +
        session.user.lastName.charAt(0).toUpperCase(),
      roles: session.user.roles,
      email: session.user.email,
    };
  }, [session]);

  const userRoles = useMemo(() => {
    if (!userData?.roles) return [];
    return getUserRolesItems(userData.roles);
  }, [userData?.roles]);

  // Memoize role change handler to prevent re-renders
  const handleRoleChange = useCallback((role: string) => {
    setActiveRole(role);
    setActiveSidebarOption(getActiveSidebarOption("", role));
    router.push("/dashboard");
  }, [setActiveRole, setActiveSidebarOption, router]);

  if (isLoading) {
    return <Skeleton className="h-screen w-64" />;
  }

  if (!session || !userData) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
          } as React.CSSProperties
        }
        className="group/sidebar-wrapper flex min-h-svh has-[[data-variant=inset]]:bg-sidebar"
        {...props}
      >
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader>
            <RoleSwitcher
              userRoles={userRoles}
              onRoleChange={handleRoleChange}
              activeRoleId={activeRole}
            />
          </SidebarHeader>
          <SidebarContent>
            <DynamicSidebarContent
              userRoles={userData.roles}
              activeRole={activeRole}
              activeSidebarOption={activeSidebarOption}
            />
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              name={userData.userName}
              email={userData.email}
              avatar={userData.avatar}
            />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
      </div>
    </TooltipProvider>
  );
}
