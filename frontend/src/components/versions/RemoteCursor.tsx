"use client";

import React from "react";
import { getUserColor } from "@lib/utils";
import { Collaborator } from "#types/collaboration";

interface RemoteCursorProps {
  collaborator: Collaborator;
  socketId: string;
  mousePosition: { relativeX: number; relativeY: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const RemoteCursor: React.FC<RemoteCursorProps> = ({
  collaborator,
  socketId,
  mousePosition,
  containerRef,
}) => {
  const color = getUserColor(collaborator.userId);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.left + mousePosition.relativeX * rect.width;
      const y = rect.top + mousePosition.relativeY * rect.height;
      
      setPosition({ x, y });
    };

    updatePosition();
    
    // Update on window resize/scroll
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    
    // Use requestAnimationFrame for smooth updates
    const rafId = requestAnimationFrame(updatePosition);
    
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      cancelAnimationFrame(rafId);
    };
  }, [mousePosition, containerRef]);

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: "none",
        zIndex: 9999,
        transform: "translate(-2px, -2px)", // Position cursor tip at the mouse position (arrow tip is at top-left)
      }}
    >
      {/* Thick arrow cursor - pointing up-left like a typical cursor */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
      >
        <path
          d="M2 2 L16 16 L12 16 L12 18 L18 18 L18 12 L16 12 L2 2 Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* User name label */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "0px",
          backgroundColor: color,
          color: "white",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "12px",
          whiteSpace: "nowrap",
          fontWeight: 500,
          pointerEvents: "none",
        }}
      >
        {collaborator.name} {collaborator.lastName}
      </div>
    </div>
  );
};

