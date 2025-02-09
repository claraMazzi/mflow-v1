"use client"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/router"

export function RoleSwitcher() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRoleSwitch = async (newRole: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      })

      if (response.ok) {
        // Update the client-side session
        await update({
          ...session,
          user: {
            ...session?.user,
            currentRole: newRole,
          },
        })

        // Redirect to the appropriate dashboard
        router.push(`/dashboard/${newRole}`)
      } else {
        console.error("Failed to switch role")
      }
    } catch (error) {
      console.error("Error switching role:", error)
    }
    setIsLoading(false)
  }

  if (!session) return null

  return (
    <div>
      <h2>Switch Role</h2>
      {session.user.roles.map((role) => (
        <button
          key={role}
          onClick={() => handleRoleSwitch(role)}
          disabled={isLoading || role === session.user.currentRole}
        >
          {role}
        </button>
      ))}
    </div>
  )
}