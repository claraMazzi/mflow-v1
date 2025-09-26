"use client"
import { useState, useEffect, useCallback } from "react"
import { getAllDeletionRequests } from "@components/dashboard/deletion-requests/actions/get-deletion-requests"
import { DeletionRequest } from "#types/deletion-request"

export const useDeletionRequests = () => {
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeletionRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getAllDeletionRequests()
      if (response.data && response.data.count > 0) {
        setDeletionRequests(response.data.deletionRequests)
      } else {
        setDeletionRequests([])
      }
    } catch (err) {
      setError("Failed to fetch deletion requests")
      console.error("Error fetching deletion requests:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeletionRequests()
  }, [fetchDeletionRequests])

  // Return refresh function to manually trigger reload
  return {
    deletionRequests,
    isLoading,
    error,
    refreshDeletionRequests: fetchDeletionRequests,
  }
}
