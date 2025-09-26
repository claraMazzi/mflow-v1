"use server"; 

import { ApproveDeletionRequestData } from "#types/deletion-request";
import { auth } from "@lib/auth";

export type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export const approveDeletionRequest = async (
  data: ApproveDeletionRequestData
): Promise<ActionState> => {
  try {
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" }
    }

    const response = await fetch(`${process.env.API_URL}/api/deletion-requests/${data.deletionRequestId}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
          },
      body: JSON.stringify({
        reviewer: data.reviewer,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      message: result.message || "Deletion request approved successfully" 
    };
  } catch (error) {
    console.error("Error approving deletion request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
