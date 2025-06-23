import { supabase } from './supabaseClient';

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads_with_clients_view')
    .select('*')

  if (error) throw error;
  return data;
}
