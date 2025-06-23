export interface Client {
    name: string
    daily_capacity: number
    pending_emails: number
    runway_days: number
    daily_metrics: Record<string, DailyMetrics>
}

interface DailyMetrics {
    emails_sent: number
    opportunities: number
}
  
