export interface EmailAnalyticsResponse {
    email_date_data: {
      [email: string]: {
        [date: string]: {
          sent: number;
          landed_inbox: number;
          received: number;
          landed_spam?: number;
        };
      };
    };
    aggregate_data: {
      [email: string]: {
        sent: number;
        landed_inbox: number;
        landed_spam?: number;
        received: number;
        health_score_label: string;
        health_score: number;
      };
    };
  }