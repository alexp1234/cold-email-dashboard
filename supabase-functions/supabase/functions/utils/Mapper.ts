import { GetCampaignStepAnalyticsApiResponse } from "../clients/instantly/models/GetCampaignStepAnalyticsApiResponse.ts";
import { ListAccountApiResponse } from "../clients/instantly/models/ListAccountApiResponse.ts";
import { ListCampaignAnalyticsApiResponse } from "../clients/instantly/models/ListCampaignAnalyticsApiResponse.ts";
import { ListCampaignsApiResponse } from "../clients/instantly/models/ListCampaignsApiResponse.ts";
import { ListDailyCmapaignApiResponse } from "../clients/instantly/models/ListDailyCampaignAnalyticsResponse.ts";
import { ListLeadsApiResponse } from "../clients/instantly/models/ListLeadsApiResponse.ts";
import { Campaign } from "../data/models/Campaign.ts";
import { CampaignAnalytics } from "../data/models/CampaignAnalytics.ts";
import { CampaignStep } from "../data/models/CampaignStep.ts";
import { DailyCampaignAnalytics } from "../data/models/DailyCampaignAnalytics.ts";
import { Lead } from "../data/models/Lead.ts";
import { Mailbox } from "../data/models/Mailbox.ts";

export class Mapper {
    static mapAccountsToMailboxes(
        responses: ListAccountApiResponse[],
        workspaceId: string
      ): Mailbox[] {
        return responses.flatMap(res =>
          res.items.map(item => ({
            workspace_id: workspaceId,
            email: item.email,
            name: `${item.first_name} ${item.last_name}`.trim(),
            limit: item.daily_limit,
            health_score: String(item.stat_warmup_score) + '%',
            missing_in_instantly: false
          }))
        );
    }

    static mapCampaignResponsesToCampaigns(
        responses: ListCampaignsApiResponse[],
        workspaceId: string
      ): Campaign[] {
        const campaignStatusMap = new Map<number, string>([
          [0, "Draft"],
          [1, "Active"],
          [2, "Paused"],
          [3, "Completed"],
          [4, "Running Subsequences"],
          [-99, "Account Suspended"],
          [-1, "Accounts Unhealthy"],
          [-2, "Bounce Protect"],
        ]);
      
        return responses.flatMap((response) =>
          response.items.map((item) => {
            const scheduleDays = item.schedules?.[0]?.days
              ? Object.entries(item.schedules[0].days)
                  .filter(([_, value]) => value)
                  .map(([dayKey]) => parseInt(dayKey, 10))
              : [1, 2, 3, 4, 5];
      
            const delays = item.sequences?.[0]?.steps
              ? item.sequences[0].steps.map(step => step.delay ?? 2)
              : [];
      
            return {
              id: item.id,
              name: item.name,
              status: campaignStatusMap.get(item.status) ?? "Unknown",
              created_at: new Date(item.timestamp_created),
              updated_at: new Date(item.timestamp_updated),
              daily_limit: item.daily_limit,
              workspace_id: workspaceId,
              schedule_days: scheduleDays,
              delays: delays,
            };
          })
        );
    }
      
    static mapLeadsResponsesToLeads(responses: ListLeadsApiResponse[])
    : Lead[] {
        return responses.flatMap((response) =>
            response.items.map((item) => ({
              id: item.id,
              name: [item.first_name, item.last_name].filter(Boolean).join(" ").trim(),
              email: item.email,
              company_name: item.company_name ?? '',
              phone: item.phone ?? '',
              status: 'INTERESTED',
              title: item.personalization ?? '',
              campaign_id: item.campaign,
              date_added: new Date(item.timestamp_created),
              instantly_url: `https://app.instantly.ai/leads/${item.id}`,
              last_interest_change_date: item.timestamp_last_interest_change ? new Date(item.timestamp_last_interest_change)
                : undefined
            }))
          );
    }

    static mapAnalyticsResponseToAnalytics(data: ListCampaignAnalyticsApiResponse[],
         workspaceId: string, month: number, year: number)
    : CampaignAnalytics[] {
        return data.map((item) => ({
            id: `${item.campaign_id}-${month}-${year}`,
            campaign_id: item.campaign_id,
            emails_sent_count: item.emails_sent_count,
            total_opportunities: item.total_opportunities,
            workspace_id: workspaceId,
            month: month,
            year: year,
            leads_count: item.leads_count
          }));
    }

    static mapStepAnalyticsToCampaignSequence(
        campaignId: string,
        stepAnalytics: GetCampaignStepAnalyticsApiResponse[],
        delays: number[]
    )
    : CampaignStep[] {
        return stepAnalytics.map((stepData) => {
            const stepIndex = stepData.step - 1;
            const delay = delays[stepIndex] ?? 0;
        
            return {
              campaign_id: campaignId,
              step_number: stepData.step,
              delay,
              emails_sent: stepData.sent,
              created_at: new Date()
            };
          });
    }

    static mapDailyAnalyticsResponseToDailyAnalytics(campaignId: string, dailyCampaignAnalytics: ListDailyCmapaignApiResponse[])
    : DailyCampaignAnalytics[] {
        return dailyCampaignAnalytics.map(({ date, sent }) => ({
            campaign_id: campaignId,
            date,
            sent,
          }));
    }
}