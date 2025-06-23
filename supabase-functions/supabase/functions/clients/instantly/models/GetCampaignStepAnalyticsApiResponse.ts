export interface GetCampaignStepAnalyticsApiResponse {
    step: number;
    variant: number;
    sent: number;
    opened: number;
    unique_opened: number;
    replies: number;
    unique_replies: number;
    clicks: number;
    unique_clicks: number;
}