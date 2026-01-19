"use client";

import { ImageInfo } from "#types/conceptual-model";
import { useMemo } from "react";
import { Download, ImageIcon, ExternalLink } from "lucide-react";
import Image from "next/image";
import { Button } from "@components/ui/common/button";

interface RevisionDiagramImageProps {
  title: string;
  imageInfos: Map<string, ImageInfo>;
  imageFileId?: string | null;
  plantTextToken?: string | null;
  usePlantText?: boolean;
}

export function RevisionDiagramImage({
  title,
  imageInfos,
  imageFileId,
  plantTextToken,
  usePlantText = false,
}: RevisionDiagramImageProps) {
  const imageFileInfo = useMemo(() => {
    if (!imageFileId) return null;
    return imageInfos.get(imageFileId);
  }, [imageFileId, imageInfos]);

  const plantTextImageUrl = useMemo(() => {
    if (usePlantText && plantTextToken) {
      return `http://www.plantuml.com/plantuml/img/${plantTextToken}`;
    }
    return null;
  }, [usePlantText, plantTextToken]);

  const handleDownload = async () => {
    const imageUrl = plantTextImageUrl || imageFileInfo?.url;
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = imageFileInfo?.filename || `${title.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      // Fallback: open in new tab
      window.open(imageUrl, "_blank");
    }
  };

  const handleOpenInNewTab = () => {
    const imageUrl = plantTextImageUrl || imageFileInfo?.url;
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  const hasImage = !!(plantTextImageUrl || imageFileInfo?.url);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-card-foreground mb-1">
            <ImageIcon className="h-5 w-5" />
            {title}
          </div>
          {usePlantText && (
            <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-0.5 rounded">
              Generado con PlantText
            </span>
          )}
        </div>
        
        {hasImage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        )}
      </div>

      {/* Image Display */}
      {hasImage ? (
        <div className="relative overflow-hidden rounded-lg border bg-white min-h-[400px] max-h-[600px]">
          <Image
            src={plantTextImageUrl || imageFileInfo?.url || ""}
            alt={title}
            fill
            className="object-contain"
            unoptimized={!!plantTextImageUrl}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <ImageIcon className="h-12 w-12 mb-3" />
          <p className="text-sm font-medium">No hay imagen disponible</p>
          <p className="text-xs text-gray-400 mt-1">
            Este diagrama no tiene una imagen asociada
          </p>
        </div>
      )}
    </div>
  );
}
