"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Correction } from "#types/revision";
import { cn } from "@lib/utils";

interface ReadOnlyCorrectionBubbleProps {
	correction: Correction;
	index: number;
	isSelected: boolean;
	onSelect: () => void;
	onClose: () => void;
	containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ReadOnlyCorrectionBubble({
	correction,
	index,
	isSelected,
	onSelect,
	onClose,
	containerRef,
}: ReadOnlyCorrectionBubbleProps) {
	const position = { x: correction.location.x, y: correction.location.y };
	const bubbleRef = useRef<HTMLDivElement>(null);

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
			className="absolute z-50 transition-all duration-200 pointer-events-auto"
			style={{
				left: pixelPos.left,
				top: pixelPos.top,
				transform: "translate(-50%, -50%)",
			}}
		>
			{/* Collapsed state - small numbered bubble */}
			{!isSelected && (
				<button
					onClick={(e) => {
						e.stopPropagation();
						onSelect();
					}}
					className={cn(
						"w-8 h-8 rounded-full flex items-center justify-center",
						"bg-amber-500 text-white font-semibold text-sm",
						"shadow-lg hover:shadow-xl transition-shadow",
						"hover:scale-110 transform transition-transform",
						"border-2 border-white cursor-pointer"
					)}
				>
					{index + 1}
				</button>
			)}

			{/* Expanded state - read-only comment card */}
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
							<div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-semibold">
								{index + 1}
							</div>
							<span className="text-sm font-medium text-amber-800">
								Corrección
							</span>
						</div>
						<button
							onClick={onClose}
							className="p-1 hover:bg-amber-100 rounded transition-colors"
							title="Cerrar"
						>
							<X className="w-4 h-4 text-gray-500" />
						</button>
					</div>

					{/* Content - read only */}
					<div className="p-3">
						<p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[40px]">
							{correction.description || (
								<span className="italic text-gray-400">
									Sin descripción
								</span>
							)}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
