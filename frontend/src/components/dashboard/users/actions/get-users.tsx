"use server"
import { auth } from "@lib/auth" // or wherever your auth config is

// Define the state type
export type ActionState = {
  error?: string
  success?: boolean
  data?: any
}

export const getAllActiveUsers = async (): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }


    // Call external API directly
    const response = await fetch(`${process.env.API_URL}/api/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Users get failed" }
    }

    const data = await response.json()

    return { success: true, data }
  } catch (error) {
    console.error("Users project error:", error)
    return { error: "Something went wrong." }
  }
}


export const getLoggedUser = async (): Promise<ActionState> => {
  try {
    // NextAuth v5 uses auth() instead of getServerSession
    const session = await auth()

    if (!session?.user) {
      return { error: "Not authenticated" }
    }


    // Call external API directly
    const response = await fetch(`${process.env.API_URL}/api/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.auth}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || "Logged user get failed" }
    }

    const data = await response.json()

    return { success: true, data }
  } catch (error) {
    console.error("Users project error:", error)
    return { error: "Something went wrong." }
  }
}
