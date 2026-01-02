import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { token: string } }
) {
	const resolvedParams = await params;

	const token = resolvedParams.token;

	if (!token) {
		return NextResponse.json({ message: "No se propocionó un token válido." }, { status: 400 });
	}

	try {
		const response = await fetch(
			`${process.env.API_URL}/api/auth/password-recover/${token}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		if (!response.ok) {
			return NextResponse.json(
				{ message: "Se ha producido un error. Por favor, inténtelo de nuevo más tarde." },
				{ status: 500 }
			);
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Password recover request error:", error);
		return NextResponse.json(
			{ message: "Se ha producido un error. Por favor, inténtelo de nuevo más tarde." },
			{ status: 500 }
		);
	}
}
