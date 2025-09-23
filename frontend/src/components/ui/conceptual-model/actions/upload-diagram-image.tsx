"use server";
import { auth } from "@lib/auth";

// Define the state type
export type UploadDiagramImageActionState = {
	error?: string;
	success: boolean;
};

export const uploadDiagramImage = async (
	prevState: UploadDiagramImageActionState,
	formData: FormData
): Promise<UploadDiagramImageActionState> => {
	try {

		// NextAuth v5 uses auth() instead of getServerSession
		const session = await auth();

		if (!session?.user) {
			return { success: false, error: "Not authenticated" };
		}

		const accessToken = session.auth;

		if (!accessToken) {
			return { success: false, error: "No access token available" };
		}

		const versionId = formData.get("versionId");
		if (!versionId) {
			return { success: false, error: "The version id is required" };
		}

		if (!formData.get("diagramPropertyPath")) {
			return {
				success: false,
				error: "The path to the diagram property is required",
			};
		}

		if (!formData.get("image")) {
			return { success: false, error: "No image to upload was provided." };
		}

		const response = await fetch(
			`${process.env.API_URL}/api/uploads/${versionId}/diagrams`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: formData,
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				success: false,
				error: errorData.error || "Image upload failed.",
			};
		}

		return { success: true };
	} catch (error) {
		console.error("Unexpected error during diagram image upload:", error);
		return { success: false, error: "Something went wrong." };
	}
};
