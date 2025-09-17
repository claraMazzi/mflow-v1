import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StaticColor } from "@components/ui/common/badge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRoleBadgeVariant = (role: string): StaticColor => {
  switch (role) {
    case "MODELADOR":
      return "bordo";
    case "ADMIN":
      return "light-blue";
    case "VERIFICADOR":
      return "light-green";
    default:
      return "light-blue";
  }
};

export const getRoleDisplayName = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "MODELADOR":
      return "Modelador";
    case "VERIFICADOR":
      return "Verificador";
    default:
      return role;
  }
};
