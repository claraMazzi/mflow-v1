"use server";
import { RevisionResponse, RevisionState } from "#types/revision";
import { auth } from "@lib/auth";

export type ActionState = {
  data?: RevisionResponse;
  error?: string;
};

export const getRevisionsByState = async (state: RevisionState): Promise<ActionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/revisions/state/${state}`,
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
      return { error: errorData.error || "Failed to fetch revisions" };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error fetching revisions:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const getPendingRevisions = async (): Promise<ActionState> => {
  return getRevisionsByState("PENDIENTE");
};

export const getOngoingRevisions = async (): Promise<ActionState> => {
  return getRevisionsByState("EN CURSO");
};

export const getFinalizedRevisions = async (): Promise<ActionState> => {
  return getRevisionsByState("FINALIZADA");
};
