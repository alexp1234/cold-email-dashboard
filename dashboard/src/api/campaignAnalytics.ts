import { supabase } from './supabaseClient';

export async function fetchCampaignAnalytics() {
  const { data, error } = await supabase
    .from('campaign_analytics_view')
    .select('*')

  if (error) throw error;
  return data;
}
