import { supabase } from '@/lib/supabase/client'

export interface ParsedDebt {
  id: string
  uc: string
  personCode: string
  name: string
  document: string
  address: string
  overdueDays: number
  totalDebt: number
  status: string
  nextAction?: string
  priority: 'alta' | 'media' | 'baixa'
  phones: { number: string; isValid: boolean }[]
  invoices: { ref: string; value: number; days: number }[]
  redundancyAlert?: { operator: string; daysAgo: number }
}

function parseDebtRow(row: any): ParsedDebt {
  const phones = []
  if (row.pessoa_fatura_celular) phones.push({ number: row.pessoa_fatura_celular, isValid: true })
  if (row.proprietario_celular && row.proprietario_celular !== row.pessoa_fatura_celular)
    phones.push({ number: row.proprietario_celular, isValid: true })
  if (
    row.responsavel_celular &&
    row.responsavel_celular !== row.pessoa_fatura_celular &&
    row.responsavel_celular !== row.proprietario_celular
  )
    phones.push({ number: row.responsavel_celular, isValid: true })

  const invoices = row.refs
    ? row.refs
        .split(' ')
        .map((ref: string) => ({ ref, value: row.valor_total / (row.qt_fats || 1), days: 30 }))
    : []

  return {
    id: row.uc,
    uc: row.uc,
    personCode: row.cod_pess_fat || '',
    name: row.pessoa_fatura_nome || row.ta_nome_de_quem || '',
    document: row.pessoa_fatura_cpf_cnpj || '',
    address: row.endereco || '',
    overdueDays: 45,
    totalDebt: row.valor_total || 0,
    status: 'pendente',
    priority: row.valor_total > 5000 ? 'alta' : row.valor_total > 1000 ? 'media' : 'baixa',
    phones,
    invoices,
  }
}

export async function getDebts(search?: string) {
  let query = supabase.from('pending_debts').select('*').order('valor_total', { ascending: false })
  if (search) {
    query = query.or(
      `uc.ilike.%${search}%,pessoa_fatura_nome.ilike.%${search}%,pessoa_fatura_cpf_cnpj.ilike.%${search}%`,
    )
  }
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(parseDebtRow)
}

export async function getDebtByUc(uc: string) {
  const { data, error } = await supabase.from('pending_debts').select('*').eq('uc', uc).single()
  if (error) throw error
  return parseDebtRow(data)
}
