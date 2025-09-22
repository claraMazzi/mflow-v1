"use client";

import { DeletionRequestResponse } from "#types/deletion-request";

export type ActionState = {
  data?: DeletionRequestResponse;
  error?: string;
};

export const getAllDeletionRequests = async (): Promise<ActionState> => {
  try {
    const response = await fetch("/api/deletion-requests", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
