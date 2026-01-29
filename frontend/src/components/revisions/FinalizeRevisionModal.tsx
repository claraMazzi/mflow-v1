"use client";

import React, { useState } from "react";
import { Button } from "@components/ui/common/button";
import { Textarea } from "@components/ui/common/textarea";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Correction } from "#types/revision";

interface FinalizeRevisionModalProps {
  corrections: Correction[];
  onCancel: () => void;
  onFinalize: (finalReview: string) => Promise<void>;
}

export function FinalizeRevisionModal({
  corrections,
  onCancel,
  onFinalize,
}: FinalizeRevisionModalProps) {
  const [finalReview, setFinalReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFinalize = async () => {
    setIsLoading(true);
    try {
      await onFinalize(finalReview);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-4 space-y-6 max-w-lg mx-auto">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Agregar devoluciones finales sobre el modelo
        </label>
        <Textarea
          value={finalReview}
          onChange={(e) => setFinalReview(e.target.value)}
          placeholder="Escribe tus comentarios finales sobre el modelo (opcional)..."
          className="min-h-[120px] resize-none"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500">
          Este campo es opcional. Puedes dejarlo vacío si no tienes comentarios adicionales.
        </p>
      </div>

      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          La acción de finalizar es irreversible, asegurate de que todo tu progreso esté guardado.
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-500">
          {corrections.length} corrección{corrections.length !== 1 ? "es" : ""} será{corrections.length !== 1 ? "n" : ""} guardada{corrections.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finalizando...
              </>
            ) : (
              "Finalizar"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
