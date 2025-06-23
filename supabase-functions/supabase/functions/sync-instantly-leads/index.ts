import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { InstantlyClient } from "../clients/instantly/InstantlyClient.ts";
import { Lead } from "../data/models/Lead.ts";
import { TableName } from "../data/TableName.ts";
import { Repository } from "../data/Repository.ts";
import { Workspace } from "../data/models/Workspace.ts";
import { Mapper } from "../utils/Mapper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.4";

const supabaseUrl = 'https://iwiimtkjdrvpcaqosquh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aWltdGtqZHJ2cGNhcW9zcXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwNjg0MCwiZXhwIjoyMDY1NzgyODQwfQ.GuZPzyEsfv23JZRiS0bvt2zJP-gVhKEDxquluPhWnn8'

const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);

const workspaceRepository = new Repository<Workspace>(TableName.Workspaces, supabaseClient);
const leadsRepository = new Repository<Lead>(TableName.Leads, supabaseClient);

const instantlyClient = new InstantlyClient();

serve(async (req) => {
  const { workspaceId } = await req.json();

  if (!workspaceId) {
    return new Response(JSON.stringify({ error: "Missing workspace_id in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  //const workspaces: Workspace[] = await workspaceRepository.findOne(workspaceId);
  const ws = await workspaceRepository.findOne({id: workspaceId})
    if (!ws?.api_key) {
      console.log('No API key found for workspace', ws?.name);
      return;
    }

    try {
      const leadsApiResponses = await instantlyClient.getLeads(ws.api_key);
      if (leadsApiResponses && leadsApiResponses.length > 0) {
        const leadEntities = Mapper.mapLeadsResponsesToLeads(leadsApiResponses);
        await leadsRepository.upsert(leadEntities);
      } else {
        console.log('No leads responses received, skipping');
      }
    } catch (err) {
      console.error(`Failed to sync analytics for workspace ${ws.name}:`, err);
    }

  return new Response(JSON.stringify({ status: "Synced Campaign Analytics" }), {
    headers: { "Content-Type": "application/json" },
  });
});

