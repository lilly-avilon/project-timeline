import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const hasBackend = !!supabase;

export async function fetchProjects(workspaceId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('workspaces')
    .select('projects')
    .eq('id', workspaceId)
    .single();
  if (error) return [];
  return data?.projects ?? [];
}

export async function saveProjectsToDB(workspaceId, projects) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('workspaces')
    .upsert({ id: workspaceId, projects, updated_at: new Date().toISOString() });
  return !error;
}
