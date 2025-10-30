"use client";

import React from "react";
import { getUserColor, getUserInitials } from "@lib/utils";
import { cn } from "@lib/utils";
import { Collaborator } from "#types/collaboration";

interface CollaboratorAvatarProps {
  collaborator: Collaborator;
  isFollowing?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export const CollaboratorAvatar: React.FC<CollaboratorAvatarProps> = ({
  collaborator,
  isFollowing = false,
  onClick,
  size = "md",
}) => {
  const color = getUserColor(collaborator.userId);
  const initials = getUserInitials(collaborator.name, collaborator.lastName);
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full flex items-center justify-center text-white font-semibold cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-offset-2",
        sizeClasses[size],
        isFollowing && "ring-2 ring-offset-2 ring-blue-500"
      )}
      style={{ backgroundColor: color }}
      title={`${collaborator.name} ${collaborator.lastName}`}
    >
      {initials}
    </div>
  );
};

