"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Trash2, Check, GripVertical, Pencil } from "lucide-react";
import { Correction } from "#types/revision";
import { cn } from "@lib/utils";
import { Textarea } from "@components/ui/common/textarea";

interface CorrectionBubbleProps {
  correction: Correction;
  index: number;
  isSelected: boolean;
  isNew?: boolean; // Flag to indicate newly created bubble
  onSelect: () => void;
  onUpdate: (correction: Correction) => void;
  onDelete: () => void;
  onClose: () => void; // Called when bubble is closed
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (newPosition: { x: number; y: number }) => void;
}

export function CorrectionBubble({
  correction,
  index,
  isSelected,
  isNew = false,
  onSelect,
  onUpdate,
  onDelete,
  onClose,
  containerRef,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: CorrectionBubbleProps) {
  // Start in editing mode if it's a new bubble with empty description
  const [isEditing, setIsEditing] = useState(isNew && !correction.description);
  const [description, setDescription] = useState(correction.description);
  const [position, setPosition] = useState({ x: correction.location.x, y: correction.location.y });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when correction prop changes (but not editing state)
  useEffect(() => {
    setDescription(correction.description);
    setPosition({ x: correction.location.x, y: correction.location.y });
  }, [correction]);

  // Start editing mode when newly selected and is new
  useEffect(() => {
    if (isSelected && isNew && !correction.description) {
      setIsEditing(true);
    }
  }, [isSelected, isNew, correction.description]);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && isSelected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing, isSelected]);

  const handleSave = () => {
    onUpdate({
      ...correction,
      description: description.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to saved description
    setDescription(correction.description);
    setIsEditing(false);
  };

  const handleClose = () => {
    // Reset description to saved value when closing without saving
    setDescription(correction.description);
    setIsEditing(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && e.metaKey) {
      handleSave();
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!containerRef.current || !onDragStart || !onDragEnd) return;
    
    e.preventDefault();
    e.stopPropagation();
    onDragStart();

    const containerRect = containerRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Convert pixel delta to percentage
      const deltaXPercent = (deltaX / containerRect.width) * 100;
      const deltaYPercent = (deltaY / containerRect.height) * 100;

      const newX = Math.max(0, Math.min(100, startPosX + deltaXPercent));
      const newY = Math.max(0, Math.min(100, startPosY + deltaYPercent));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      
      onDragEnd(position);
      
      // Update the correction with the new position
      onUpdate({
        ...correction,
        location: {
          ...correction.location,
          x: position.x,
          y: position.y,
        },
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Calculate pixel position from percentage
  const getPixelPosition = () => {
    if (!containerRef.current) return { left: 0, top: 0 };
    
    return {
      left: `${position.x}%`,
      top: `${position.y}%`,
    };
  };

  const pixelPos = getPixelPosition();

  return (
    <div
      ref={bubbleRef}
      className={cn(
        "absolute z-50 transition-all duration-200",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: pixelPos.left,
        top: pixelPos.top,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Collapsed state - small numbered bubble */}
      {!isSelected && (
        <button
          onClick={onSelect}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            "bg-amber-500 text-white font-semibold text-sm",
            "shadow-lg hover:shadow-xl transition-shadow",
            "hover:scale-110 transform transition-transform",
            "border-2 border-white"
          )}
        >
          {index + 1}
        </button>
      )}

      {/* Expanded state - full comment card */}
      {isSelected && (
        <div
          className={cn(
            "bg-white rounded-lg shadow-2xl border border-gray-200",
            "min-w-[280px] max-w-[360px]",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-amber-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              {/* Drag handle */}
              <button
                onMouseDown={handleDragStart}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-amber-100 rounded"
                title="Arrastrar para mover"
              >
                <GripVertical className="w-4 h-4 text-amber-600" />
              </button>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-amber-800">
                  Corrección
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe la corrección necesaria..."
                  className="min-h-[80px] text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    ⌘+Enter para guardar
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!description.trim()}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        description.trim() 
                          ? "hover:bg-green-100 text-green-600" 
                          : "text-gray-300 cursor-not-allowed"
                      )}
                      title="Guardar"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[40px]">
                  {correction.description || (
                    <span className="italic text-gray-400">
                      Sin descripción
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={onDelete}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors text-red-500 hover:text-red-600"
                    title="Eliminar corrección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-amber-100 rounded transition-colors text-amber-600"
                    title="Editar descripción"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Component for adding a new correction
interface AddCorrectionOverlayProps {
  isActive: boolean;
  currentPage: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAddCorrection: (correction: Omit<Correction, "_id">) => void;
  onCancel: () => void;
}

export function AddCorrectionOverlay({
  isActive,
  currentPage,
  containerRef,
  onAddCorrection,
  onCancel,
}: AddCorrectionOverlayProps) {
  if (!isActive) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate percentage position
    const x = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top) / containerRect.height) * 100;

    onAddCorrection({
      description: "",
      location: {
        x,
        y,
        page: currentPage,
      },
    });
  };

  return (
    <div
      className={cn(
        "absolute inset-0 z-40",
        "cursor-crosshair",
        "bg-amber-500/5 border-2 border-dashed border-amber-400 rounded-lg"
      )}
      onClick={handleClick}
    >
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full shadow-md flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          Haz clic para agregar una corrección
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="ml-2 p-1 hover:bg-amber-200 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
