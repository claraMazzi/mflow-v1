"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DeletionRequest, DeletionRequestResponse } from "#types/deletion-request";

export type DeletionRequestsResult = {
  success: boolean;
  data?: DeletionRequestResponse;
  error?: string;
};

export const useDeletionRequests = () => {
  const { data: session } = useSession();
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeletionRequests = useCallback(async () => {
    if (!session?.auth) {
      setError("Debe estar logueado para obtener las solicitudes de eliminación.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getDeletionRequestsRequest({
        sessionToken: session.auth as string,
      });

      if (response.success && response.data) {
        setDeletionRequests(response.data.deletionRequests || []);
      } else {
        setError(response.error ?? "Error al obtener las solicitudes.");
        setDeletionRequests([]);
      }
    } catch (err) {
      setError("No fue posible obtener las solicitudes desde el servidor.");
      console.error("Error fetching deletion requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.auth]);

  useEffect(() => {
    if (session?.auth) {
      fetchDeletionRequests();
    }
  }, [fetchDeletionRequests, session?.auth]);

  return {
    deletionRequests,
    isLoading,
    error,
    refreshDeletionRequests: fetchDeletionRequests,
  };
};

/**
 * Internal API helper function
 */
async function getDeletionRequestsRequest({
  sessionToken,
}: {
  sessionToken: string;
}): Promise<DeletionRequestsResult> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/deletion-requests`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || "Error al obtener las solicitudes desde el servidor.",
      };
    }

    const data: DeletionRequestResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error fetching deletion requests:", error);
    return {
      success: false,
      error: "Se ha producido un error, por favor inténtelo de nuevo más tarde.",
    };
  }
}