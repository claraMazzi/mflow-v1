import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { CustomUser } from "#types/next-auth";
import NextAuth from "next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    //how long in seconds the session is valid
    maxAge: 6 * 60 * 60, // 6h
  },
  jwt: {
    maxAge: 6 * 60 * 60, //6h
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      credentials: {},
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
            console.error(`Authentication failed with status: ${res.status}`);
            return null;
          }

          // Check if the response has content before parsing
          const text = await res.text();
          if (!text) {
            console.error("Empty response from authentication API");
            return null;
          }

          // Try to parse the JSON
          try {
            const response = JSON.parse(text);
            if (response.user) {
              return response;
            } else {
              console.error("No user object in response:", response);
              return null;
            }
          } catch (parseError) {
            console.error(
              "Failed to parse JSON response:",
              parseError,
              "Response text:",
              text
            );
            return null;
          }
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // When user signs in, add user data and auth token to JWT
      // When you call session.update() with custom values
      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        (token as any).lastName = session.user.lastName;
      }

      if (user) {
        // user here is the return value from authorize()
        // It should have the structure: { user: CustomUser, token: string }
        token.user = user.user as CustomUser;
        token.auth = user.token;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom user data and auth token to session
      if (token.user) {
        session.user = token.user as CustomUser;
      }
      
      if (token.auth) {
        session.auth = token.auth as string;
      }

      if (session.user) {
        if (token.name) {
          session.user.name = token.name as string;
        }
        if ((token as any).lastName) {
          (session.user as any).lastName = (token as any).lastName as string;
        }
      }
  
      return session;
    },
  },
};

export const { signIn, auth, signOut, handlers } = NextAuth(authConfig);
