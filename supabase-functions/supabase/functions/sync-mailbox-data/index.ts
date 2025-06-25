import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.4";
import { Campaign } from "../data/models/Campaign.ts";
import { TableName } from "../data/TableName.ts";
import { Repository } from "../data/Repository.ts";
import { InstantlyClient } from "../clients/instantly/InstantlyClient.ts";
import { Workspace } from "../data/models/Workspace.ts";
import { CampaignMailbox } from "../data/models/CampaignMailbox.ts";
import { Mapper } from "../utils/Mapper.ts";
import { Mailbox } from "../data/models/Mailbox.ts";
import { Tag } from "../data/models/Tag.ts";

const supabaseUrl = 'https://iwiimtkjdrvpcaqosquh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aWltdGtqZHJ2cGNhcW9zcXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwNjg0MCwiZXhwIjoyMDY1NzgyODQwfQ.GuZPzyEsfv23JZRiS0bvt2zJP-gVhKEDxquluPhWnn8'

const supabaseClient = createClient(
  supabaseUrl,
  supabaseKey
);
const campaignsRepository = new Repository<Campaign>(TableName.Campaigns, supabaseClient);
const workspaceRepository = new Repository<Workspace>(TableName.Workspaces, supabaseClient);
const campaignMailboxRepository = new Repository<CampaignMailbox>(TableName.CampaignMailbox, supabaseClient);
const tagRepository = new Repository<Tag>(TableName.CampaignMailbox, supabaseClient);

const instantlyClient = new InstantlyClient();

serve(async (req) => {
  const { workspaceId } = await req.json();
  const workspace = await workspaceRepository.findOne({id: workspaceId});

  if (!workspace?.api_key) {
    console.log('Workspace or API key not found.');
    return;
  }

  const tags = await instantlyClient.getTags(workspace.api_key);
  
  if (!tags || tags.length === 0) {
    console.log('no tags found for client');
  }

  const tagEntitites = Mapper.mapTagsResponseToTags(tags);

  await tagRepository.upsert(tagEntitites);

  const allCampaigns = await campaignsRepository.findAll();
  
  const activeWorkspaceCampaigns = allCampaigns
    .filter(c => c.status === 'Active'
      && c.workspace_id === workspaceId);

  for (const activeWorkspaceCampaign of activeWorkspaceCampaigns) {
    if (!activeWorkspaceCampaign.email_tag_list || activeWorkspaceCampaign.email_tag_list.length === 0) {
      console.log(`No Tags associated with campaign ${activeWorkspaceCampaign.id}`);
      continue;
    }
    
    const instantlyAccounts = await instantlyClient.getCampaignMailboxes(workspace.api_key, 
      activeWorkspaceCampaign.email_tag_list);

    const entities = Mapper.mapAccountsToCampaignMailboxes(instantlyAccounts, activeWorkspaceCampaign.id);

    await campaignMailboxRepository.delete({campaign_id: activeWorkspaceCampaign.id});
    await campaignMailboxRepository.upsert(entities);
  }

  return new Response(JSON.stringify({ status: "synced" }), {
    headers: { "Content-Type": "application/json" },
  });
})
