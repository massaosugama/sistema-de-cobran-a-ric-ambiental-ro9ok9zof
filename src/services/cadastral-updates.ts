import { supabase } from '@/lib/supabase/client'

export async function getPendingUpdates() {
  const { data, error } = await supabase
    .from('cadastral_updates')
    .select(`
      id,
      uc,
      cod_pess_fat,
      customer_name,
      status,
      notes,
      resolution_notes,
      created_at,
      requester:profiles!requester_id(name),
      resolver:profiles!resolver_id(name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error

  return data.map((item: any) => ({
    ...item,
    requester_name: item.requester?.name,
    resolver_name: item.resolver?.name,
  }))
}

export async function resolveUpdate(id: string, resolverId: string, resolutionNotes: string) {
  const { data, error } = await supabase
    .from('cadastral_updates')
    .update({
      status: 'completed',
      resolver_id: resolverId,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
    })
    .eq('id', id)

  if (error) throw error
  return data
}
