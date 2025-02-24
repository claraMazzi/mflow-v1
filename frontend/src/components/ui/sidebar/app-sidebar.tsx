"use client"

import * as React from "react"
import { FolderOpen, Share2, Users } from "lucide-react"

import { DynamicSidebarContent } from "./dynamic-sidebar-content"
import { TeamSwitcher } from "./team-switcher"
import { NavUser } from "./nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar/sidebar"

type Team = {
  name: string
  role: "modelador" | "admin" | "verificador"
  logo: React.ElementType
}

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
}

export function AppSidebar({
  onMenuItemClick,
  ...props
}: React.ComponentProps<typeof Sidebar> & { onMenuItemClick: (item: string) => void }) {
  const [activeTeam, setActiveTeam] = React.useState(data.teams[0])

  const handleTeamChange = (team: Team) => {
    setActiveTeam(team)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} onTeamChange={handleTeamChange} />
      </SidebarHeader>
      <SidebarContent>
        <DynamicSidebarContent activeTeam={activeTeam} onMenuItemClick={onMenuItemClick} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

