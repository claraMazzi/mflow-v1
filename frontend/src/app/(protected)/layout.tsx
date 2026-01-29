"use client";

import Unauthorized from "@components/auth/Unauthorized";
import RoleRouteGuard from "@components/auth/RoleRouteGuard";
import { useSession } from "@node_modules/next-auth/react";
import { useEffect, useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const [loadingTimeout, setLoadingTimeout] = useState(false);

	// Add a timeout for loading states to prevent infinite loading
	useEffect(() => {
		if (status === "loading") {
			const timer = setTimeout(() => {
				setLoadingTimeout(true);
			}, 5000); // 5 second timeout

			return () => clearTimeout(timer);
		} else {
			setLoadingTimeout(false);
		}
	}, [status]);

	// Show loading state while session is being fetched (with timeout)
	if (status === "loading" && !loadingTimeout) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-purple-400">
				<div className="text-white text-lg">Cargando...</div>
			</div>
		);
	}

	// Show unauthorized if session is not available, status is unauthenticated, or loading timed out
	if (!session || status === "unauthenticated" || loadingTimeout) {
		return <Unauthorized />;
	}

	return (
		<RoleRouteGuard>
			{children}
		</RoleRouteGuard>
	);
}
