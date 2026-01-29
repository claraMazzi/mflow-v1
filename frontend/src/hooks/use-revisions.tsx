"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingRevisions,
  getOngoingRevisions,
  getFinalizedRevisions,
} from "@components/dashboard/revisions/actions/get-revisions";
import { Revision } from "#types/revision";

// Minimum time between automatic refetches (5 seconds)
const REFETCH_COOLDOWN = 5000;

export const usePendingRevisions = () => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchRevisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getPendingRevisions();
      if (response.data) {
        setRevisions(response.data.revisions);
      } else {
        setRevisions([]);
      }
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      setError("Failed to fetch pending revisions");
      console.error("Error fetching pending revisions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // Refetch when window gains focus (e.g., after navigating from notification)
  useEffect(() => {
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > REFETCH_COOLDOWN) {
        fetchRevisions();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchRevisions]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (
        document.visibilityState === "visible" &&
        timeSinceLastFetch > REFETCH_COOLDOWN
      ) {
        fetchRevisions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRevisions]);

  return {
    revisions,
    isLoading,
    error,
    refreshRevisions: fetchRevisions,
  };
};

export const useOngoingRevisions = () => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchRevisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getOngoingRevisions();
      if (response.data) {
        setRevisions(response.data.revisions);
      } else {
        setRevisions([]);
      }
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      setError("Failed to fetch ongoing revisions");
      console.error("Error fetching ongoing revisions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // Refetch when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > REFETCH_COOLDOWN) {
        fetchRevisions();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchRevisions]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (
        document.visibilityState === "visible" &&
        timeSinceLastFetch > REFETCH_COOLDOWN
      ) {
        fetchRevisions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRevisions]);

  return {
    revisions,
    isLoading,
    error,
    refreshRevisions: fetchRevisions,
  };
};

export const useFinalizedRevisions = () => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchRevisions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getFinalizedRevisions();
      if (response.data) {
        setRevisions(response.data.revisions);
      } else {
        setRevisions([]);
      }
      lastFetchTimeRef.current = Date.now();
    } catch (err) {
      setError("Failed to fetch finalized revisions");
      console.error("Error fetching finalized revisions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevisions();
  }, [fetchRevisions]);

  // Refetch when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch > REFETCH_COOLDOWN) {
        fetchRevisions();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchRevisions]);

  // Refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (
        document.visibilityState === "visible" &&
        timeSinceLastFetch > REFETCH_COOLDOWN
      ) {
        fetchRevisions();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchRevisions]);

  return {
    revisions,
    isLoading,
    error,
    refreshRevisions: fetchRevisions,
  };
};
