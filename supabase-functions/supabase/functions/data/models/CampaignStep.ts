export interface CampaignStep {
    campaign_id: string;
    step_number: number;
    delay: number;
    emails_sent: number;
    created_at: Date;
}