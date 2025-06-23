export interface Mailbox {
    workspace_id: string;
    email: string;
    name: string;
    limit: number;
    health_score: string;
    missing_in_instantly: boolean;
}