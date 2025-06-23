import { supabase } from './supabaseClient';

export async function fetchWorkspaces() {
  const { data, error } = await supabase
    .from('workspaces_view')
    .select('*')

  if (error) throw error;
  return data;
}
