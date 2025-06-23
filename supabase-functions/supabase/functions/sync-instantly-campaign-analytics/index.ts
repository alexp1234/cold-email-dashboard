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

serve(async (req) => {
  const now = new Date();
  const toISOStringDate = (date: Date) => date.toISOString().split('T')[0];
  const start = toISOStringDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = toISOStringDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const workspaces: Workspace[] = await workspaceRepository.findAll();
  const syncPromises = workspaces.map(async (ws) => {
    if (!ws.api_key) {
      console.log('No API key found for workspace', ws.name);
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
  });

  await Promise.allSettled(syncPromises);
  
  return new Response(JSON.stringify({ status: "Synced Campaign Analytics" }), {
    headers: { "Content-Type": "application/json" },
  });
})