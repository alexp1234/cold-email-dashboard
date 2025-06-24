import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Client, DailyMetrics } from "./Client.ts";

const supabaseUrl = 'https://iwiimtkjdrvpcaqosquh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3aWltdGtqZHJ2cGNhcW9zcXVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwNjg0MCwiZXhwIjoyMDY1NzgyODQwfQ.GuZPzyEsfv23JZRiS0bvt2zJP-gVhKEDxquluPhWnn8'

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Change to specific domain in production
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function getDateRange(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      result.push(current.toISOString().slice(0, 10));
    }
    current.setDate(current.getDate() + 1);
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const startDate = url.searchParams.get("start_date") || "2025-01-01";
  const endDate = url.searchParams.get("end_date") || new Date().toISOString().slice(0, 10);
  const allDates = getDateRange(startDate, endDate);

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("is_active", true)
    .match(workspaceId ? { id: workspaceId } : {});

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  for (const ws of workspaces) {
    const wsId = ws.id;

    const { data: mailboxes } = await supabase
      .from("mailboxes")
      .select("limit")
      .eq("workspace_id", wsId);
    const daily_capacity = mailboxes?.reduce((acc, m) => acc + (m.limit ?? 0), 0) ?? 0;

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, delays")
      .eq("workspace_id", wsId);
    const campaignIds = campaigns?.map((c) => c.id) ?? [];
    if (!campaignIds.length) continue;

    const { data: analytics } = await supabase
      .from("campaign_analytics")
      .select("campaign_id, leads_count")
      .in("campaign_id", campaignIds);
    const analyticsByCampaign = Object.fromEntries(analytics?.map(a => [a.campaign_id, a.leads_count]) ?? []);

    const { data: sent } = await supabase
      .from("daily_campaign_analytics")
      .select("campaign_id, sum(sent) as total_sent")
      .in("campaign_id", campaignIds)
      .gte("date", startDate)
      .lte("date", endDate);
    const sentByCampaign = Object.fromEntries(sent?.map(r => [r.campaign_id, Number(r.total_sent)]) ?? []);

    let pending_emails = 0;
    for (const c of campaigns) {
      const leads = analyticsByCampaign[c.id] ?? 0;
      let delays = [];
      try {
        delays = Array.isArray(c.delays) ? c.delays : JSON.parse(c.delays ?? "[]");
      } catch {}
      const expected = leads * delays.length;
      const actual = sentByCampaign[c.id] ?? 0;
      pending_emails += Math.max(0, expected - actual);
    }

    const runway_days = daily_capacity > 0 ? Math.ceil(pending_emails / daily_capacity) : 0;

    const { data: dailySent } = await supabase
      .from("daily_campaign_analytics")
      .select("date, sent")
      .in("campaign_id", campaignIds)
      .gte("date", startDate)
      .lte("date", endDate);
    const sentByDate: Record<string, number> = {};
    for (const row of dailySent ?? []) {
      const d = row.date.slice(0, 10);
      sentByDate[d] = (sentByDate[d] || 0) + row.sent;
    }

    const { data: leads } = await supabase
      .from("leads")
      .select("last_interest_change_date")
      .in("campaign_id", campaignIds)
      .gte("last_interest_change_date", startDate)
      .lte("last_interest_change_date", endDate);
    const oppsByDate: Record<string, number> = {};
    for (const l of leads ?? []) {
      const d = l.last_interest_change_date?.slice(0, 10);
      if (d) oppsByDate[d] = (oppsByDate[d] || 0) + 1;
    }

    for (const d of allDates) {
      await supabase.from("client_metrics").upsert({
        workspace_id: ws.id,
        workspace_name: ws.name,
        date: d,
        daily_capacity,
        pending_emails,
        runway_days,
        emails_sent: sentByDate[d] ?? 0,
        opportunities: oppsByDate[d] ?? 0,
      });
    }
  }

  return new Response(JSON.stringify({ status: "done" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});