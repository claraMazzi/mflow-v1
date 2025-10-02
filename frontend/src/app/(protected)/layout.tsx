"use client";

import Unauthorized from "@components/auth/Unauthorized";
import { auth } from "@lib/auth";
import { useSession } from "@node_modules/next-auth/react";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();

	if (!session) {
		return <Unauthorized />;
	}

	return <> {children}</>;
}
