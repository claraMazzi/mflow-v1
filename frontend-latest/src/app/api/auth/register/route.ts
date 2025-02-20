import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { nombre, apellido, email, password, rol } = body

  console.log("Attempting to register with:", { nombre, apellido, email, rol })

  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: nombre, lastName: apellido, email: email, password:password, role: rol }),
    })

    console.log("Backend registration response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Registration failed:", errorData)
      throw new Error(errorData.message || "Registration failed")
    }

    const data = await response.json()
    console.log("Registration successful:", data)
    return NextResponse.json({ success: true, message: "Registration successful", data })
  } catch (error) {
    console.error("Error during registration:", error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 },
    )
  }
}

