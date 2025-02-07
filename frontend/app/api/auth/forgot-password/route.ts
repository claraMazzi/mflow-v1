import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { email } = body

  try {
    const response = await fetch(`${process.env.BACKEND_URL}/password-recover`, {
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

