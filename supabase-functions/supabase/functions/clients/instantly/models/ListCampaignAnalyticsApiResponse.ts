export interface ListCampaignAnalyticsApiResponse {
    campaign_name: string;
    campaign_id: string;
    campaign_status: number;
    campaign_is_evergreen: boolean;
    leads_count: number;
    contacted_count: number;
    open_count: number;
    reply_count: number;
    link_click_count: number;
    bounced_count: number;
    unsubscribed_count: number;
    completed_count: number;
    emails_sent_count: number;
    new_leads_contacted_count: number;
    total_opportunities: number;
    total_opportunity_value: number;
}