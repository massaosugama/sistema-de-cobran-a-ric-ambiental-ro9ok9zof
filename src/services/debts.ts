import { supabase } from '@/lib/supabase/client'

export interface ParsedDebt {
  id: string
  uc: string
  personCode: string
  name: string
  document: string
  address: string
  overdueMonths: number
  totalDebt: number
  valorVencido: number
  valorAVencer: number
  status: string
  nextAction?: string
  priority: 'alta' | 'media' | 'baixa'
  phones: { number: string; status: 'a_verificar' | 'validado' | 'invalido' }[]
  invoices: { ref: string; value: number; months: number | null }[]
  redundancyAlert?: { operator: string; daysAgo: number }
  lastContactDate?: string
  lastOperatorName?: string
  recentOperators?: string[]
  rawPessoaFaturaNome?: string | null
  rawPessoaFaturaCpfCnpj?: string | null
  setor?: string | null
  isLoteVago: boolean
}

function parseSafeNumber(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    if (val.trim() === '') return 0
    if (val.includes(',') && !val.includes('.')) {
      return parseFloat(val.replace(',', '.')) || 0
    }
    if (val.includes(',') && val.includes('.')) {
      return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
    }
    return parseFloat(val) || 0
  }
  return 0
}

export function parseDebtRow(
  row: any,
  phoneStatus: 'a_verificar' | 'validado' | 'invalido' = 'a_verificar',
  individualPhoneStatuses?: Record<string, 'a_verificar' | 'validado' | 'invalido'>,
): ParsedDebt {
  const phones: { number: string; status: 'a_verificar' | 'validado' | 'invalido' }[] = []

  const addPhone = (num: string) => {
    if (!num) return
    const exists = phones.find((p) => p.number === num)
    if (!exists) {
      phones.push({
        number: num,
        status: individualPhoneStatuses?.[num] || phoneStatus,
      })
    }
  }

  addPhone(row.pessoa_fatura_celular)
  addPhone(row.proprietario_celular)
  addPhone(row.responsavel_celular)

  const invoices = row.refs
    ? row.refs
        .split(/\s+/)
        .filter((r: string) => r.trim() !== '')
        .map((rawRef: string) => {
          let ref = rawRef.trim()
          if (ref.startsWith("'")) {
            ref = ref.substring(1)
          }

          let months: number | null = null

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
                months = (currentYear - y) * 12 + (currentMonth - m)
              }
            }
          }
          return { ref, value: parseSafeNumber(row.valor_total) / (row.qt_fats || 1), months }
        })
    : []

  invoices.sort((a: any, b: any) => {
    if (a.months === null && b.months === null) return 0
    if (a.months === null) return 1
    if (b.months === null) return -1
    return a.months - b.months
  })

  const validInvoices = invoices.filter((i: any) => i.months !== null)
  const overdueMonths =
    validInvoices.length > 0 ? Math.max(0, ...validInvoices.map((i: any) => i.months as number)) : 0

  const valorVencido = Number(Math.max(0, parseSafeNumber(row.valor_vencido)).toFixed(2))
  const valorAVencer = Number(Math.max(0, parseSafeNumber(row.valor_a_vencer)).toFixed(2))
  const total = Number(Math.max(0, parseSafeNumber(row.valor_total)).toFixed(2))

  return {
    id: `${row.uc}_${row.cod_pess_fat || ''}`,
    uc: row.uc,
    personCode: row.cod_pess_fat || '',
    name: row.pessoa_fatura_nome || row.ta_nome_de_quem || '',
    document: row.pessoa_fatura_cpf_cnpj || '',
    address: row.endereco || '',
    overdueMonths,
    totalDebt: total,
    valorVencido,
    valorAVencer,
    status: 'pendente',
    priority: total > 5000 ? 'alta' : total > 1000 ? 'media' : 'baixa',
    phones,
    invoices,
    rawPessoaFaturaNome: row.pessoa_fatura_nome || null,
    rawPessoaFaturaCpfCnpj: row.pessoa_fatura_cpf_cnpj || null,
    setor: row.setor || null,
    isLoteVago: row.setor === '4036',
  }
}

