import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const EDGE_FUNCTION_URL = process.env.EDGE_FUNCTION_URL;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const intervalHours = Number(process.env.JOB_INTERVAL_HOURS) || 8;
const intervalMs = intervalHours * 60 * 60 * 1000;

async function getWorkspaces() {
    const { data, error } = await supabase
      .from('workspaces')
      .select('id')
      .eq('is_active', true);
  
    if (error) {
      throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }
  
    return data;
}

async function callEdgeFunctions(workspaceId) {
  const endpoints = ['sync-instantly-data', 'sync-instantly-campaign-analytics', 'sync-instantly-leads'];
  const start = process.env.START_DATE ?? null;
  const end = process.env.END_DATE ?? null;

  for (const fn of endpoints) {
    console.log(`${EDGE_FUNCTION_URL}/${fn}`);
    const { data, error } = await supabase.functions.invoke(fn, {
        body: { name: 'Functions', workspaceId, start, end },
    })

    if (error) {
      console.error(`Failed to call ${fn} for ${workspaceId}: ${error}`);
    } else {
      console.log(`✅ ${fn} for ${workspaceId} succeeded`);
    }

    await sleep(60000);
  }
}

async function runJob() {
  try {
    const workspaces = await getWorkspaces();
    for (const ws of workspaces) {
      console.log(`▶️ Processing workspace ${ws.id}`);
      await callEdgeFunctions(ws.id);
    }
    console.log('🎉 All done');
  } catch (error) {
    console.error('Job failed:', error);
    process.exit(1);
  }
}

async function mainLoop() {
    while (true) {
      await runJob();
      console.log(`⏳ Waiting ${intervalHours} hours before next run...`);
      await sleep(intervalMs);
    }
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

mainLoop();
