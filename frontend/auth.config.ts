import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { type AdapterUser } from "next-auth/adapters";
import { CustomUser } from "./types/next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          throw new Error("Invalid credentials format");
        }

        const { email, password } = parsedCredentials.data;

        try {
          const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          });

          if (!res.ok) {
            const errorData = await res.json();
            console.log("errordata", errorData);
            return null;
            // throw new Error(errorData.message || "Failed to authenticate");
          }

          const response = await res.json();
          if (response.user) {
            return response.user;
          } else {
            return null;
          }
        } catch (error) {
          console.error("Authentication error:", error);
          // throw new Error(error instanceof Error ? error.message : "Failed to authenticate");
          return;
        }
      },
    }),
  ],
  callbacks: {
    // Attach custom user properties to the session
    async session({ session, token }) {
      session.user = token.user as CustomUser; // Pass the user object to the session
      session.user.currentRole = "MODELADOR";
      return session;
    },
    // Add user data to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.user = user as CustomUser; // Store the user in the token
        // token.currentRole = user.currentRole
      }
      return token;
    },
  },
};

export const { signIn, auth, signOut } = NextAuth(authConfig);
