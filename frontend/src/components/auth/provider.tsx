"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

// Simple NextAuth provider
export const NextAuthProvider = ({
    children
}: {
    children: ReactNode;
}) => {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}