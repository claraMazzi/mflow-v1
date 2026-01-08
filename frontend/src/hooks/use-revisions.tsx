"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getPendingRevisions,
  getOngoingRevisions,
  getFinalizedRevisions,
} from "@components/dashboard/revisions/actions/get-revisions";
import { Revision } from "#types/revision";

export const usePendingRevisions = () => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return {
    revisions,
    isLoading,
    error,
    refreshRevisions: fetchRevisions,
  };
};
