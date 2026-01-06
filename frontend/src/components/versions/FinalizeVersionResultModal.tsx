"use client";

import { Button } from "@components/ui/common/button";
import { AlertCircle, AlertTriangle, XCircle } from "lucide-react";

interface FinalizeVersionResultModalProps {
  errors: string[];
  warnings: string[];
  onClose: () => void;
}

export function FinalizeVersionResultModal({
  errors,
  warnings,
  onClose,
}: FinalizeVersionResultModalProps) {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-lg mx-auto">
      {/* Error Section */}
      {errors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold">
              {errors.length} Error{errors.length > 1 ? "es" : ""} de Validación
            </h3>
          </div>
          <ul className="space-y-2 pl-7">
            {errors.map((error, index) => (
              <li
                key={`error-${index}`}
                className="flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded-md"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">
              {warnings.length} Advertencia{warnings.length > 1 ? "s" : ""}
            </h3>
          </div>
          <ul className="space-y-2 pl-7">
            {warnings.map((warning, index) => (
              <li
                key={`warning-${index}`}
                className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded-md"
              >
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message */}
      <p className="text-sm text-gray-600 text-center mt-2">
        Por favor corrija los errores antes de finalizar la revisión.
      </p>

      {/* Close Button */}
      <div className="flex justify-center mt-2">
        <Button onClick={onClose} variant="outline" size="sm">
          Aceptar
        </Button>
      </div>
    </div>
  );
}

