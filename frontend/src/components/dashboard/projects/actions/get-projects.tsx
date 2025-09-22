"use server"
import { auth } from "@lib/auth" // or wherever your auth config is

// Define the state type
export type ActionState = {
  error?: string
  success?: boolean
  data?: any
}

export const getProjects = async (): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }


    // Call external API directly
    const response = await fetch(`${process.env.API_URL}/api/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Project get failed" }
    }

    const data = await response.json()

    return { success: true, data }
  } catch (error) {
    console.error("Get project error:", error)
    return { error: "Something went wrong." }
  }
}



export const getSharedProjects = async (): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }


    // Call external API directly
    const response = await fetch(`${process.env.API_URL}/api/projects/shared`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Shared Project get failed" }
    }

    const data = await response.json()

    return { success: true, data }
  } catch (error) {
    console.error("Get shared project error:", error)
    return { error: "Something went wrong." }
  }
}
