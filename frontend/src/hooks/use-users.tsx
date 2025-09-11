"use client"
import { useState, useEffect, useCallback } from "react"
import { getUsers } from "@components/dashboard/users/actions/get-users"
import { User } from "#types/user"

export const useUsers = () => {
  const [users, setUser] = useState<User[]>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getUsers()
      if (response.data && response.data.count > 0) {
        setUser(response.data.users)
      } else {
        setUser([])
      }
    } catch (err) {
      setError("Failed to fetch users")
      console.error("Error fetching users:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Return refresh function to manually trigger reload
  return {
    users,
    isLoading,
    error,
    refreshUsers: fetchUsers,
  }
}
