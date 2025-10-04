"use client";

import Unauthorized from "@components/auth/Unauthorized";
import { useSession } from "@node_modules/next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();

	// Show loading state while session is being fetched
	if (status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-purple-400">
				<div className="text-white text-lg">Cargando...</div>
			</div>
		);
	}

	// Only show unauthorized if session is definitely not available
	if (!session) {
		return <Unauthorized />;
	}

	return <> {children}</>;
}
