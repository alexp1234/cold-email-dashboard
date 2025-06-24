export interface ListCampaignsApiResponse {
  items: Array<{
    id: string;
    name: string;
    status: number;
    timestamp_created: string;
    timestamp_updated: string;
    daily_limit: number;
    organization: string;
    email_list: string[];
    sequences: Array<{
      steps: Array<{
        type: string;
        delay: number;
      }>;
    }>;
    schedules?: Array<{
      name: string;
      timezone: string;
      timing?: Record<string, unknown>;
      days: Record<string, boolean>;
    }>;
    email_tag_list: string[]
  }>;
  next_starting_after?: string;
}
