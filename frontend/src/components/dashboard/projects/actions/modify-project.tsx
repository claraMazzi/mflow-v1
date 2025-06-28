"use server"
import { auth } from "@lib/auth" // or wherever your auth config is
import type { ModifyProjectFormData } from "../forms/modify-project-form"

// Define the state type
export type ActionState = {
  error?: string
  success?: boolean
  data?: any
}

export const modifyProject = async (prevState: ActionState, formData: FormData): Promise<ActionState> => {
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
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
    }

    const accessToken = session.auth 

    if (!accessToken) {
      return { error: "No access token available" }
    }

    const response = await fetch(`${process.env.API_URL}/api/projects/${formData.get('id')}`, {
        method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.log('errordata', errorData)
      return { error: errorData.error || "Project modification failed" }
    }

    const data = await response.json()
    
    return { success: true, data }
  } catch (error) {
    console.error("Modify project error:", error)
    return { error: "Something went wrong." }
  }
}
