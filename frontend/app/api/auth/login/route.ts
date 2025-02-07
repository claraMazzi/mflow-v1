import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  try {
    const response = await fetch(`${process.env.BACKEND_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
  }
}

