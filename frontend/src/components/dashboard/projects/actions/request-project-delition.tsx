"use server"
import { auth } from "@lib/auth" // or wherever your auth config is
import type { ModifyProjectFormData } from "../forms/modify-project-form"

// Define the state type
export type ActionState = {
  error?: string
  success?: boolean
  data?: any
}

export const requestProjectDelition = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()
    if (!session?.user) {
      return { error: "Not authenticated" }
    }

     // Validate required fields
     if (!formData.get('id')) {
        return { error: "Project id is required" }
      }

    // Extract data from FormData
    const projectData = {
      motive: formData.get("motive") as string,
    }

    const accessToken = session.auth 

    if (!accessToken) {
      return { error: "No access token available" }
    }

    const response = await fetch(`${process.env.API_URL}/api/projects/${formData.get('id')}/deletion`, {
        method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Project deletion request failed" }
    }

    const data = await response.json()
    
    return { success: true, data }
  } catch (error) {
    console.error("Delition Request for project error:", error)
    return { error: "Something went wrong." }
  }
}