export async function getDebts(
  search?: string,
  operatorId?: string,
  searchAddress?: string,
  debtStatus?: 'vencido' | 'a_vencer' | 'ambos',
  hideLotes: boolean = true,
  limit: number = 3000,
) {
  // 1. Construct the base query for pending debts
  let query = supabase
    .from('pending_debts')
    .select('*')
    .order('valor_total', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(
      `uc.ilike.%${search}%,pessoa_fatura_nome.ilike.%${search}%,pessoa_fatura_cpf_cnpj.ilike.%${search}%`,
    )
  }
  if (searchAddress) {
    query = query.ilike('endereco', `%${searchAddress}%`)
  }
  if (hideLotes) {
    query = query.or('setor.neq.4036,setor.is.null')
  }

  const { data: debts, error } = await query
  if (error) throw error

  let fetchedDebts = debts || []

  // 2. Fetch the operator's wallet (contact history for operator)
  let attendedUcs = new Set<string>()
  let latestContactDates: Record<string, string> = {}
  let walletKeysToFetch: { uc: string; cod_pess_fat: string }[] = []

  if (operatorId) {
    const { data: myContacts } = await supabase
      .from('contact_history')
      .select('uc, cod_pess_fat, created_at')
      .eq('operator_id', operatorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (myContacts) {
      for (const c of myContacts) {
        if (c.uc && c.cod_pess_fat) {
          const key = `${c.uc}_${c.cod_pess_fat}`
          if (!attendedUcs.has(key)) {
            attendedUcs.add(key)
            latestContactDates[key] = c.created_at

            const alreadyFetched = fetchedDebts.some(
              (d) => d.uc === c.uc && d.cod_pess_fat === c.cod_pess_fat,
            )
            if (!alreadyFetched) {
              walletKeysToFetch.push({ uc: c.uc, cod_pess_fat: c.cod_pess_fat })
            }
          }
        }
      }
    }
  }

  // 3. Fetch the wallet items that weren't in the initial results
  if (walletKeysToFetch.length > 0) {
    const sliced = walletKeysToFetch.slice(0, 500)
    const ucsToFetch = Array.from(new Set(sliced.map((k) => k.uc)))

    let walletQuery = supabase.from('pending_debts').select('*').in('uc', ucsToFetch)

    if (search) {
      walletQuery = walletQuery.or(
        `uc.ilike.%${search}%,pessoa_fatura_nome.ilike.%${search}%,pessoa_fatura_cpf_cnpj.ilike.%${search}%`,
      )
    }
    if (searchAddress) {
      walletQuery = walletQuery.ilike('endereco', `%${searchAddress}%`)
    }
    if (hideLotes) {
      walletQuery = walletQuery.or('setor.neq.4036,setor.is.null')
    }

    const { data: missingWalletDebts } = await walletQuery
    if (missingWalletDebts) {
      const validMissing = missingWalletDebts.filter((d) =>
        sliced.some((s) => s.uc === d.uc && s.cod_pess_fat === d.cod_pess_fat),
      )
      fetchedDebts = [...fetchedDebts, ...validMissing]
    }
  }

  // 4. Parse debts
  let parsedDebts = fetchedDebts.map((row) => parseDebtRow(row))

  if (debtStatus === 'vencido') {
    parsedDebts = parsedDebts.filter((d) => d.valorVencido > 0)
  } else if (debtStatus === 'a_vencer') {
    parsedDebts = parsedDebts.filter((d) => d.valorAVencer > 0)
  }

  // 5. Get recent operators for fetched debts
  let globalLatestOperators: Record<string, string[]> = {}

  if (parsedDebts.length > 0) {
    const ucs = Array.from(new Set(parsedDebts.map((d) => d.uc)))
    const chunks = []
    for (let i = 0; i < ucs.length; i += 500) {
      chunks.push(ucs.slice(i, i + 500))
    }

    const contactsPromises = chunks.map((chunk) =>
      supabase
        .from('contact_history')
        .select('uc, cod_pess_fat, profiles(name)')
        .in('uc', chunk)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
    )

    const contactsResults = await Promise.all(contactsPromises)

    for (const result of contactsResults) {
      if (result.data) {
        for (const contact of result.data) {
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
          }
        }
      }
    }
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

  const uniqueAttended = Array.from(new Map(attended.map((item) => [item.id, item])).values())
  const uniqueUnattended = Array.from(new Map(unattended.map((item) => [item.id, item])).values())

  uniqueAttended.sort((a, b) => {
    const dateA = a.lastContactDate ? new Date(a.lastContactDate).getTime() : 0
    const dateB = b.lastContactDate ? new Date(b.lastContactDate).getTime() : 0
    return dateB - dateA
  })

  return { unattended: uniqueUnattended, attended: uniqueAttended }
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
  let hasGlobalPhoneStatus = false
  let phoneStatuses: Record<string, 'a_verificar' | 'validado' | 'invalido'> = {}
  const recentOperators: string[] = []

  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      if (contact.quality_result) {
        try {
          const parsed = JSON.parse(contact.quality_result)

          if (parsed.phoneStatuses) {
            for (const [num, stat] of Object.entries(parsed.phoneStatuses)) {
              if (!phoneStatuses[num]) {
                phoneStatuses[num] = stat as any
              }
            }
          }

          if (!hasGlobalPhoneStatus) {
            if (parsed.phoneValidationStatus) {
              phoneValidationStatus = parsed.phoneValidationStatus
              hasGlobalPhoneStatus = true
            } else if (parsed.validatePhone !== undefined) {
              phoneValidationStatus = parsed.validatePhone ? 'validado' : 'a_verificar'
              hasGlobalPhoneStatus = true
            }
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

  return { ...parseDebtRow(data, phoneValidationStatus, phoneStatuses), recentOperators }
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

  return {
    total_cases: data?.total_cases || 0,
    total_value: data?.total_value || 0,
    total_vencido: data?.total_vencido || 0,
    total_a_vencer: data?.total_a_vencer || 0,
  } as {
    total_cases: number
    total_value: number
    total_vencido: number
    total_a_vencer: number
  }
}

export async function getDashboardEvolution() {
  const { data, error } = await (supabase as any).rpc('get_dashboard_evolution')
  if (error) throw error
  return data
}
