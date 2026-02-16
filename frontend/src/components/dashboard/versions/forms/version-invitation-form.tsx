"use client";

import { startTransition, useActionState, useEffect } from "react";
import { Button } from "@components/ui/common/button";
import { acceptVersionShareInvitation } from "../actions/share-version";
import { useRouter } from "next/navigation";

const initialState = {
	error: undefined,
	success: false,
};

interface VersionInvitationFormProps {
	version?: { id: string; title: string; state: string };
	project?: { id: string; title: string; owner: { name: string } };
	token?: string;
}

export const VersionInvitationForm = ({
	version,
	project,
	token,
}: VersionInvitationFormProps) => {
	const [inviteState, inviteAction, isInvitePending] = useActionState(
		acceptVersionShareInvitation,
		initialState
	);
	const router = useRouter();

	const acceptInvitation = () => {
		startTransition(() => {
			if (token) inviteAction(token);
		});
	};

	useEffect(() => {
		if (inviteState?.success) {
			router.push("/dashboard/shared/artifacts");
		}
	}, [inviteState?.success, router]);

	if (inviteState?.success) {
		return (
			<div className="flex flex-col items-center gap-2">
				<h1 className="text-3xl font-medium text-center text-purple-600">
					MFLOW
				</h1>
				<p className="text-gray-600">Redirigiendo...</p>
			</div>
		);
	}

	if (!version || !project || !token) {
		return (
			<div className="flex flex-col items-center">
				<h1 className="text-3xl font-medium text-center text-purple-600">
					MFLOW
				</h1>
				<div>Esta invitación es inválida o ha expirado</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-2">
			<h1 className="text-3xl font-medium text-center text-purple-600">
				MFLOW
			</h1>
			<div>
				¿Deseas acceder a la versión <strong>{version.title}</strong> del
				proyecto <strong>{project.title}</strong> (solo lectura)?
			</div>
			<div className="grid grid-cols-2 w-full gap-2">
				<Button
					as="a"
					href="/dashboard"
					className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
					variant="outline"
				>
					Rechazar invitación
				</Button>
				<Button
					onClick={acceptInvitation}
					className="w-full mt-3 bg-gray-100 text-gray-700 hover:bg-gray-200"
					disabled={isInvitePending}
				>
					{isInvitePending ? "Aceptando..." : "Aceptar invitación"}
				</Button>
			</div>
			{inviteState?.error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg w-full text-center">
					<p className="text-sm text-red-600">{inviteState.error}</p>
				</div>
			)}
		</div>
	);
};
