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
  valorVencido: number
  valorAVencer: number
  status: string
  nextAction?: string
  priority: 'alta' | 'media' | 'baixa'
  phones: { number: string; status: 'a_verificar' | 'validado' | 'invalido' }[]
  invoices: { ref: string; value: number; days: number | null }[]
  redundancyAlert?: { operator: string; daysAgo: number }
  lastContactDate?: string
  lastOperatorName?: string
  recentOperators?: string[]
  rawPessoaFaturaNome?: string | null
  rawPessoaFaturaCpfCnpj?: string | null
}

export function parseDebtRow(
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
        .split(/\s+/)
        .filter((r: string) => r.trim() !== '')
        .map((rawRef: string) => {
          let ref = rawRef.trim()
          if (ref.startsWith("'")) {
            ref = ref.substring(1)
          }

          let days: number | null = null

          if (ref !== 'NEG') {
            const parts = ref.split('/')
            if (parts.length === 2) {
              let y = parseInt(parts[0], 10)
              let m = parseInt(parts[1], 10)
              if (!isNaN(y) && !isNaN(m)) {
                if (y < 100) y += 2000
                const now = new Date()
                const currentYear = now.getFullYear()
                const currentMonth = now.getMonth() + 1
                const monthsDiff = (currentYear - y) * 12 + (currentMonth - m)
                days = monthsDiff * 30
              }
            }
          }
          return { ref, value: row.valor_total / (row.qt_fats || 1), days }
        })
    : []

  invoices.sort((a: any, b: any) => {
    if (a.days === null && b.days === null) return 0
    if (a.days === null) return 1
    if (b.days === null) return -1
    return a.days - b.days
  })

  const validInvoices = invoices.filter((i: any) => i.days !== null)
  const overdueDays =
    validInvoices.length > 0 ? Math.max(0, ...validInvoices.map((i: any) => i.days as number)) : 0

  let calcVencido = 0
  let calcAVencer = 0
  validInvoices.forEach((i: any) => {
    if (i.days > 0) calcVencido += i.value
    else calcAVencer += i.value
  })

  const dbVencido = Number(row.valor_vencido) || 0
  const dbAVencer = Number(row.valor_a_vencer) || 0
  const total = Number(row.valor_total) || 0

  let valorVencido = dbVencido
  let valorAVencer = dbAVencer

  if (dbVencido === 0 && dbAVencer === 0 && total > 0) {
    if (validInvoices.length > 0) {
      valorVencido = calcVencido
      valorAVencer = calcAVencer
    } else {
      valorVencido = total
    }
  }

  return {
    id: `${row.uc}_${row.cod_pess_fat || ''}`,
    uc: row.uc,
    personCode: row.cod_pess_fat || '',
    name: row.pessoa_fatura_nome || row.ta_nome_de_quem || '',
    document: row.pessoa_fatura_cpf_cnpj || '',
    address: row.endereco || '',
    overdueDays,
    totalDebt: total,
    valorVencido,
    valorAVencer,
    status: 'pendente',
    priority: total > 5000 ? 'alta' : total > 1000 ? 'media' : 'baixa',
    phones,
    invoices,
    rawPessoaFaturaNome: row.pessoa_fatura_nome || null,
    rawPessoaFaturaCpfCnpj: row.pessoa_fatura_cpf_cnpj || null,
  }
}

