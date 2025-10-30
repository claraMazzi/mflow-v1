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

/**
 * Generates a consistent color from a userId string
 * Uses a simple hash function to convert userId to a hue value
 */
export const getUserColor = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  // Use a fixed saturation and lightness for good visibility
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Gets the initial letter(s) from a user's name
 */
export const getUserInitials = (name: string, lastName: string): string => {
  const firstInitial = name?.[0]?.toUpperCase() || "";
  const lastInitial = lastName?.[0]?.toUpperCase() || "";
  return `${firstInitial}${lastInitial}` || "?";
}