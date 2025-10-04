

  export type Role = {
    name: string;
    roleId: "modelador" | "admin" | "verificador";
    logo: React.ElementType;
  };

  export type MenuItem = {
    title: string;
    icon: React.ReactNode;
    slug: string;
    activeColor: string;
    items?: MenuItem[];
  };
  
  export type SidebarMenu = {
    modelador: MenuItem[];
    admin: MenuItem[];
    verificador: MenuItem[];
  };
  
  