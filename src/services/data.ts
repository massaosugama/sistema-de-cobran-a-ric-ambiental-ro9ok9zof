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
