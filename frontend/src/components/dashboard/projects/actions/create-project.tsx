"use server"
import { auth } from "@lib/auth" // or wherever your auth config is
import type { CreateProyectFormData } from "../forms/create-project-form"

// Define the state type
export type ActionState = {
  error?: string
  success?: boolean
  data?: FormData
}

export const createProject = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }

    // Extract data from FormData
    const projectData: CreateProyectFormData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
    }

    // Validate required fields
    if (!projectData.title?.trim()) {
      return { error: "Project title is required" }
    }
    
    const accessToken = session.auth 

    if (!accessToken) {
      return { error: "No access token available" }
    }

    const response = await fetch(`${process.env.API_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Project creation failed" }
    }

    const data = await response.json()

    return { success: true, data }
  } catch (error) {
    console.error("Create project error:", error)
    return { error: "Something went wrong." }
  }
}
