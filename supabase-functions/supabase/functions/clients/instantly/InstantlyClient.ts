import { GetCampaignDetailsApiResponse } from "./models/GetCampaignDetailsApiResponse.ts";
import { GetCampaignStepAnalyticsApiResponse } from "./models/GetCampaignStepAnalyticsApiResponse.ts";
import { ListAccountApiResponse } from "./models/ListAccountApiResponse.ts";
import { ListCampaignAnalyticsApiResponse } from "./models/ListCampaignAnalyticsApiResponse.ts";
import { ListCampaignsApiResponse } from "./models/ListCampaignsApiResponse.ts";
import { ListDailyCmapaignApiResponse } from "./models/ListDailyCampaignAnalyticsResponse.ts";
import { ListLeadsApiResponse } from "./models/ListLeadsApiResponse.ts";


export class InstantlyClient { 
  private readonly BASE_API_URL = 'https://api.instantly.ai/api/v2';
  private readonly LIMIT = 100;

  private readonly INTERESTED_LEAD_FILTERS = [
    'FILTER_LEAD_INTERESTED',
    'FILTER_LEAD_MEETING_BOOKED',
    'FILTER_LEAD_MEETING_COMPLETED',
    'FILTER_LEAD_CLOSED',
    'FILTER_LEAD_CUSTOM_LABEL_POSITIVE'
  ]

  async getAccounts(apiKey: string): Promise<ListAccountApiResponse[]> {
    let results: ListAccountApiResponse[] = [];
    let startingAfter: string | undefined = undefined;

    while (true) {
      const instantlyApiUrl = `${this.BASE_API_URL}/accounts?limit=${this.LIMIT}`;
      
      const url = startingAfter ? `${instantlyApiUrl}&starting_after=${startingAfter}` 
        : instantlyApiUrl;

      const res = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch accounts: ${res.status} ${res.statusText}`);
      }

      const response: ListAccountApiResponse = await res.json();
      
      if (response) {
        results.push(response);
      } else {
        console.log('Failed to retrieve accounts');
      }

      if (!response.next_starting_after) {
        break;
      }

      startingAfter = response.next_starting_after;
    }

    return results;
  }

  async getCampaigns(apiKey: string): Promise<ListCampaignsApiResponse[]> {
      try {
        const instantlyApiUrl = `${this.BASE_API_URL}/campaigns`;
        let allCampaigns: ListCampaignsApiResponse[] = [];
        let startingAfter: string | undefined = undefined;
        let hasMore = true;
    
        while (hasMore) {
          const url = `${instantlyApiUrl}?limit=${this.LIMIT}${
            startingAfter ? `&starting_after=${startingAfter}` : ''
          }`;
    
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            }
          });
    
          if (!response.ok) {
            throw new Error(`Failed to fetch campaigns: ${response.status}`);
          }
    
          const data = await response.json() as ListCampaignsApiResponse;
          allCampaigns.push(data);
          startingAfter = data.next_starting_after;
          hasMore = !!startingAfter;
        }
    
        return allCampaigns;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw new Error('Failed to retrieve campaigns');
      }
  }

  async getLeads(apiKey: string): Promise<ListLeadsApiResponse[]> {
    try {
      const instantlyApiUrl = `${this.BASE_API_URL}/leads/list`;
      let allLeadResponses: ListLeadsApiResponse[] = [];
      let startingAfter: string | undefined = undefined;
      
      for (const interestedFilter of this.INTERESTED_LEAD_FILTERS) {
        let hasMore = true;

        while (hasMore) {  
          const response = await fetch(instantlyApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              filter: interestedFilter,
              limit: this.LIMIT,
              starting_after: startingAfter
            })
          });
    
          if (!response.ok) {
            throw new Error(`Failed to fetch leads: ${response.status}`);
          }
  
          const data = await response.json() as ListLeadsApiResponse;
          console.log('response received with after ', data.next_starting_after);
  
          allLeadResponses.push(data);
          startingAfter = data.next_starting_after;
          hasMore = !!startingAfter;
        }
      }

      return allLeadResponses
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw new Error('Failed to retrieve leads');
    }
  }

  async getCampaignAnalytics(apiKey: string, start: string, end: string)
  : Promise<ListCampaignAnalyticsApiResponse[]> {
    try {
      const instantlyApiUrl = `${this.BASE_API_URL}/campaigns/analytics`;
      const url = `${instantlyApiUrl}?start_date=${start}&end_date=${end}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      return await response.json() as ListCampaignAnalyticsApiResponse[];
    } catch (error) {
      console.error(error);
      throw new Error('Failed to retrieve analytics data');
    }
  }

  async getCampaignDetails(apiKey: string, campaignId: string)
    : Promise<GetCampaignDetailsApiResponse> {
      const url = `${this.BASE_API_URL}/campaigns/${campaignId}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      return await response.json() as GetCampaignDetailsApiResponse;
    }

  async getCampaignStepAnalytics(apiKey: string,
    campaignId: string,
    start: string, 
    end: string)
    : Promise<GetCampaignStepAnalyticsApiResponse[]> {
      const url = `${this.BASE_API_URL}/campaigns/analytics/steps?campaign_id=${campaignId}&start_date=${start}&end_date=${end}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      return await response.json() as GetCampaignStepAnalyticsApiResponse[]
  }

  async getDailyCampaignAnalytics(
    apiKey: string, 
    campaignId: string, 
    start: string,
    end: string)
    : Promise<ListDailyCmapaignApiResponse[]> {
      const url = `${this.BASE_API_URL}/campaigns/analytics/daily?campaign_id=${campaignId}&start_date=${start}&end_date=${end}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      return await response.json() as ListDailyCmapaignApiResponse[]
  }
}
