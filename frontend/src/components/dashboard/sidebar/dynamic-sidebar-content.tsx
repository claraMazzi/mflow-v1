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
} from "@components/dashboard/sidebar/sidebar";
import { getMenuItemsByRole } from "@components/dashboard/navigation";
import { useEffect, useState } from "react";
import cn from "clsx";
type Team = {
  name: string;
  role: "modelador" | "admin" | "verificador";
  logo: React.ElementType;
};

type DynamicSidebarContentProps = {
  activeTeam: Team;
  userRoles?: string[];
  activeRole: string;
  activeSidebarOption: string;
};

export function DynamicSidebarContent({
  activeSidebarOption,
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
                    <SidebarMenuButton
                      className={cn(
                        activeSidebarOption === item.title
                          ? "bg-purple-400 hover:text-white hover:bg-purple-500 text-white"
                          : ""
                      )}
                    >
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
                            className={cn(
                              activeSidebarOption === subItem.title
                                ? "bg-purple-400 hover:bg-purple-500 hover:text-white text-white"
                                : ""
                            )}
                          >
                            <a
                              href={subItem.slug}
                              className={cn(
                                activeSidebarOption === subItem.title
                                  ? "bg-purple-400 hover:bg-purple-500 hover:text-white text-white"
                                  : ""
                              )}
                            >
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
                  className={cn(
                    activeSidebarOption === item.title
                      ? "bg-purple-400  hover:bg-purple-500 hover:text-white text-white"
                      : ""
                  )}
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
