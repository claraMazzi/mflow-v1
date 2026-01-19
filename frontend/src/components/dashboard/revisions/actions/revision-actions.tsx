"use server";
import { Correction, RevisionDetails } from "#types/revision";
import { auth } from "@lib/auth";

export type RevisionActionState = {
  data?: { revision: RevisionDetails };
  error?: string;
};

export type SaveCorrectionsState = {
  data?: { message: string; corrections: Correction[] };
  error?: string;
};

export type StartRevisionState = {
  data?: { message: string };
  error?: string;
};

export const getRevisionById = async (
  revisionId: string
): Promise<RevisionActionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/revisions/${revisionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.auth}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || "Failed to fetch revision" };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error fetching revision:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const startRevision = async (
  revisionId: string
): Promise<StartRevisionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/revisions/${revisionId}/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.auth}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || "Failed to start revision" };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error starting revision:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const saveCorrections = async (
  revisionId: string,
  corrections: Correction[]
): Promise<SaveCorrectionsState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/revisions/${revisionId}/corrections`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.auth}`,
        },
        body: JSON.stringify({ corrections }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || "Failed to save corrections" };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error saving corrections:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export type FinalizeRevisionState = {
  data?: { 
    message: string; 
    revision: { 
      id: string; 
      state: string; 
      finalReview: string;
      corrections: Correction[];
    } 
  };
  error?: string;
};

export const finalizeRevision = async (
  revisionId: string,
  corrections: Correction[],
  finalReview?: string
): Promise<FinalizeRevisionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/revisions/${revisionId}/finalize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.auth}`,
        },
        body: JSON.stringify({ corrections, finalReview }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.error || "Failed to finalize revision" };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error finalizing revision:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
