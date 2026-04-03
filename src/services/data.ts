import { supabase } from '@/lib/supabase/client'

export async function getSettlementsByUc(uc: string) {
  const { data, error } = await supabase.from('settlements').select('*').eq('uc', uc)
  if (error) throw error
  return data || []
}

export async function getContactHistory(uc: string, codPessFat?: string, userId?: string) {
  let isAdmin = false
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    isAdmin = !!profile?.is_admin
  }

  let query: any = supabase.from('contact_history').select('*, profiles(name)').eq('uc', uc)

  if (codPessFat) {
    query = query.or(`cod_pess_fat.eq.${codPessFat},cod_pess_fat.is.null`)
  }

  if (!isAdmin) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addContact(contact: any, task?: any) {
  const { data, error } = await supabase.from('contact_history').insert([contact])
  if (error) throw error

  if (task) {
    const { error: taskError } = await supabase.from('follow_up_tasks').insert([task])
    if (taskError) throw taskError
  }
  return data
}

export async function updateContact(id: string, updates: any) {
  const { data, error } = await supabase.from('contact_history').update(updates).eq('id', id)
  if (error) throw error
  return data
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from('contact_history').delete().eq('id', id)
  if (error) throw error
}

export async function deleteFollowUpTask(id: string) {
  const { error } = await supabase.from('follow_up_tasks').delete().eq('id', id)
  if (error) throw error
}

export async function getProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, first_name, email, last_login, role, is_admin, color')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getOperatorStats() {
  const { data, error } = await (supabase as any).rpc('get_operator_stats')
  if (error) {
    console.error('Error fetching operator stats:', error)
    return []
  }
  return data || []
}
