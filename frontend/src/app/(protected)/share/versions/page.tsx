import React from "react";
import { VersionInvitationForm } from "@components/dashboard/versions/forms/version-invitation-form";
import { getVersionFromShareRequest } from "@components/dashboard/versions/actions/share-version";

export default async function AcceptVersionSharePage({
	searchParams,
}: {
	searchParams: Promise<{ token?: string }>;
}) {
	const params = await searchParams;
	const token = params.token;

	if (!token) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
				<div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
					<div className="flex flex-col items-center">
						<h1 className="text-3xl font-medium text-center text-purple-600">
							MFLOW
						</h1>
						<div>Esta invitación es inválida</div>
					</div>
				</div>
			</div>
		);
	}

	const data = await getVersionFromShareRequest(token);

	if (data.error || !data.version || !data.project) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
				<div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
					<div className="flex flex-col items-center">
						<h1 className="text-3xl font-medium text-center text-purple-600">
							MFLOW
						</h1>
						<div>{data.error || "Esta invitación es inválida o ha expirado"}</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-purple-300 p-4">
			<div className="w-full max-w-md bg-white shadow-md rounded-md p-8 border border-gray-200">
				<VersionInvitationForm
					version={data.version as { id: string; title: string; state: string }}
					project={
						data.project as {
							id: string;
							title: string;
							owner: { name: string };
						}
					}
					token={token}
				/>
			</div>
		</div>
	);
}