export async function getDebts(
  search?: string,
  operatorId?: string,
  searchAddress?: string,
  debtStatus?: 'vencido' | 'a_vencer' | 'ambos',
) {
  let query = supabase.from('pending_debts').select('*').order('valor_total', { ascending: false })

  if (search) {
    query = query.or(
      `uc.ilike.%${search}%,pessoa_fatura_nome.ilike.%${search}%,pessoa_fatura_cpf_cnpj.ilike.%${search}%`,
    )
  }
  if (searchAddress) {
    query = query.ilike('endereco', `%${searchAddress}%`)
  }

  const { data: debts, error } = await query
  if (error) throw error

  let attendedUcs = new Set<string>()
  let latestContactDates: Record<string, string> = {}
  let globalLatestOperators: Record<string, string[]> = {}

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

        if (!globalLatestOperators[key]) {
          globalLatestOperators[key] = []
        }

        const opName = (contact.profiles as any)?.name
        if (
          opName &&
          !globalLatestOperators[key].includes(opName) &&
          globalLatestOperators[key].length < 3
        ) {
          globalLatestOperators[key].push(opName)
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

  let parsedDebts = (debts || []).map((row) => parseDebtRow(row))

  if (debtStatus === 'vencido') {
    parsedDebts = parsedDebts.filter((d) => d.valorVencido > 0)
  } else if (debtStatus === 'a_vencer') {
    parsedDebts = parsedDebts.filter((d) => d.valorAVencer > 0)
  }

  const unattended: ParsedDebt[] = []
  const attended: ParsedDebt[] = []

  for (const debt of parsedDebts) {
    const key = `${debt.uc}_${debt.personCode}`
    const recentOps = globalLatestOperators[key] || []

    if (operatorId && attendedUcs.has(key)) {
      attended.push({
        ...debt,
        lastContactDate: latestContactDates[key],
        lastOperatorName: recentOps[0],
        recentOperators: recentOps,
      })
    } else {
      unattended.push({ ...debt, lastOperatorName: recentOps[0], recentOperators: recentOps })
    }
  }

  attended.sort((a, b) => {
    const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0
    const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0
    return dateB - dateA
  })

  return { unattended, attended }
}

export async function getDebtByUc(uc: string, personCode?: string) {
  let query = supabase.from('pending_debts').select('*').eq('uc', uc)

  if (personCode) {
    query = query.eq('cod_pess_fat', personCode)
  }

  const { data, error } = await query.limit(1).single()
  if (error) throw error

  let contactsQuery: any = supabase
    .from('contact_history')
    .select('quality_result, profiles(name)')
    .eq('uc', data.uc)
    .eq('is_active', true)

  if (personCode) {
    contactsQuery = contactsQuery.eq('cod_pess_fat', personCode)
  }

  const { data: contacts } = await contactsQuery.order('created_at', { ascending: false })

  let phoneValidationStatus: 'a_verificar' | 'validado' | 'invalido' = 'a_verificar'
  const recentOperators: string[] = []

  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      if (contact.quality_result) {
        try {
          const parsed = JSON.parse(contact.quality_result)
          if (parsed.phoneValidationStatus) {
            phoneValidationStatus = parsed.phoneValidationStatus
          } else if (parsed.validatePhone !== undefined) {
            phoneValidationStatus = parsed.validatePhone ? 'validado' : 'a_verificar'
          }
        } catch (e) {
          // ignore parsing errors for invalid json
        }
      }
      const opName = (contact.profiles as any)?.name
      if (opName && !recentOperators.includes(opName) && recentOperators.length < 3) {
        recentOperators.push(opName)
      }
    }
  }

  return { ...parseDebtRow(data, phoneValidationStatus), recentOperators }
}

export async function getRelatedDebts(
  currentUc: string,
  personCode: string,
  pessoaFaturaNome: string | null,
  pessoaFaturaCpfCnpj: string | null,
) {
  const promises = []

  if (personCode) {
    promises.push(supabase.from('pending_debts').select('*').eq('cod_pess_fat', personCode))
  }

  if (pessoaFaturaNome && pessoaFaturaNome.trim().length > 0) {
    promises.push(
      supabase.from('pending_debts').select('*').eq('proprietario_nome', pessoaFaturaNome),
    )
    promises.push(
      supabase.from('pending_debts').select('*').eq('responsavel_nome', pessoaFaturaNome),
    )
  }

  if (pessoaFaturaCpfCnpj && pessoaFaturaCpfCnpj.trim().length > 0) {
    promises.push(
      supabase.from('pending_debts').select('*').eq('proprietario_cpf_cnpj', pessoaFaturaCpfCnpj),
    )
    promises.push(
      supabase.from('pending_debts').select('*').eq('responsavel_cpf_cnpj', pessoaFaturaCpfCnpj),
    )
  }

  if (promises.length === 0) return []

  const results = await Promise.all(promises)

  const uniqueDebts = new Map<string, any>()

  for (const { data, error } of results) {
    if (error) {
      console.error('Error fetching related debts', error)
      continue
    }
    if (data) {
      for (const row of data) {
        if (row.uc === currentUc && row.cod_pess_fat === personCode) {
          continue
        }
        const key = `${row.uc}_${row.cod_pess_fat}`
        if (!uniqueDebts.has(key)) {
          uniqueDebts.set(key, row)
        }
      }
    }
  }

  const parsedDebts = Array.from(uniqueDebts.values()).map((row) => parseDebtRow(row))
  if (parsedDebts.length === 0) return []

  const ucs = parsedDebts.map((d) => d.uc)

  const { data: contacts } = await supabase
    .from('contact_history')
    .select('uc, cod_pess_fat, profiles(name)')
    .in('uc', ucs)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const opsMap: Record<string, string[]> = {}
  if (contacts) {
    for (const c of contacts) {
      const key = `${c.uc}_${c.cod_pess_fat}`
      const opName = (c.profiles as any)?.name
      if (opName) {
        if (!opsMap[key]) opsMap[key] = []
        if (!opsMap[key].includes(opName) && opsMap[key].length < 3) {
          opsMap[key].push(opName)
        }
      }
    }
  }

  return parsedDebts.map((d) => ({
    ...d,
    recentOperators: opsMap[`${d.uc}_${d.personCode}`] || [],
  }))
}

export async function getPortfolioStats() {
  const { data, error } = await (supabase as any).rpc('get_portfolio_stats')
  if (error) throw error

  return data as { total_cases: number; total_value: number }
}
