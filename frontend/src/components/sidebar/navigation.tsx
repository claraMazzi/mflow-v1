import {
  FolderOpen,
  Share2,
  Users,
  Trash2,
  CheckSquare,
  ClipboardList,
  LucideIcon,
} from "lucide-react";

export type MenuItem = {
  title: string;
  icon: LucideIcon;
  slug: string;
  items?: {
    title: string;
    slug: string;
  }[];
};

export type SidebarMenu = {
  modelador: MenuItem[];
  admin: MenuItem[];
  verificador: MenuItem[];
};

export const navigation: SidebarMenu = {
  modelador: [
    { title: "My Projects", icon: FolderOpen, slug: "/projects" },
    {
      title: "Shared with me",
      icon: Share2,
      slug: "/shared-with-me",
      items: [
        { title: "Projects", slug: "/shared-with-me/projects" },

        { title: "Artifacts", slug: "/shared-with-me/artifacts" },
      ],
    },
  ],
  admin: [
    { title: "Users", icon: Users, slug: "/users" },
    { title: "Deletion Requests", icon: Trash2, slug: "/deletion-requests" },
    {
      title: "Verification Requests",
      icon: CheckSquare,
      slug: "/verification-requests",
    },
  ],
  verificador: [
    { title: "Pending Reviews", icon: ClipboardList, slug: "/pending-reviews" },
    { title: "Ongoing Reviews", icon: ClipboardList, slug: "/ongoing-reviews" },
    {
      title: "Completed Reviews",
      icon: ClipboardList,
      slug: "/completed-reviews",
    },
  ],
};

export const getActiveSidebarOption = (
  pathname: string,
  role: string
): string => {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return "/dashboard/";
  }

  if (!role) {
    return "";
  }

  const menu = navigation[role as keyof SidebarMenu];

  // First, try to find a direct match at the top level
  for (const item of menu) {
    if (pathname.includes(item.slug)) {
      return item.slug;
    }

    // Then, check sub-items if available
    if (item.items) {
      const subItem = item.items.find((sub) => pathname.includes(sub.slug));
      if (subItem) {
        return subItem.slug;
      }
    }
  }
  return "";
};
