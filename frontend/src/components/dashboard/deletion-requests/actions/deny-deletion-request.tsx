"use client";

import { DenyDeletionRequestData } from "#types/deletion-request";

export type ActionState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export const denyDeletionRequest = async (
  data: DenyDeletionRequestData
): Promise<ActionState> => {
  try {
    const response = await fetch(`/api/deletion-requests/${data.deletionRequestId}/deny`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reviewer: data.reviewer,
        reason: data.reason,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { 
      success: true, 
      message: result.message || "Deletion request denied successfully" 
    };
  } catch (error) {
    console.error("Error denying deletion request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
