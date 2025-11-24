import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	const { token } = await params;

	if (!token) {
		return NextResponse.json({ message: "Invalid token" }, { status: 400 });
	}

	try {
		const response = await fetch(
			`${process.env.API_URL}/api/auth/validate-email/${token}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			throw new Error("La validación del email falló.");
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Email validation error:", error);
		return NextResponse.json(
			{ message: "La validación del email falló." },
			{ status: 500 }
		);
	}
}
