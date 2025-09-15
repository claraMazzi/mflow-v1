"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
  error?: string;
  success?: boolean;
  data?: any;
};


export async function inviteUsers(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const apiBaseUrl = process.env.API_URL
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }
  
    try {
      const invitationsData = formData.get("invitations") as string
  
      if (!invitationsData) {
        return {
          error: "No invitations to send",
          success: false,
        }
      }
  
      const invitations = JSON.parse(invitationsData)
  
      // Validate invitations
      if (!Array.isArray(invitations) || invitations.length === 0) {
        return {
          error: "No invitations to send",
          success: false,
        }
      }
  
      // Validate each invitation
      for (const invitation of invitations) {
        if (!invitation.email || !invitation.roles || invitation.roles.length === 0) {
          return {
            error: "Invalid invitation format",
            success: false,
          }
        }
      }
  
      // If no API configured, simulate success for demo
      if (!apiBaseUrl || !session?.auth) {
       throw new Error("API configuration missing")
      }

  
      const response = await fetch(`${apiBaseUrl}/api/users/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.auth}`,
          "Content-Type": "application/json",
        },
        body: invitationsData,
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API Error Response:", errorText)
  
        if (response.status === 401) {
          return {
            error: "No autenticado",
            success: false,
          }
        }
  
        if (response.status === 400) {
          return {
            error: "Datos de invitación inválidos",
            success: false,
          }
        }
  
        return {
          error: "Algo salió mal.",
          success: false,
        }
      }
  
      console.log("[v0] Invitations sent successfully")
      return {
        success: true,
      }
    } catch (error) {
      console.error("[v0] Error sending invitations:", error)
      return {
        error: "Algo salió mal.",
        success: false,
      }
    }
  }
  

  export const getUserRolesFromInviteRequest = async (
    token: string
  ): Promise<ActionState> => {
    try {
      // NextAuth v5 uses auth() instead of getServerSession
      const session = await auth();
  
      if (!session?.user) {
        return { error: "Not authenticated" };
      }
  
      // Call external API directly
      const response = await fetch(
        `${process.env.API_URL}/api/users/invite/${token}`,
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
        return { error: errorData.error || "User new roles get failed" };
      }
  
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error("Get user new roles error:", error);
      return { error: "Something went wrong." };
    }
  };
  
  export const updateUserRoleWithInvitation = async (
      prevState: ActionState,
  
    token: string
  ): Promise<ActionState> => {
    try {
      // NextAuth v5 uses auth() instead of getServerSession
      const session = await auth();
  
      if (!session?.user) {
        return { error: "Not authenticated" };
      }
  
      // Call external API directly
      const response = await fetch(
        `${process.env.API_URL}/api/users/invite/${token}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.auth}`,
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.error || "User new roles get failed" };
      }
  
      const data = await response.json();
  
      return data;
    } catch (error) {
      console.error("Get user new roles error:", error);
      return { error: "Something went wrong." };
    }
  };