import { supabase } from './supabaseClient';

export async function fetchWorkspacesMissingMailboxes() {
  const { data, error } = await supabase
    .from('mismatched_mailboxes_view')
    .select('*')

  if (error) throw error;
  return data;
}