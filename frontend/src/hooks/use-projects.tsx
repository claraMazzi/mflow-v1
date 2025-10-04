"use client"
import { useState, useEffect, useCallback } from "react"
import type { ProjectEntity } from "#types/project"
import { getProjects, getSharedProjects } from "../components/dashboard/projects/actions/get-projects"

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getProjects()

      console.log('RESPONSE PRoJECTS', response);
      if (response.data && response.data.count > 0) {
        setProjects(response.data.projects)
      } else {
        setProjects([])
      }
    } catch (err) {
      setError("Failed to fetch projects")
      console.error("Error fetching projects:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Return refresh function to manually trigger reload
  return {
    projects,
    isLoading,
    error,
    refreshProjects: fetchProjects,
  }
}


export const useSharedProjects = () => {
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getSharedProjects()
      if (response.data && response.data.count > 0) {
        setProjects(response.data.projects)
      } else {
        setProjects([])
      }
    } catch (err) {
      setError("Failed to fetch projects")
      console.error("Error fetching projects:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Return refresh function to manually trigger reload
  return {
    projects,
    isLoading,
    error,
    refreshProjects: fetchProjects,
  }
}