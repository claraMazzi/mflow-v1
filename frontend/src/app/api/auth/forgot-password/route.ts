import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { email } = body

  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/password-recover`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error("Password recovery request failed")
    }

    const data = await response.json()
    return NextResponse.json({ success: true, message: "Password recovery email sent", data })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Password recovery request failed" }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  try {
    const { token, password } = await request.json()

    const response = await fetch(`${process.env.API_URL}/api/auth/password-recover`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: token, newPassword: password }),
    })

    if (!response.ok) {
      throw new Error("Password reset failed")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Password reset failed" }, { status: 400 })
  }
}
