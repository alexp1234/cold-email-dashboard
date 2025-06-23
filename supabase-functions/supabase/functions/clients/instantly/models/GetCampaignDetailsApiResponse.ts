export interface GetCampaignDetailsApiResponse {
    sequences: Array<{
      steps: Array<{
        delay: number;
      }>
    }>;
    campaign_schedule: {
      schedules: Array<{
        days: {
          [day: string]: boolean;
        }
      }>
    };
  };