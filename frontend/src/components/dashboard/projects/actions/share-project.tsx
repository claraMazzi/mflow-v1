"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
  error?: string;
  success?: boolean;
  data?: any;
};

export const sendProjectCollaborationInvitation = async (
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    const projectId = formData.get('id') as string;
    // Validate required fields
    if (!projectId) {
      return { error: "Project id is required" };
    }

    const accessToken = session.auth;

    if (!accessToken) {
      return { error: "No access token available" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/projects/${projectId}/share`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ collaborators: formData.get('collaborators') }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error:
          errorData.error ||
          "Send project collaboration invitation request failed",
      };
    }

    const data = await response.json();

    return { success: true, data };
  } catch (error) {
    console.error("Send project collaboration invitation error:", error);
    return { error: "Something went wrong." };
  }
};

export const getProjectSharingLink = async (
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }
    const projectId = formData.get('id') as string;

    // Validate required fields
    if (!projectId) {
      return { error: "Project id is required" };
    }

    const accessToken = session.auth;

    if (!accessToken) {
      return { error: "No access token available" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/projects/${projectId}/share`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || "Get Project sharing link request failed",
      };
    }

    const data = await response.json();

    return { success: true, data };
  } catch (error) {
    console.error("Get Project sharing link error:", error);
    return { error: "Something went wrong." };
  }
};

export const addCollaboratorToProject = async (
  prevState: ActionState,
  sharingToken: string
): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth();
    if (!session?.user) {
      return { error: "Not authenticated" };
    }

    // Validate required fields
    if (!sharingToken) {
      return { error: "Sharing Token not present" };
    }

    const accessToken = session.auth;

    if (!accessToken) {
      return { error: "No access token available" };
    }

    const response = await fetch(
      `${process.env.API_URL}/api/projects/share/${sharingToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData.error || "Add Collaborator To Project request failed",
      };
    }

    const data = await response.json();

    return { success: true, data };
  } catch (error) {
    console.error("Add Collaborator To Project error:", error);
    return { error: "Something went wrong." };
  }
};
