import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StaticColor } from "@components/ui/common/badge";
import { ConceptualModel } from "#types/conceptual-model";
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

export const parsePropertyPath = (conceptualModel: ConceptualModel, path: string) => {
  const pathParts = path.split(".");
  const parsedPath = [];
  let current: any = conceptualModel;

  for (const part of pathParts) {
    const containsListItemKey = part.includes(":");
    if (containsListItemKey) {
      const [listProperty, itemId] = part.split(":");
      if (!(listProperty in current) || !Array.isArray(current[listProperty])) {
        return undefined;
      }
      const itemIndex = current[listProperty].findIndex(
        (e: any) => e._id === itemId
      );
      if (itemIndex === -1) {
        return undefined;
      }
      parsedPath.push(listProperty);
      parsedPath.push(itemIndex);
      current = current[listProperty][itemIndex];
    } else {
      if (!(part in current)) {
        return undefined;
      }
      parsedPath.push(part);
      current = current[part];
    }
  }
  return parsedPath.join(".");
}