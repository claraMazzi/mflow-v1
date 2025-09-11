"use server";
import { auth } from "@lib/auth"; // or wherever your auth config is

// Define the state type
export type ActionState = {
  error?: string;
  success?: boolean;
  data?: any;
};
export async function inviteUsers(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const apiBaseUrl = process.env.API_BASE_URL
    const apiToken = process.env.API_TOKEN
  
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
  
        // Validate email format
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
        if (!emailRegex.test(invitation.email)) {
          return {
            error: "Invalid email format",
            success: false,
          }
        }
      }
  
      // If no API configured, simulate success for demo
      if (!apiBaseUrl || !apiToken) {
        console.log("[v0] Mock user invitations sent:", invitations)
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return {
          success: true,
        }
      }
  
      const url = `${apiBaseUrl}/users/invite`
      console.log("[v0] Sending invitations to URL:", url)
  
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invitations,
        }),
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