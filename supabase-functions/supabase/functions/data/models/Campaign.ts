export interface Campaign {
    id: string;
    name: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    daily_limit: number;
    workspace_id: string;
    schedule_days: number[];
    delays: number[];
    email_tag_list: string[];
}
