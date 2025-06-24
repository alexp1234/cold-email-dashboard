import { useEffect, useState } from "react";
import type { Client } from "../types/client";
import { supabase } from '../api/supabaseClient';

interface UseClientMetricsProps {
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
}

interface ClientMetricsRow {
  workspace_id: string;
  workspace_name: string;
  date: string;
  daily_capacity: number;
  pending_emails: number;
  runway_days: number;
  emails_sent: number;
  opportunities: number;
}

export function useClientMetrics({ startDate, endDate, workspaceId }: UseClientMetricsProps) {
  const [data, setData] = useState<Client[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from('client_metrics')
          .select('*')
          .order('date', { ascending: true });

        if (workspaceId) {
          query = query.eq('workspace_id', workspaceId);
        }
        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data: rows, error } = await query;

        if (error) {
          throw error;
        }

        const grouped: Record<string, Client> = {};

        for (const row of rows as ClientMetricsRow[]) {
          if (!grouped[row.workspace_name]) {
            grouped[row.workspace_name] = {
              name: row.workspace_name,
              daily_capacity: row.daily_capacity,
              pending_emails: row.pending_emails,
              runway_days: row.runway_days,
              daily_metrics: {},
            };
          }

          grouped[row.workspace_name].daily_metrics[row.date] = {
            emails_sent: row.emails_sent,
            opportunities: row.opportunities,
          };
        }

        setData(Object.values(grouped));
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [startDate, endDate, workspaceId]);

  return { data, loading, error };
}
