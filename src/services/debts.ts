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
  phones: { number: string; status: 'a_verificar' | 'validado' | 'invalido' }[]
  invoices: { ref: string; value: number; days: number }[]
  redundancyAlert?: { operator: string; daysAgo: number }
  lastContactDate?: string
  lastOperatorName?: string
}

function parseDebtRow(
  row: any,
  phoneStatus: 'a_verificar' | 'validado' | 'invalido' = 'a_verificar',
): ParsedDebt {
  const phones = []
  if (row.pessoa_fatura_celular)
    phones.push({ number: row.pessoa_fatura_celular, status: phoneStatus })
  if (row.proprietario_celular && row.proprietario_celular !== row.pessoa_fatura_celular)
    phones.push({ number: row.proprietario_celular, status: phoneStatus })
  if (
    row.responsavel_celular &&
    row.responsavel_celular !== row.pessoa_fatura_celular &&
    row.responsavel_celular !== row.proprietario_celular
  )
    phones.push({ number: row.responsavel_celular, status: phoneStatus })

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

export async function getDebts(search?: string, operatorId?: string) {
  let query = supabase.from('pending_debts').select('*').order('valor_total', { ascending: false })
  if (search) {
    query = query.or(
      `uc.ilike.%${search}%,pessoa_fatura_nome.ilike.%${search}%,pessoa_fatura_cpf_cnpj.ilike.%${search}%`,
    )
  }
  const { data: debts, error } = await query
  if (error) throw error

  let attendedUcs = new Set<string>()
  let latestContactDates: Record<string, string> = {}
  let globalLatestOperator: Record<string, string> = {}

  const contactsQuery: any = supabase
    .from('contact_history')
    .select('uc, cod_pess_fat, created_at, operator_id, profiles(name)')

  const { data: contacts, error: contactsError } = await contactsQuery
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (!contactsError && contacts) {
    for (const contact of contacts) {
      if (contact.uc && contact.cod_pess_fat) {
        const key = `${contact.uc}_${contact.cod_pess_fat}`

        if (!globalLatestOperator[key]) {
          const opName = (contact.profiles as any)?.name
          if (opName) {
            globalLatestOperator[key] = opName
          }
        }

        if (operatorId && contact.operator_id === operatorId) {
          attendedUcs.add(key)
          if (!latestContactDates[key]) {
            latestContactDates[key] = contact.created_at
          }
        }
      }
    }
  }

  const parsedDebts = (debts || []).map((row) => parseDebtRow(row))

  const unattended: ParsedDebt[] = []
  const attended: ParsedDebt[] = []

  for (const debt of parsedDebts) {
    const key = `${debt.uc}_${debt.personCode}`
    const lastOpName = globalLatestOperator[key]

    if (operatorId && attendedUcs.has(key)) {
      attended.push({
        ...debt,
        lastContactDate: latestContactDates[key],
        lastOperatorName: lastOpName,
      })
    } else {
      unattended.push({ ...debt, lastOperatorName: lastOpName })
    }
  }

  attended.sort((a, b) => {
    const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0
    const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0
    return dateB - dateA
  })

  return { unattended, attended }
}

export async function getDebtByUc(uc: string) {
  const { data, error } = await supabase
    .from('pending_debts')
    .select('*')
    .eq('uc', uc)
    .limit(1)
    .single()
  if (error) throw error

  const contactsQuery: any = supabase.from('contact_history').select('quality_result')

  const { data: contacts } = await contactsQuery
    .eq('uc', data.uc)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  let phoneValidationStatus: 'a_verificar' | 'validado' | 'invalido' = 'a_verificar'

  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      if (contact.quality_result) {
        try {
          const parsed = JSON.parse(contact.quality_result)
          if (parsed.phoneValidationStatus) {
            phoneValidationStatus = parsed.phoneValidationStatus
            break
          } else if (parsed.validatePhone !== undefined) {
            phoneValidationStatus = parsed.validatePhone ? 'validado' : 'a_verificar'
            break
          }
        } catch (e) {
          // ignore parsing errors for invalid json
        }
      }
    }
  }

  return parseDebtRow(data, phoneValidationStatus)
}
