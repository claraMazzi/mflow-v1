import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import type { CustomUser } from "#types/next-auth"
import NextAuth from "next-auth"

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    //how long in seconds the session is valid
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          throw new Error("Invalid credentials format")
        }

        const { email, password } = parsedCredentials.data

        try {
          const res = await fetch(`${process.env.API_URL}/api/auth/login`, {
            method: "POST",
            body: JSON.stringify({ email, password }),
            headers: { "Content-Type": "application/json" },
          })

          if (!res.ok) {
            console.error(`Authentication failed with status: ${res.status}`)
            return null
          }

          // Check if the response has content before parsing
          const text = await res.text()
          if (!text) {
            console.error("Empty response from authentication API")
            return null
          }

          // Try to parse the JSON
          try {
            const response = JSON.parse(text)
            if (response.user) {
              return response.user
            } else {
              console.error("No user object in response:", response)
              return null
            }
          } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError, "Response text:", text)
            return null
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    // Attach custom user properties to the session
    async session({ session, token }) {
      session.user = token.user as CustomUser // Pass the user object to the session
      return session
    },
    // Add user data to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.user = user as CustomUser // Store the user in the token
        // token.currentRole = user.currentRole
      }
      return token
    },
  },
}

export const { signIn, auth, signOut, handlers } = NextAuth(authConfig);
