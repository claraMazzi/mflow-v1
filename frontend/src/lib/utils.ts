import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "MODELADOR":
      return "bg-bordo-100 !text-bordo-500 border border-bordo-500 hover:bg-bordo-200";
    case "ADMIN":
    case "ADMINISTRADOR":
      return "bg-blue-100 !text-blue-500 border border-blue-500 hover:bg-blue-200";
    case "VERIFICADOR":
      return "bg-green-100 !text-green-800 border border-green-500 hover:bg-green-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
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