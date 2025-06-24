import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Repository } from "../data/Repository.ts";
import { TableName } from "../data/TableName.ts";
import { Workspace } from "../data/models/Workspace.ts";
import { InstantlyClient } from "../clients/instantly/InstantlyClient.ts";
import { ListAccountApiResponse } from "../clients/instantly/models/ListAccountApiResponse.ts";
import { Mapper } from "../utils/Mapper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.4";
import { Campaign } from "../data/models/Campaign.ts";
import { CampaignStep } from "../data/models/CampaignStep.ts";
import { DailyCampaignAnalytics } from "../data/models/DailyCampaignAnalytics.ts";


const supabaseUrl = 'https://iwiimtkjdrvpcaqosquh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aWltdGtqZHJ2cGNhcW9zcXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwNjg0MCwiZXhwIjoyMDY1NzgyODQwfQ.GuZPzyEsfv23JZRiS0bvt2zJP-gVhKEDxquluPhWnn8'

const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);

const workspaceRepository = new Repository<Workspace>(TableName.Workspaces, supabaseClient);
const campaignRepository = new Repository<Campaign>(TableName.Campaigns, supabaseClient);
const stepAnalyticsRepository = new Repository<CampaignStep>(TableName.CampaignStep, supabaseClient);
const dailyAnalyticsRepository = new Repository<DailyCampaignAnalytics>(TableName.DailyCampaignAnalytics, supabaseClient);
const instantlyClient = new InstantlyClient();

const toISOStringDate = (date: Date) => date.toISOString().split('T')[0];


serve(async (req) => {
  try {
    const now = new Date();
    let start = toISOStringDate(new Date(now.getFullYear(), now.getMonth(), 1));
    let end = toISOStringDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    
    const { workspaceId, start: reqStart, end: reqEnd } = await req.json();
    start = reqStart ?? start;
    end = reqEnd ?? end;

    if (!workspaceId) {
      return new Response(JSON.stringify({ error: "Missing workspace_id in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ws: Workspace | null = await workspaceRepository.findOne({ id: workspaceId });

    if (!ws?.api_key) {
      console.log('No Api key found for workspace ', ws?.name);
      return;
    }

    const campaignResponses = await instantlyClient.getCampaigns(ws.api_key);

    if (campaignResponses && campaignResponses.length > 0) {
      const campaignEntities = Mapper.mapCampaignResponsesToCampaigns(campaignResponses, ws.id);

      for (const campaignEntity of campaignEntities) {
        console.log('getting campaign details');
        const metaData = await instantlyClient.getCampaignDetails(ws.api_key, campaignEntity.id);  
        const steps = metaData.sequences?.[0]?.steps ?? [];
        const delays = steps.map(step => step.delay ?? 2);
        campaignEntity.delays = delays;
        console.log('getting step data');
        const instantlyStepData = await instantlyClient.getCampaignStepAnalytics(
          ws.api_key,
          campaignEntity.id,
          start, 
          end
        )
        const stepEntities = Mapper.mapStepAnalyticsToCampaignSequence(
          campaignEntity.id,
          instantlyStepData,
          delays);

        await stepAnalyticsRepository.upsert(stepEntities);
        console.log('getting daily analytics');
        const dailyAnalytics = await instantlyClient.getDailyCampaignAnalytics(ws.api_key,
           campaignEntity.id, start, end);

        const dailyEntities = Mapper.mapDailyAnalyticsResponseToDailyAnalytics(campaignEntity.id, dailyAnalytics);
        await dailyAnalyticsRepository.upsert(dailyEntities, ['campaign_id', 'date']);
      }

      await campaignRepository.upsert(campaignEntities);

    } else {
      console.log('no campaign responses received, skipping');
    }

    return new Response(JSON.stringify({ status: "synced" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
});