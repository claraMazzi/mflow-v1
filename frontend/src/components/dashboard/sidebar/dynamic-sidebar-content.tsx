import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/ui/common/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@src/components/dashboard/sidebar/sidebar";
import { getMenuItemsByRole } from "@components/dashboard/navigation";
import { useEffect, useState } from "react";

type Team = {
  name: string;
  role: "modelador" | "admin" | "verificador";
  logo: React.ElementType;
};

type DynamicSidebarContentProps = {
  activeTeam: Team;
  userRoles?: string[];
  activeRole: string;
};

export function DynamicSidebarContent({
  activeTeam,
  userRoles,
  activeRole,
}: DynamicSidebarContentProps) {
  const [items, setItems] = useState(getMenuItemsByRole("modelador"));
  const userHasRole = (userRoles || []).includes(activeRole.toUpperCase());

  useEffect(() => {
    const items = userHasRole
      ? getMenuItemsByRole(activeRole)
      : getMenuItemsByRole("modelador");
    setItems(items);
  }, [activeRole]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={true}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            // onClick={() => onMenuItemClick(`${item.title} - ${subItem.title}`)}
                          >
                            <a href={subItem.slug}>
                              {subItem.icon}

                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton
                // onClick={() => onMenuItemClick(item.title)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
