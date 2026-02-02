import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/ui/common/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@components/dashboard/sidebar/sidebar";
import { getMenuItemsByRole } from "@components/dashboard/navigation";
import { useMemo, memo } from "react";
import cn from "clsx";
import Link from "next/link";

type DynamicSidebarContentProps = {
  userRoles?: string[];
  activeRole: string;
  activeSidebarOption: string;
};

export const DynamicSidebarContent = memo(function DynamicSidebarContent({
  activeSidebarOption,
  userRoles,
  activeRole,
}: DynamicSidebarContentProps) {
  const userHasRole = (userRoles || []).includes(activeRole.toUpperCase());

  // Memoize menu items to prevent unnecessary recalculations
  const items = useMemo(() => {
    return userHasRole
      ? getMenuItemsByRole(activeRole)
      : getMenuItemsByRole("modelador");
  }, [activeRole, userHasRole]);

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
                            className={cn(
                              activeSidebarOption === subItem.title
                                ? "bg-purple-400 hover:bg-purple-500 hover:text-white text-white"
                                : ""
                            )}
                          >
                            <Link
                              href={subItem.slug}
                              className={cn(
                                activeSidebarOption === subItem.title
                                  ? "bg-purple-400 hover:bg-purple-500 hover:text-white text-white"
                                  : ""
                              )}
                            >
                              <div className="w-12">{subItem.icon}</div>

                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton
                  isActive={activeSidebarOption === item.title}
                >
                  <Link href={item.slug} className="flex gap-2">
                    <div className="">{item.icon}</div>

                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
});
