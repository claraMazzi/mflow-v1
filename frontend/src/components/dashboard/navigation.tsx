import { SidebarMenu, Team, MenuItem } from "#types/common";
import {
  FolderOpen,
  Share2,
  Users,
  Trash2,
  CheckSquare,
  ClipboardList,
} from "lucide-react";

export const teamsMap: Team[] = [
  {
    name: "Modelador",
    role: "modelador",
    logo: FolderOpen,
  },
  {
    name: "Administrador",
    role: "admin",
    logo: Users,
  },
  {
    name: "Verificador",
    role: "verificador",
    logo: Share2,
  },
];

export const navigation: SidebarMenu = {
  modelador: [
    {
      title: "Mis Proyectos",
      icon: <FolderOpen />,
      slug: "/dashboard",
      activeColor: "bg-purple-400",
    },
    {
      title: "Compartido conmigo",
      icon: <Share2 />,
      slug: "/dashboard/shared",
      activeColor: "",
      items: [
        {
          title: "Proyectos",
          slug: "/dashboard/shared/projects",
          activeColor: "",
          icon: <FolderOpen />,
        },
        {
          title: "Artefactos",
          slug: "/dashboard/shared/artifacts",
          activeColor: "",
          icon: <FolderOpen />,
        },
      ],
    },
  ],
  admin: [
    { title: "Usuarios", icon: <Users />, slug: "/dashboard", activeColor: "" },
    {
      title: "Solicitudes de eliminación",
      icon: <Trash2 />,
      slug: "/dashboard/deletion-requests",
      activeColor: "",
    },
    {
      title: "Solicitudes de verificación",
      icon: <CheckSquare />,
      slug: "/dashboard/verification-requests",
      activeColor: "",
    },
  ],
  verificador: [
    {
      title: "Revisiones pendientes",
      icon: <ClipboardList />,
      slug: "/dashboard",
      activeColor: "",
    },
    {
      title: "Revisiones en curso",
      icon: <ClipboardList />,
      slug: "/dashboard/ongoing-reviews",
      activeColor: "",
    },
    {
      title: "Revisiones completadas",
      icon: <ClipboardList />,
      slug: "/dashboard/completed-reviews",
      activeColor: "",
    },
  ],
};

export const getMenuItemsByRole = (role: string): MenuItem[] => {
  const rol = role.toLowerCase() as keyof SidebarMenu;
  const menu = navigation[rol];
  if (!menu) {
    return [];
  }
  return menu;
};

export const getActiveSidebarOption = (
  pathname: string,
  role: string
): string => {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    switch (role) {
      case "modelador":
        return "Mis Proyectos";

      case "admin":
        return "Usuarios";

      case "verificador":
        return "Revisiones pendientes";
    }
  }

  if (!role) {
    return "";
  }

  const menu = getMenuItemsByRole(role);

  // First, try to find a direct match at the top level
  for (const item of menu) {
    if (item.slug.includes(pathname)) {
      return item.title;
    }

    // Then, check sub-items if available
    if (item.items) {
      const subItem = item.items.find((sub) => pathname.includes(sub.slug));
      if (subItem) {
        return subItem.title;
      }
    }
  }
  return "";
};

export const getUserRolesTeamItems = (roles: string[]) => {
  const teamItems: Team[] = [];
  roles.forEach((role) => {
    const item = teamsMap.find((team) => team.role === role.toLowerCase());
    if (!item) return;
    teamItems.push(item);
  });

  return teamItems;
};
