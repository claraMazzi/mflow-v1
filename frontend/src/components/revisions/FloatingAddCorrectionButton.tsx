"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@lib/utils";

interface FloatingAddCorrectionButtonProps {
  isAddingCorrection: boolean;
  onToggleAddCorrection: () => void;
}

export function FloatingAddCorrectionButton({
  isAddingCorrection,
  onToggleAddCorrection,
}: FloatingAddCorrectionButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartButtonPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position on mount (bottom-right corner)
  useEffect(() => {
    const savedPosition = localStorage.getItem("fab-correction-position");
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
        setHasInteracted(true);
      } catch {
        // Default position
        setPosition({
          x: window.innerWidth - 60,
          y: window.innerHeight - 100,
        });
      }
    } else {
      setPosition({
        x: window.innerWidth - 60,
        y: window.innerHeight - 100,
      });
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (hasInteracted && position.x !== 0 && position.y !== 0) {
      localStorage.setItem("fab-correction-position", JSON.stringify(position));
    }
  }, [position, hasInteracted]);

  // Constrain position within viewport
  const constrainPosition = useCallback((x: number, y: number) => {
    const buttonSize = 48;
    const padding = 16;
    
    return {
      x: Math.max(padding, Math.min(x, window.innerWidth - buttonSize - padding)),
      y: Math.max(padding, Math.min(y, window.innerHeight - buttonSize - padding)),
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartButtonPos.current = { ...position };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    // Check if moved more than 5px (to differentiate from click)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved.current = true;
    }
    
    const newPosition = constrainPosition(
      dragStartButtonPos.current.x + deltaX,
      dragStartButtonPos.current.y + deltaY
    );
    
    setPosition(newPosition);
    setHasInteracted(true);
  }, [isDragging, constrainPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && !hasMoved.current) {
      // It was a click, not a drag
      onToggleAddCorrection();
    }
    setIsDragging(false);
  }, [isDragging, onToggleAddCorrection]);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [constrainPosition]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only toggle if not dragging (handled in mouseUp)
    if (!isDragging && !hasMoved.current) {
      e.preventDefault();
      onToggleAddCorrection();
    }
  }, [isDragging, onToggleAddCorrection]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        "fixed z-50 flex items-center justify-center rounded-full shadow-lg select-none",
        "focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2",
        "transition-all duration-200 ease-out",
        "h-12 w-12",
        isDragging ? "cursor-grabbing scale-110 shadow-xl" : "cursor-grab hover:scale-105 hover:shadow-xl",
        isAddingCorrection
          ? "bg-gray-600 hover:bg-gray-700"
          : "bg-amber-500 hover:bg-amber-600"
      )}
      style={{
        left: position.x,
        top: position.y,
        // Disable transitions during drag for responsiveness
        transition: isDragging ? "none" : undefined,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      aria-label={isAddingCorrection ? "Cancelar agregar corrección" : "Agregar corrección"}
    >
      {/* Icon */}
      <span
        className={cn(
          "flex items-center justify-center transition-transform duration-200",
          isAddingCorrection && "rotate-45"
        )}
      >
        {isAddingCorrection ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Plus className="w-5 h-5 text-white" />
        )}
      </span>

      {/* Drag indicator tooltip */}
      {isDragging && (
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded shadow whitespace-nowrap">
          Arrastra para mover
        </span>
      )}
    </button>
  );
}
