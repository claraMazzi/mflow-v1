"use server"

interface FormData {
  name: string
  lastName: string
  email: string
  password: string
  role: "MODELADOR" | "VERIFICADOR" | "ADMIN" | string[]
}

export async function createAccount(data: FormData) {
  try {
    const response = await fetch(`${process.env.API_URL || "http://localhost:3000"}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    // console.log('DATA', data, JSON.stringify(data))

    console.log('RESPONSE', response)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Registration failed")
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during registration",
    }
  }
}
