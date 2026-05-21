import { useEffect, useState } from "react"
import { apiClient } from "@/services/api"

export interface TeamBuildingActivity {
  id: number
  name: string
  type: string[]
  objectives: string[]
  experience: string[]
  les_plus: string[]
  keywords: string[]
}

export function useTeamBuilding() {
  const [activities, setActivities] = useState<TeamBuildingActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await apiClient.get("/team-building/activities")

        if (response.data.success && response.data.data) {
          setActivities(response.data.data)
        } else {
          setActivities([])
        }
      } catch (err) {
        // Activities are optional - graceful fallback
        console.error("Failed to load team building activities:", err)
        setActivities([])
        setError(null) // Don't show error since activities are optional
      } finally {
        setIsLoading(false)
      }
    }

    loadActivities()
  }, [])

  return {
    activities,
    isLoading,
    error,
    getActivityById: (id: number) =>
      activities.find((a) => a.id === id),
  }
}
