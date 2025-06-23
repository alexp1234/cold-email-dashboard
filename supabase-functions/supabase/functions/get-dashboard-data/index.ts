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
    result.push(current.toISOString().slice(0, 10));
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
  const allDatesInRange = getDateRange(startDate, endDate);

  // 1. Fetch workspaces
  const { data: workspaces, error: wsError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("is_active", true)
    .match(workspaceId ? { id: workspaceId } : {});

  if (wsError) {
    return new Response(JSON.stringify({ error: wsError.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const clients: Client[] = [];

  for (const ws of workspaces) {
    const wsId = ws.id;

    // 2. Daily capacity
    const { data: mailboxes } = await supabase
      .from("mailboxes")
      .select("limit")
      .eq("workspace_id", wsId);

    const daily_capacity = mailboxes?.reduce((acc, m) => acc + (m.limit ?? 0), 0) ?? 0;

    // 3. Campaigns with delays
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, delays")
      .eq("workspace_id", wsId);

    const campaignIds = campaigns?.map((c) => c.id) ?? [];

    if (campaignIds.length === 0) {
      clients.push({ name: ws.name, daily_capacity, pending_emails: 0, runway_days: 0, daily_metrics: {} });
      continue;
    }

    // 4. Get leads_count from campaign_analytics
    const { data: analytics } = await supabase
      .from("campaign_analytics")
      .select("campaign_id, leads_count")
      .in("campaign_id", campaignIds);

    const analyticsByCampaign = Object.fromEntries(
      analytics?.map((a) => [a.campaign_id, a.leads_count]) ?? []
    );

    // 5. Fetch total sent per campaign using sum()
    const { data: sentData } = await supabase
      .from("daily_campaign_analytics")
      .select("campaign_id, sum(sent) as total_sent")
      .in("campaign_id", campaignIds)
      .gte("date", startDate)
      .lte("date", endDate);

    const sentByCampaign = Object.fromEntries(
      sentData?.map((r) => [r.campaign_id, Number(r.total_sent)]) ?? []
    );

    // 6. Compute pending_emails
    let pending_emails = 0;
    for (const c of campaigns) {
      const leadsCount = analyticsByCampaign[c.id] ?? 0;

      let delaysArr: any[] = [];
      try {
        delaysArr = Array.isArray(c.delays)
          ? c.delays
          : JSON.parse(c.delays ?? "[]");
      } catch {
        delaysArr = [];
      }

      const stepCount = delaysArr.length;
      const expected = leadsCount * stepCount;
      const actual = sentByCampaign[c.id] ?? 0;
      pending_emails += Math.max(0, expected - actual);
    }

    const runway_days = daily_capacity > 0 ? Math.ceil(pending_emails / daily_capacity) : 0;

    // 7. Compute daily_metrics
    const sentByDate: Record<string, number> = {};
    const { data: dailySentData } = await supabase
      .from("daily_campaign_analytics")
      .select("date, sent")
      .in("campaign_id", campaignIds)
      .gte("date", startDate)
      .lte("date", endDate);

    for (const d of dailySentData ?? []) {
      const dateKey = d.date.slice(0, 10);
      sentByDate[dateKey] = (sentByDate[dateKey] || 0) + d.sent;
    }

    const oppsByDate: Record<string, number> = {};
    const { data: opps } = await supabase
      .from("leads")
      .select("last_interest_change_date")
      .in("campaign_id", campaignIds)
      .gte("last_interest_change_date", startDate)
      .lte("last_interest_change_date", endDate);

    for (const lead of opps ?? []) {
      if (!lead.last_interest_change_date) continue;
      const dateKey = lead.last_interest_change_date.slice(0, 10);
      oppsByDate[dateKey] = (oppsByDate[dateKey] || 0) + 1;
    }

    const daily_metrics: Record<string, DailyMetrics> = {};
    for (const dt of allDatesInRange) {
      daily_metrics[dt] = {
        emails_sent: sentByDate[dt] ?? 0,
        opportunities: oppsByDate[dt] ?? 0,
      };
    }

    clients.push({
      name: ws.name,
      daily_capacity,
      pending_emails,
      runway_days,
      daily_metrics,
    });
  }

  return new Response(JSON.stringify(clients), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});