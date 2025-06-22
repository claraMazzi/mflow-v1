import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Missing or invalid authorization header" }, { status: 401 })
  }

  try {
    console.log('----respon', {Authorization: authHeader})


    const response = await fetch(`${process.env.API_URL}/api/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader
    },
    })


    if (!response.ok) {
      throw new Error("Project get failed")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Project get error:", error)
    return NextResponse.json({ message: "Project get failed" }, { status: 500 })
  }
}

