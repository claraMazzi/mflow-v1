import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const body = await request.json();
	const { email } = body;

	try {
		const response = await fetch(
			`${process.env.API_URL}/api/auth/password-recover`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error ||
					"Ocurrió un error al enviar el correo para restablecer la contraseña."
			);
		}

		const data = await response.json();
		return NextResponse.json({ success: true, data });
	} catch (error) {
		console.error("Recover password failed: ", error);
		return NextResponse.json(
			{
				success: false,
				message:
					"Ocurrió un error al enviar el correo para restablecer la contraseña.",
			},
			{ status: 400 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { token, password } = await request.json();

		const response = await fetch(
			`${process.env.API_URL}/api/auth/password-recover`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, newPassword: password }),
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => {});
			throw new Error(
				errorData.error ||
					"Se ha producido un error, por favor inténtelo de nuevo más tarde."
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error resetting password:", error);
		return NextResponse.json(
			{
				error:
					"Se ha producido un error, por favor inténtelo de nuevo más tarde.",
			},
			{ status: 400 }
		);
	}
}
