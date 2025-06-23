import { useEffect, useState } from "react"
import type { Client } from "../types/client"

interface UseClientMetricsProps {
    workspaceId?: string
    startDate?: string // in 'YYYY-MM-DD' format
    endDate?: string   // in 'YYYY-MM-DD' format
}


export function useClientMetrics({startDate, endDate }: UseClientMetricsProps) {
    const [data, setData] = useState<Client[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
  
    useEffect(() => {
      async function fetchMetrics() {
        setLoading(true)
        setError(null)
  
        try {
          const baseUrl = import.meta.env.VITE_EDGE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1'

            const params = new URLSearchParams()
          // Build query params
          if (startDate) params.append('start_date', startDate)
          if (endDate) params.append('end_date', endDate)
  
          const url = `${baseUrl}/get-dashboard-data?${params.toString()}`
  
          const res = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
            },
          })
  
          if (!res.ok) {
            throw new Error(`Error fetching metrics: ${res.statusText}`)
          }
  
          const json: Client[] = await res.json()
          setData(json)
        } catch (e: any) {
          setError(e.message || 'Unknown error')
        } finally {
          setLoading(false)
        }
      }
  
      fetchMetrics()
    }, [startDate, endDate])
  
    return { data, loading, error }
  }