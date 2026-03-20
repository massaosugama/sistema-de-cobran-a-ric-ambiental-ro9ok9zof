import { supabase } from '@/lib/supabase/client'

export async function getSettlementsByUc(uc: string) {
  const { data, error } = await supabase.from('settlements').select('*').eq('uc', uc)
  if (error) throw error
  return data || []
}

export async function getContactHistory(uc: string, codPessFat?: string) {
  let query = supabase.from('contact_history').select('*, profiles(name)').eq('uc', uc)

  if (codPessFat) {
    query = query.or(`cod_pess_fat.eq.${codPessFat},cod_pess_fat.is.null`)
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
