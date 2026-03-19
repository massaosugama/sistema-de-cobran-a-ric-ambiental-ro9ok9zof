import { supabase } from '@/lib/supabase/client'

export async function getSettlementsByUc(uc: string) {
  const { data, error } = await supabase.from('settlements').select('*').eq('uc', uc)
  if (error) throw error
  return data || []
}

export async function getContactHistory(uc: string) {
  const { data, error } = await supabase
    .from('contact_history')
    .select('*, profiles:operator_id(name)')
    .eq('uc', uc)
    .order('created_at', { ascending: false })
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
