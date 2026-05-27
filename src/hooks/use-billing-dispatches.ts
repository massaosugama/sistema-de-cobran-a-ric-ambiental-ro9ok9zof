import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

export interface DispatchDebt {
  id: string
  uc: string
  cod_pess_fat: string
  pessoa_fatura_nome: string
  valor_total: number
  refsList: string[]
  dt_vencto_ref_mais_recente: string | null
  ultimo_disparo: string | null
  phones: string[]
  pessoa_fatura_celular: string | null
  proprietario_celular: string | null
  responsavel_celular: string | null
  endereco: string | null
  telefones_pesquisa?: string | null
}

export type SortCol = 'uc' | 'pessoa' | 'valor' | 'referencia' | 'vencimento' | 'disparo' | null

export const parseRefs = (refsStr: string | null): string[] => {
  if (!refsStr) return []
  return refsStr
    .split(/\s+/)
    .filter(Boolean)
    .map((r) => r.replace(/'/g, ''))
}

export const isExactMatch = (debtRefs: string[], selectedRefs: string[]) => {
  if (debtRefs.length !== selectedRefs.length) return false
  const set = new Set(debtRefs)
  return selectedRefs.every((r) => set.has(r))
}

export const sanitizePhone = (phone: string): string | null => {
  const clean = phone.replace(/\D/g, '')
  if (!clean) return null
  if (clean.startsWith('55') && clean.length >= 12) return clean
  if (clean.length === 8 || clean.length === 9) return '5514' + clean
  if (clean.length === 10 || clean.length === 11) return '55' + clean
  if (!clean.startsWith('55')) return '55' + clean
  return clean
}

export const extractPhonesFromText = (text: string) => {
  if (!text) return []
  const lines = text.split(/[\r\n,;]+/)
  const phones = lines.map((l) => l.replace(/\D/g, '')).filter((l) => l.length >= 8)
  const sanitized = phones.map(sanitizePhone).filter(Boolean) as string[]
  return Array.from(new Set(sanitized)).slice(0, 30)
}

export const exportDispatches = (data: any[]) => {
  const headers = ['WHATSAPP', 'UC', 'NOME', 'LOGRADOURO']
  const csvRows = data.map((r) => [
    r.WHATSAPP || '',
    r.UC || '',
    `"${(r.NOME || '').replace(/"/g, '""')}"`,
    `"${(r.LOGRADOURO || '').replace(/"/g, '""')}"`,
  ])
  const csvContent = '\uFEFF' + [headers.join(';'), ...csvRows.map((r) => r.join(';'))].join('\n')
  const blobCSV = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const linkCSV = document.createElement('a')
  linkCSV.href = URL.createObjectURL(blobCSV)
  linkCSV.download = `disparos_${Date.now()}.csv`
  linkCSV.click()
}

export function useBillingDispatches() {
  const { toast } = useToast()
  const [availableRefs, setAvailableRefs] = useState<string[]>([])
  const [selectedRefs, setSelectedRefs] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem('bd_refs') || '[]'),
  )
  const [daysToDue, setDaysToDue] = useState<number>(() =>
    parseInt(localStorage.getItem('bd_days') || '5', 10),
  )
  const [minDaysSinceDispatch, setMinDaysSinceDispatch] = useState<number | ''>(() => {
    const val = localStorage.getItem('bd_min_days_dispatch')
    if (val !== null && val !== '') {
      const parsed = parseInt(val, 10)
      return !isNaN(parsed) ? parsed : ''
    }
    return ''
  })
  const [minDebtValue, setMinDebtValue] = useState<number | ''>(() => {
    const val = localStorage.getItem('bd_min_debt')
    if (val !== null && val !== '') {
      const parsed = parseFloat(val)
      return !isNaN(parsed) ? parsed : ''
    }
    return ''
  })
  const [recordLimit, setRecordLimit] = useState<number>(() =>
    parseInt(localStorage.getItem('bd_limit') || '100', 10),
  )

  const [eligibleItems, setEligibleItems] = useState<DispatchDebt[]>([])
  const [preSelectedItems, setPreSelectedItems] = useState<DispatchDebt[]>([])
  const [selectionEligible, setSelectionEligible] = useState<Set<string>>(new Set())
  const [selectionPreSelected, setSelectionPreSelected] = useState<Set<string>>(new Set())

  const [sortCol, setSortCol] = useState<SortCol>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [lastSelIdx, setLastSelIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // New states for "Pesquisa de Telefones"
  const [searchUcs, setSearchUcs] = useState('')
  const [searchDate, setSearchDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [researchedItems, setResearchedItems] = useState<DispatchDebt[]>([])
  const [reGeneratedItems, setReGeneratedItems] = useState<any[]>([])
  const [loadingResearch, setLoadingResearch] = useState(false)
  const [exportingResearch, setExportingResearch] = useState(false)
  const [exportingReGen, setExportingReGen] = useState(false)

  const [reGenPage, setReGenPage] = useState(1)
  const [reGenTotalCount, setReGenTotalCount] = useState(0)

  const fetchReGeneratedItems = async (page: number = 1) => {
    try {
      const limit = 100
      const offset = (page - 1) * limit
      const { data, error } = await (supabase.rpc as any)('get_researched_phones_paginated', {
        p_limit: limit,
        p_offset: offset,
      })
      if (error) throw error

      setReGenTotalCount(data && data.length > 0 ? data[0].total_count : 0)
      setReGeneratedItems(
        (data || []).map((d: any) => ({
          ...d,
          telefones_pesquisa: d.phones ? d.phones.join('\n') : '',
          is_edited: false,
        })),
      )
      setReGenPage(page)
    } catch (e) {
      console.error('Error fetching re-generated items:', e)
    }
  }

  const saveReGenPhones = async (uc: string, cod_pess_fat: string, text: string) => {
    try {
      const { error } = await supabase
        .from('pending_debts')
        .update({ telefones_pesquisa: text } as any)
        .eq('uc', uc)
        .eq('cod_pess_fat', cod_pess_fat)

      if (error) throw error

      setReGeneratedItems((prev) =>
        prev.map((p) =>
          p.uc === uc && p.cod_pess_fat === cod_pess_fat
            ? { ...p, telefones_pesquisa: text, is_edited: true }
            : p,
        ),
      )
      toast({ title: 'Sucesso', description: 'Telefones salvos (Pronto para re-extração).' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao salvar telefones.', variant: 'destructive' })
    }
  }

  const handleExportReGen = async () => {
    const itemsToExport = reGeneratedItems.filter((item) => item.is_edited)

    if (itemsToExport.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum registro re-editado para exportar.' })
      return
    }

    setExportingReGen(true)

    const { data: debts } = await supabase
      .from('pending_debts')
      .select('uc, cod_pess_fat, endereco')
      .in(
        'uc',
        itemsToExport.map((i) => i.uc),
      )

    const addressMap = new Map()
    if (debts) {
      debts.forEach((d) => addressMap.set(`${d.uc}_${d.cod_pess_fat}`, d.endereco))
    }

    const exportData: any[] = []
    const now = new Date().toISOString()
    const updatePayload: any[] = []
    const upsertPhonesPayload: any[] = []

    itemsToExport.forEach((item) => {
      updatePayload.push({ uc: item.uc, cod_pess_fat: item.cod_pess_fat, ultimo_disparo: now })

      let logradouro = addressMap.get(`${item.uc}_${item.cod_pess_fat}`) || ''
      const nIndex = logradouro.search(/N[º°]/i)
      if (nIndex !== -1) {
        logradouro = logradouro.substring(0, nIndex).trim()
      }

      const cleanPhones = extractPhonesFromText(item.telefones_pesquisa || '')

      upsertPhonesPayload.push({
        uc: item.uc,
        cod_pess_fat: item.cod_pess_fat,
        phones: cleanPhones,
        updated_at: now,
      })

      if (cleanPhones.length > 0) {
        cleanPhones.forEach((cleanPhone) => {
          exportData.push({
            WHATSAPP: cleanPhone,
            UC: item.uc,
            NOME: item.pessoa_fatura_nome,
            LOGRADOURO: logradouro,
          })
        })
      } else {
        exportData.push({
          WHATSAPP: '',
          UC: item.uc,
          NOME: item.pessoa_fatura_nome,
          LOGRADOURO: logradouro,
        })
      }
    })

    const csvContent = [
      ['WHATSAPP', 'UC', 'NOME', 'LOGRADOURO'].join(';'),
      ...exportData.map((row) => {
        const rawPhone = row.WHATSAPP ? String(row.WHATSAPP).replace(/^="|"$/g, '') : ''
        const rawUC = row.UC ? String(row.UC).replace(/^="|"$/g, '') : ''
        const cleanName = `"${(row.NOME || '').replace(/"/g, '""')}"`
        const cleanLogradouro = `"${(row.LOGRADOURO || '').replace(/"/g, '""')}"`
        return [rawPhone, rawUC, cleanName, cleanLogradouro].join(';')
      }),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `disparos_re_gerados_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)

    try {
      if (upsertPhonesPayload.length > 0) {
        await supabase
          .from('researched_phones' as any)
          .upsert(upsertPhonesPayload, { onConflict: 'uc,cod_pess_fat' })
      }
      await supabase.rpc('bulk_update_ultimo_disparo', { payload: updatePayload })
      await fetchReGeneratedItems()
      toast({ title: 'Extração Concluída', description: `${exportData.length} registros gerados.` })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro na extração',
        description: 'Falha ao atualizar banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setExportingReGen(false)
    }
  }

  useEffect(() => {
    fetchReGeneratedItems(1)
  }, [])

  useEffect(() => {
    localStorage.setItem('bd_refs', JSON.stringify(selectedRefs))
    localStorage.setItem('bd_days', daysToDue.toString())
    localStorage.setItem('bd_min_days_dispatch', minDaysSinceDispatch.toString())
    localStorage.setItem('bd_min_debt', minDebtValue.toString())
    localStorage.setItem('bd_limit', recordLimit.toString())
  }, [selectedRefs, daysToDue, minDaysSinceDispatch, minDebtValue, recordLimit])

  useEffect(() => {
    supabase.rpc('get_distinct_refs').then(({ data }) => {
      if (data) setAvailableRefs(data.map((d: any) => d.ref))
    })
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const tag = document.activeElement?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        if (eligibleItems.length > 0) setSelectionEligible(new Set(eligibleItems.map((i) => i.id)))
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [eligibleItems])

  const fetchDebts = async () => {
    if (selectedRefs.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione ao menos uma referência.' })
      return
    }
    setLoading(true)
    try {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - daysToDue)
      const tDateStr = targetDate.toISOString().split('T')[0]

      const buildQuery = (isCount = false) => {
        let q = supabase.from('pending_debts')
        if (isCount) {
          q = q.select('uc', { count: 'exact', head: true })
        } else {
          q = q.select(
            'uc, cod_pess_fat, pessoa_fatura_nome, valor_total, refs, dt_vencto_ref_mais_recente, ultimo_disparo, pessoa_fatura_celular, proprietario_celular, responsavel_celular, endereco, telefones_pesquisa',
          )
        }

        q = q
          .eq('is_active', true)
          .lte('dt_vencto_ref_mais_recente', tDateStr)
          .or(
            'pessoa_fatura_celular.not.is.null,proprietario_celular.not.is.null,responsavel_celular.not.is.null',
          )

        if (minDaysSinceDispatch !== '') {
          const lastDispatchDate = new Date()
          lastDispatchDate.setDate(lastDispatchDate.getDate() - Number(minDaysSinceDispatch))
          const lastDispatchStr = lastDispatchDate.toISOString()
          q = q.or(`ultimo_disparo.is.null,ultimo_disparo.lte.${lastDispatchStr}`)
        }

        if (minDebtValue !== '') {
          q = q.gte('valor_total', Number(minDebtValue))
        }

        if (selectedRefs.length > 0) {
          const refsFilter = selectedRefs.map((r) => `refs.ilike.%${r}%`).join(',')
          q = q.or(refsFilter)
        }

        return q
      }

      const { count, error: countError } = await buildQuery(true)
      if (countError) throw countError

      let allData: any[] = []

      if (count && count > 0) {
        const step = 1000
        const pages = Math.ceil(count / step)
        const CONCURRENT_REQUESTS = 4

        for (let i = 0; i < pages; i += CONCURRENT_REQUESTS) {
          const chunk = []
          for (let j = 0; j < CONCURRENT_REQUESTS && i + j < pages; j++) {
            const from = (i + j) * step
            const to = from + step - 1
            const q = buildQuery(false)
              .order('uc', { ascending: true })
              .order('cod_pess_fat', { ascending: true })
              .range(from, to)
            chunk.push(q)
          }
          const results = await Promise.all(chunk)
          for (const res of results) {
            if (res.error) throw res.error
            if (res.data) allData = allData.concat(res.data)
          }
        }
      }

      const parsed = allData.map((d: any) => ({
        id: `${d.uc}_${d.cod_pess_fat}`,
        ...d,
        refsList: parseRefs(d.refs),
        phones: [d.pessoa_fatura_celular, d.proprietario_celular, d.responsavel_celular].filter(
          (p) => p && p.trim() !== '',
        ),
      }))

      const withPhones = parsed.filter((d) => d.phones.length > 0)
      const filtered = withPhones.filter((d) => isExactMatch(d.refsList, selectedRefs))
      const preSelSet = new Set(preSelectedItems.map((p) => p.id))

      setEligibleItems(filtered.filter((f) => !preSelSet.has(f.id)))
      setSelectionEligible(new Set())
      setSortCol(null)
      setSortDir('asc')
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao buscar dívidas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleSort = (col: SortCol) => {
    setSortCol((prev) => {
      if (prev === col) {
        if (sortDir === 'asc') {
          setSortDir('desc')
          return col
        }
        return null
      }
      setSortDir('asc')
      return col
    })
  }

  const sortedEligible = useMemo(() => {
    let arr = [...eligibleItems]
    if (!sortCol) {
      arr.sort((a, b) => {
        if (!a.ultimo_disparo && b.ultimo_disparo) return -1
        if (a.ultimo_disparo && !b.ultimo_disparo) return 1
        if (!a.ultimo_disparo && !b.ultimo_disparo) return b.valor_total - a.valor_total
        return new Date(a.ultimo_disparo!).getTime() - new Date(b.ultimo_disparo!).getTime()
      })
    } else {
      arr.sort((a, b) => {
        let vA: any = a[sortCol]
        let vB: any = b[sortCol]
        if (sortCol === 'valor') {
          vA = a.valor_total
          vB = b.valor_total
        }
        if (sortCol === 'pessoa') {
          vA = a.pessoa_fatura_nome
          vB = b.pessoa_fatura_nome
        }
        if (sortCol === 'referencia') {
          vA = a.refsList.join()
          vB = b.refsList.join()
        }
        if (sortCol === 'vencimento') {
          vA = a.dt_vencto_ref_mais_recente || ''
          vB = b.dt_vencto_ref_mais_recente || ''
        }
        if (sortCol === 'disparo') {
          vA = a.ultimo_disparo || ''
          vB = b.ultimo_disparo || ''
        }
        if (vA < vB) return sortDir === 'asc' ? -1 : 1
        if (vA > vB) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    if (recordLimit > 0) {
      return arr.slice(0, recordLimit)
    }
    return arr
  }, [eligibleItems, sortCol, sortDir, recordLimit])

  const toggleSelection = (id: string, idx: number, e: React.MouseEvent, isEligible: boolean) => {
    const setFn = isEligible ? setSelectionEligible : setSelectionPreSelected
    const items = isEligible ? sortedEligible : preSelectedItems
    setFn((prev) => {
      const next = new Set(prev)
      if (e.shiftKey && lastSelIdx !== null) {
        const start = Math.min(lastSelIdx, idx)
        const end = Math.max(lastSelIdx, idx)
        items.slice(start, end + 1).forEach((item) => next.add(item.id))
      } else {
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setLastSelIdx(idx)
      }
      return next
    })
  }

  const selectAll = (isEligible: boolean) => {
    const items = isEligible ? sortedEligible : preSelectedItems
    const setFn = isEligible ? setSelectionEligible : setSelectionPreSelected
    const current = isEligible ? selectionEligible : selectionPreSelected
    if (current.size === items.length) setFn(new Set())
    else setFn(new Set(items.map((i) => i.id)))
  }

  const moveSelected = (toRight: boolean) => {
    if (toRight) {
      const moving = sortedEligible.filter((i) => selectionEligible.has(i.id))
      setPreSelectedItems((prev) => [...prev, ...moving])
      setEligibleItems((prev) => prev.filter((i) => !selectionEligible.has(i.id)))
      setSelectionEligible(new Set())
    } else {
      const moving = preSelectedItems.filter((i) => selectionPreSelected.has(i.id))
      setEligibleItems((prev) => [...prev, ...moving])
      setPreSelectedItems((prev) => prev.filter((i) => !selectionPreSelected.has(i.id)))
      setSelectionPreSelected(new Set())
    }
  }

  const fetchResearchedItems = async () => {
    if (!searchUcs.trim()) return
    const ucs = searchUcs
      .split(/[\r\n,;]+/)
      .map((u) => u.trim())
      .filter((u) => /^\d+$/.test(u))
    if (ucs.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhuma UC válida encontrada no texto.' })
      return
    }

    setLoadingResearch(true)
    try {
      const { data, error } = await supabase
        .from('pending_debts')
        .select(
          'uc, cod_pess_fat, pessoa_fatura_nome, valor_total, refs, dt_vencto_ref_mais_recente, ultimo_disparo, pessoa_fatura_celular, proprietario_celular, responsavel_celular, endereco, telefones_pesquisa, pessoa_fatura_cpf_cnpj',
        )
        .in('uc', ucs)

      if (error) throw error

      const filtered = (data || [])
        .filter((d) => {
          if (!d.ultimo_disparo) return false
          const udDate = new Date(d.ultimo_disparo)
          const udDateStr = format(udDate, 'yyyy-MM-dd')
          return udDateStr === searchDate
        })
        .map((d: any) => ({
          id: `${d.uc}_${d.cod_pess_fat}`,
          ...d,
          refsList: parseRefs(d.refs),
          phones: [d.pessoa_fatura_celular, d.proprietario_celular, d.responsavel_celular].filter(
            (p) => p && p.trim() !== '',
          ),
        }))

      setResearchedItems((prev) => {
        const toKeep = prev.filter(
          (p) => p.telefones_pesquisa && p.telefones_pesquisa.trim().length > 0,
        )
        const keepIds = new Set(toKeep.map((k) => k.id))
        const newItems = filtered.filter((f) => !keepIds.has(f.id))
        const result = [...toKeep, ...newItems]

        if (result.length === 0) {
          toast({
            title: 'Aviso',
            description: 'Nenhum registro localizado para as UCs e data informadas.',
          })
        }
        return result
      })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao buscar registros', variant: 'destructive' })
    } finally {
      setLoadingResearch(false)
    }
  }

  const savePhones = async (uc: string, cod_pess_fat: string, text: string) => {
    try {
      const { error } = await supabase
        .from('pending_debts')
        .update({ telefones_pesquisa: text } as any)
        .eq('uc', uc)
        .eq('cod_pess_fat', cod_pess_fat)

      if (error) throw error

      setResearchedItems((prev) =>
        prev.map((p) =>
          p.uc === uc && p.cod_pess_fat === cod_pess_fat ? { ...p, telefones_pesquisa: text } : p,
        ),
      )
      toast({ title: 'Sucesso', description: 'Telefones salvos com sucesso.' })
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro', description: 'Falha ao salvar telefones.', variant: 'destructive' })
    }
  }

  const handleGiveUp = (uc: string, cod_pess_fat: string) => {
    setResearchedItems((prev) =>
      prev.filter((p) => !(p.uc === uc && p.cod_pess_fat === cod_pess_fat)),
    )
  }

  const handleExportResearched = async () => {
    const itemsToExport = researchedItems.filter(
      (item) => item.telefones_pesquisa && item.telefones_pesquisa.trim().length > 0,
    )

    if (itemsToExport.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum registro com telefone editado para exportar.' })
      return
    }

    setExportingResearch(true)

    const exportData: any[] = []
    const now = new Date().toISOString()
    const updatePayload: any[] = []
    const upsertPhonesPayload: any[] = []

    itemsToExport.forEach((item) => {
      updatePayload.push({ uc: item.uc, cod_pess_fat: item.cod_pess_fat, ultimo_disparo: now })

      let logradouro = item.endereco || ''
      const nIndex = logradouro.search(/N[º°]/i)
      if (nIndex !== -1) {
        logradouro = logradouro.substring(0, nIndex).trim()
      }

      const cleanPhones = extractPhonesFromText(item.telefones_pesquisa || '')

      upsertPhonesPayload.push({
        uc: item.uc,
        cod_pess_fat: item.cod_pess_fat,
        phones: cleanPhones,
        updated_at: now,
      })

      if (cleanPhones.length > 0) {
        cleanPhones.forEach((cleanPhone) => {
          exportData.push({
            WHATSAPP: cleanPhone,
            UC: item.uc,
            NOME: item.pessoa_fatura_nome,
            LOGRADOURO: logradouro,
          })
        })
      } else {
        exportData.push({
          WHATSAPP: '',
          UC: item.uc,
          NOME: item.pessoa_fatura_nome,
          LOGRADOURO: logradouro,
        })
      }
    })

    const csvContent = [
      ['WHATSAPP', 'UC', 'NOME', 'LOGRADOURO'].join(';'),
      ...exportData.map((row) => {
        const rawPhone = row.WHATSAPP ? String(row.WHATSAPP).replace(/^="|"$/g, '') : ''
        const rawUC = row.UC ? String(row.UC).replace(/^="|"$/g, '') : ''
        const cleanName = `"${(row.NOME || '').replace(/"/g, '""')}"`
        const cleanLogradouro = `"${(row.LOGRADOURO || '').replace(/"/g, '""')}"`
        return [rawPhone, rawUC, cleanName, cleanLogradouro].join(';')
      }),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `disparos_pesquisa_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 100)

    try {
      if (upsertPhonesPayload.length > 0) {
        await supabase
          .from('researched_phones' as any)
          .upsert(upsertPhonesPayload, { onConflict: 'uc,cod_pess_fat' })
      }
      await supabase.rpc('bulk_update_ultimo_disparo', { payload: updatePayload })
      setResearchedItems((prev) =>
        prev.filter(
          (p) => !itemsToExport.some((ex) => ex.uc === p.uc && ex.cod_pess_fat === p.cod_pess_fat),
        ),
      )
      await fetchReGeneratedItems()
      toast({ title: 'Extração Concluída', description: `${exportData.length} registros gerados.` })
    } catch (e) {
      console.error(e)
      toast({
        title: 'Erro na extração',
        description: 'Falha ao atualizar banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setExportingResearch(false)
    }
  }

  return {
    availableRefs,
    selectedRefs,
    setSelectedRefs,
    daysToDue,
    setDaysToDue,
    minDaysSinceDispatch,
    setMinDaysSinceDispatch,
    minDebtValue,
    setMinDebtValue,
    recordLimit,
    setRecordLimit,
    eligibleItems: sortedEligible,
    totalEligibleCount: eligibleItems.length,
    preSelectedItems,
    selectionEligible,
    selectionPreSelected,
    sortCol,
    sortDir,
    toggleSort,
    toggleSelection,
    selectAll,
    moveSelected,
    fetchDebts,
    loading,
    setEligibleItems,
    setPreSelectedItems,
    setSelectionPreSelected,

    // Pesquisa exports
    searchUcs,
    setSearchUcs,
    searchDate,
    setSearchDate,
    researchedItems,
    reGeneratedItems,
    loadingResearch,
    exportingResearch,
    fetchResearchedItems,
    savePhones,
    handleExportResearched,
    handleGiveUp,
    itemsToExportCount: researchedItems.filter(
      (item) => item.telefones_pesquisa && item.telefones_pesquisa.trim().length > 0,
    ).length,
    exportingReGen,
    saveReGenPhones,
    handleExportReGen,
    itemsToExportReGenCount: reGeneratedItems.filter((item) => item.is_edited).length,
    reGenPage,
    reGenTotalCount,
  }
}
