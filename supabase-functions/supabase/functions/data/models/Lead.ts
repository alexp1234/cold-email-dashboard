export interface Lead {
    id: string;
    name: string;
    company_name: string;
    email: string;
    phone: string;
    status: string;
    title: string;
    campaign_id: string;
    date_added: Date;
    instantly_url: string;
    last_interest_change_date?: Date;
}