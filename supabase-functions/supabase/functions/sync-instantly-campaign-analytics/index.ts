import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Repository } from "../data/Repository.ts";
import { TableName } from "../data/TableName.ts";
import { Workspace } from "../data/models/Workspace.ts";
import { InstantlyClient } from "../clients/instantly/InstantlyClient.ts";
import { Mapper } from "../utils/Mapper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.4";
import { CampaignAnalytics } from "../data/models/CampaignAnalytics.ts";

const supabaseUrl = 'https://iwiimtkjdrvpcaqosquh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aWltdGtqZHJ2cGNhcW9zcXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwNjg0MCwiZXhwIjoyMDY1NzgyODQwfQ.GuZPzyEsfv23JZRiS0bvt2zJP-gVhKEDxquluPhWnn8'

const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);

const workspaceRepository = new Repository<Workspace>(TableName.Workspaces, supabaseClient);
const campaignAnalyticsRepository = new Repository<CampaignAnalytics>(TableName.CampaignAnalytics, supabaseClient);

const instantlyClient = new InstantlyClient();
const toISOStringDate = (date: Date) => date.toISOString().split('T')[0];

serve(async (req) => {
  const now = new Date();
  let start = toISOStringDate(new Date(now.getFullYear(), now.getMonth(), 1));
  let end = toISOStringDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  
  const { workspaceId, start: reqStart, end: reqEnd } = await req.json();
  start = reqStart ?? start;
  end = reqEnd ?? end;

  const ws: Workspace | null = await workspaceRepository.findOne({id: workspaceId});
  if (!ws?.api_key) {
    console.log('workspace or api key not found.');
    return;
  }

  try {
    const instantlyAnalyticsData = await instantlyClient.getCampaignAnalytics(ws.api_key, start, end);
    const mappedEntities = Mapper.mapAnalyticsResponseToAnalytics(instantlyAnalyticsData, ws.id, now.getMonth() + 1, 
      now.getFullYear()); 
    await campaignAnalyticsRepository.upsert(mappedEntities);
  } catch (err) {
    console.error(`Failed to sync analytics for workspace ${ws.name}:`, err);
  }
  
  return new Response(JSON.stringify({ status: "Synced Campaign Analytics for " + ws?.name }), {
    headers: { "Content-Type": "application/json" },
  });
})