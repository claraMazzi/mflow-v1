"use server";
import { DeletionRequestResponse } from "#types/deletion-request";
import { auth } from "@lib/auth";

export type ActionState = {
  data?: DeletionRequestResponse;
  error?: string;
};

export const getAllDeletionRequests = async (): Promise<ActionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" }
    }

    const response = await fetch(`${process.env.API_URL}/api/deletion-requests`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
      },
    });

    console.log('response', response);

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
