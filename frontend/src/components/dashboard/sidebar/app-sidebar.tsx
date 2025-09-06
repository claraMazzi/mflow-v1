"use client";

import * as React from "react";
import { FolderOpen, Share2, Users } from "lucide-react";

import { DynamicSidebarContent } from "./dynamic-sidebar-content";
import { TeamSwitcher } from "./team-switcher";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@components/dashboard/sidebar/sidebar";
import { TooltipProvider } from "@components/ui/tooltip";
import { Team } from "#types/common";
import { useSession } from "next-auth/react";
import { getUserRolesTeamItems } from "../navigation";
import { useLayoutActions, useLayoutState } from "@components/global/Context";
import { useState, useEffect } from "react";
import { Skeleton } from "@components/ui/common/skeleton";

// This is sample data.
const data = {
  user: {
    name: "John Doe",
    email: "john@example.com",
    avatar: "/avatars/john-doe.jpg",
  },
  teams: [
    {
      name: "Modelador Team",
      role: "modelador",
      logo: FolderOpen,
    },
    {
      name: "Admin Team",
      role: "admin",
      logo: Users,
    },
    {
      name: "Verificador Team",
      role: "verificador",
      logo: Share2,
    },
  ] as Team[],
};
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";

export function AppSidebar({
  ...props
}: 
React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { activeRole, activeSidebarOption } = useLayoutState();
  const { setActiveRole } = useLayoutActions();
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(false)
  
  }, [])

  if (isLoading)  {
    return <Skeleton className='h-screen w-64' />
  }
  
  if (!session) {
    return <></>;
  }

  const userName = `${session?.user.name} ${session?.user.lastName}`;
  const avatar =
    session?.user.name.charAt(0).toUpperCase() +
    session?.user.lastName.charAt(0).toUpperCase();
  const roles = session?.user.roles;
  const userTeams = getUserRolesTeamItems(roles);


  const handleTeamChange = (role: string) => {
    setActiveRole(role);
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            // ...style,
          } as React.CSSProperties
        }
        className="group/sidebar-wrapper flex min-h-svh has-[[data-variant=inset]]:bg-sidebar"
        {...props}
      >
        <Sidebar collapsible="icon" {...props}>
          <SidebarHeader>
            <TeamSwitcher teams={userTeams} onTeamChange={handleTeamChange} activeRole={activeRole}/>
          </SidebarHeader>
          <SidebarContent>
            <DynamicSidebarContent activeTeam={activeRole} userRoles={roles} activeRole={activeRole} activeSidebarOption={activeSidebarOption} />
          </SidebarContent>
          <SidebarFooter>
            <NavUser
              name={userName}
              email={session?.user.email}
              avatar={avatar}
            />
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
      </div>
    </TooltipProvider>
  );
}
