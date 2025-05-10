import type React from "react"
import { FolderOpen, Share2, Users, Trash2, CheckSquare, ClipboardList, LucideIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@components/ui/common/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@components/ui/sidebar-ol/sidebar"

type Team = {
  name: string
  role: "modelador" | "admin" | "verificador"
  logo: React.ElementType
}

type DynamicSidebarContentProps = {
  activeTeam: Team
  onMenuItemClick: (item: string) => void
}

type MenuItem = {
    title: string,
    icon: LucideIcon,
    items?: {
        title: string,
        url: string
    }[]
}

type Menu = {
    modelador: MenuItem[],
    admin: MenuItem[],
    verificador: MenuItem[]
}

export function DynamicSidebarContent({ activeTeam, onMenuItemClick }: DynamicSidebarContentProps) {
  const menuItems: Menu = {
    modelador: [
      { title: "My Projects", icon: FolderOpen },
      {
        title: "Shared with me",
        icon: Share2,
        items: [
          { title: "Projects", url: "#" },
          { title: "Artifacts", url: "#" },
        ],
      },
    ],
    admin: [
      { title: "Users", icon: Users },
      { title: "Deletion Requests", icon: Trash2 },
      { title: "Verification Requests", icon: CheckSquare },
    ],
    verificador: [
      { title: "Pending Reviews", icon: ClipboardList },
      { title: "Ongoing Reviews", icon: ClipboardList },
      { title: "Completed Reviews", icon: ClipboardList },
    ],
  }

  const items = menuItems[activeTeam.role]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{activeTeam.name} Panel</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={false} className="group/collapsible">
            <SidebarMenuItem>
              {item.items ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            onClick={() => onMenuItemClick(`${item.title} - ${subItem.title}`)}
                          >
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton onClick={() => onMenuItemClick(item.title)}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

