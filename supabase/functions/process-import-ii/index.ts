import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'npm:xlsx'
import { parse as csvParse } from 'npm:csv-parse'
import { Readable } from 'node:stream'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function parseDateString(val: string) {
  if (!val) return val
  if (val.length >= 10 && val[4] === '-') return val // Fast path for ISO-like dates

  const brDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  const match = val.match(brDateRegex)
  if (match) {
    const [, d, m, y, h, min, s] = match
    return `${y}-${m}-${d}T${h || '00'}:${min || '00'}:${s || '00'}Z`
  }
  return val
}

const pendingDebtsColumns = [
  'cod_pess_fat',
  'endereco',
  'pessoa_fatura_celular',
  'pessoa_fatura_cpf_cnpj',
  'pessoa_fatura_nome',
  'proprietario_celular',
  'proprietario_cpf_cnpj',
  'proprietario_nome',
  'qt_fats',
  'refs',
  'responsavel_celular',
  'responsavel_cpf_cnpj',
  'responsavel_nome',
  'setor',
  'situ_docto',
  'ta_nome_de_quem',
  'uc',
  'uc_repete',
  'valor_total',
  'valor_vencido',
  'valor_a_vencer',
  'valor_retidas_em_aberto',
  'dt_vencto_ref_mais_recente',
  'dt_vencto_ref_mais_antiga',
  'situacao_ligacao',
  'tem_negociacao_vencida',
  'valor_vencido_neg_com_ativa',
  'qtd_os_total_cancel_devolv',
  'ultima_data_criacao_os',
]

const pendingDebtsMapping: Record<string, string> = {
  tem_negociacao_ativa_e_vencida: 'tem_negociacao_vencida',
}

const gisUsersMapping: Record<string, string> = {
  usuarioid: 'usuario_id',
  isvisivel: 'is_visivel',
  isativo: 'is_ativo',
}

const dailyReadingsMapping: Record<string, string> = {
  leituraid: 'leitura_id',
  datacriacao: 'data_criacao',
  ocorrenciaabreviada: 'ocorrencia_abreviada',
  usuarioid: 'usuario_id',
  ucid: 'uc_id',
  situacaoligacao: 'situacao_ligacao',
  descricaoligacao: 'descricao_ligacao',
  datareferencia: 'data_referencia',
  leituraanterior: 'leitura_anterior',
  dataleituraanterior: 'data_leitura_anterior',
  leiturareal: 'leitura_real',
  dataleiturareal: 'data_leitura_real',
  consumoreal: 'consumo_real',
  leituracalculada: 'leitura_calculada',
  dataleituracalculada: 'data_leitura_calculada',
  consumocalculado: 'consumo_calculado',
  mediaconsumo: 'media_consumo',
  ocorrenciaid: 'ocorrencia_id',
  documentoid: 'documento_id',
  localizacaoligacao: 'localizacao_ligacao',
  lotemedicaoid: 'lote_medicao_id',
  dataapresentacaodocumento: 'data_apresentacao_documento',
  id: 'original_id',
}

const keyMappingCache = new Map<string, string>()

function getNormalizedKey(key: string, importType: string) {
  const cacheKey = `${importType}_${key}`
  if (keyMappingCache.has(cacheKey)) return keyMappingCache.get(cacheKey)!

  let normKey = key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')

  if (importType === 'daily_readings' && dailyReadingsMapping[normKey]) {
    normKey = dailyReadingsMapping[normKey]
  } else if (importType === 'pending_debts' && pendingDebtsMapping[normKey]) {
    normKey = pendingDebtsMapping[normKey]
  } else if (importType === 'gis_users' && gisUsersMapping[normKey]) {
    normKey = gisUsersMapping[normKey]
  }

  keyMappingCache.set(cacheKey, normKey)
  return normKey
}

function normalizeRecord(row: any, importType: string) {
  const newRow: any = {}

  const normalizedInput: any = {}
  for (const key in row) {
    const normKey = getNormalizedKey(key, importType)
    normalizedInput[normKey] = row[key]
  }

  if (importType === 'pending_debts') {
    for (const col of pendingDebtsColumns) {
      let val = normalizedInput[col]
      if (val === '' || val === undefined || val === 'NULL' || val === 'null') {
        val = null
      }

      if (val !== null) {
        if (
          [
            'valor_total',
            'valor_vencido',
            'valor_a_vencer',
            'valor_retidas_em_aberto',
            'valor_vencido_neg_com_ativa',
          ].includes(col)
        ) {
          if (typeof val === 'string') {
            if (val.includes(',') && !val.includes('.')) {
              val = parseFloat(val.replace(',', '.'))
            } else if (val.includes(',') && val.includes('.')) {
              val = parseFloat(val.replace(/\./g, '').replace(',', '.'))
            } else {
              val = parseFloat(val)
            }
          }
          if (isNaN(val)) val = null
        } else if (col === 'qt_fats' || col === 'qtd_os_total_cancel_devolv') {
          val = parseInt(String(val), 10)
          if (isNaN(val)) val = null
        } else if (
          [
            'dt_vencto_ref_mais_recente',
            'dt_vencto_ref_mais_antiga',
            'ultima_data_criacao_os',
          ].includes(col)
        ) {
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0]
          } else if (typeof val === 'string') {
            const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
            if (brMatch) {
              val = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
            } else if (val.includes('T')) {
              val = val.split('T')[0]
            } else if (val.includes(' ')) {
              val = val.split(' ')[0]
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
              val = null
            }
          }
        } else if (col === 'tem_negociacao_vencida') {
          if (typeof val === 'string') {
            const upper = val.toUpperCase().trim()
            if (upper === 'SIM') val = true
            else if (upper === 'NAO' || upper === 'NÃO') val = false
            else val = false
          } else {
            val = Boolean(val)
          }
        } else if (typeof val === 'string') {
          val = String(val).trim()
        }
      }
      newRow[col] = val
    }
  } else {
    for (const normKey in normalizedInput) {
      let val = normalizedInput[normKey]
      if (val === '' || val === undefined || val === 'NULL' || val === 'null') {
        val = null
      } else if (val instanceof Date) {
        val = val.toISOString()
      } else if (typeof val === 'string') {
        val = parseDateString(val)
      }

      const ignoredColumns =
        importType === 'gis_users'
          ? []
          : [
              'is_visivel',
              'isvisivel',
              'organizacao_id',
              'organizacaoid',
              'os_id',
              'osid',
              'tipo_calculo',
              'tipocalculo',
              'hidrometro_id',
              'hidrometroid',
            ]
      if (ignoredColumns.includes(normKey)) {
        continue
      }

      if (importType === 'gis_users') {
        if (['is_visivel', 'is_ativo'].includes(normKey)) {
          val = val === 1 || val === '1' || val === true || val === 'true' || val === 'SIM'
        } else if (normKey === 'usuario_id') {
          val = String(val)
        }
      }

      if (importType === 'settlements') {
        if (['valor_total', 'neg_valor_acordo', 'neg_desconto'].includes(normKey)) {
          if (typeof val === 'string') {
            if (val.includes(',') && !val.includes('.')) val = parseFloat(val.replace(',', '.'))
            else if (val.includes(',') && val.includes('.'))
              val = parseFloat(val.replace(/\./g, '').replace(',', '.'))
            else val = parseFloat(val)
          }
          if (isNaN(val)) val = null
        } else if (['qt_fats', 'neg_parcelas'].includes(normKey)) {
          val = parseInt(String(val), 10)
          if (isNaN(val)) val = null
        }
      }

      if (normKey) {
        newRow[normKey] = val
      }
    }
  }

  return newRow
}

async function insertChunk(
  importType: string,
  chunk: any[],
): Promise<{ inserted: number; ignored: number }> {
  if (importType === 'pending_debts') {
    const chunkWithActive = chunk.map((r: any) => ({ ...r, is_active: true }))
    const { error } = await supabase
      .from('pending_debts')
      .upsert(chunkWithActive, { onConflict: 'uc,cod_pess_fat' })
    if (error) {
      console.error(`Erro inserindo chunk na tabela pending_debts:`, error)
      throw new Error(`Falha ao inserir registros: ${error.message}`)
    }
    return { inserted: chunk.length, ignored: 0 }
  } else if (importType === 'settlements') {
    const ucList = [...new Set(chunk.map((r: any) => r.uc).filter(Boolean))]

    const { data: existing, error: fetchError } = await supabase
      .from('settlements')
      .select(
        'uc, cod_pess_fat, valor_total, datacriacao, databaixa_final, databaixa_inicial, datacredito_final, datacredito_inicial, neg_data, refs',
      )
      .in('uc', ucList)

    if (fetchError) throw new Error(`Falha ao buscar baixas existentes: ${fetchError.message}`)

    const getHash = (r: any) => {
      let dateVal = ''
      if (r.datacriacao) {
        const d = new Date(r.datacriacao)
        if (!isNaN(d.getTime())) {
          d.setMilliseconds(0)
          dateVal = d.toISOString()
        } else {
          dateVal = String(r.datacriacao)
        }
      } else {
        dateVal = String(
          r.databaixa_final ||
            r.databaixa_inicial ||
            r.datacredito_final ||
            r.datacredito_inicial ||
            r.neg_data ||
            '',
        )
          .split('T')[0]
          .split(' ')[0]
      }
      const val = r.valor_total ? Number(r.valor_total).toFixed(2) : '0.00'
      return `${r.uc}_${r.cod_pess_fat || ''}_${val}_${dateVal}_${r.refs || ''}`
    }

    const existingHashSet = new Set((existing || []).map(getHash))

    const newRecords = []
    let ignored = 0
    const chunkHashSet = new Set()

    for (const row of chunk) {
      const hash = getHash(row)
      if (existingHashSet.has(hash) || chunkHashSet.has(hash)) {
        ignored++
      } else {
        chunkHashSet.add(hash)
        newRecords.push(row)
      }
    }

    if (newRecords.length > 0) {
      const { error } = await supabase.from('settlements').insert(newRecords)
      if (error) {
        console.error(`Erro inserindo chunk na tabela settlements:`, error)
        throw new Error(`Falha ao inserir registros: ${error.message}`)
      }
    }

    return { inserted: newRecords.length, ignored }
  } else if (importType === 'gis_users') {
    const allowedColumns = [
      'usuario_id',
      'login',
      'is_visivel',
      'is_ativo',
      'nome',
      'celular',
      'email',
    ]
    const filteredChunk = chunk.map((row: any) => {
      const newRow: any = {}
      for (const col of allowedColumns) {
        if (row[col] !== undefined) newRow[col] = row[col]
      }
      return newRow
    })

    const { error } = await supabase
      .from('gis_users')
      .upsert(filteredChunk, { onConflict: 'usuario_id', ignoreDuplicates: false })
    if (error) {
      console.error(`Erro inserindo chunk na tabela gis_users:`, error)
      throw new Error(`Falha ao inserir registros: ${error.message}`)
    }
    return { inserted: chunk.length, ignored: 0 }
  } else if (importType === 'daily_readings') {
    const chunkMap = new Map()
    const recordsWithoutId = []

    for (const row of chunk) {
      if (!row.original_id) {
        recordsWithoutId.push(row)
        continue
      }

      const existingInChunk = chunkMap.get(row.original_id)
      if (existingInChunk) {
        let existingTime = new Date(
          existingInChunk.data_leitura_real || existingInChunk.data_criacao || 0,
        ).getTime()
        let newTime = new Date(row.data_leitura_real || row.data_criacao || 0).getTime()

        if (isNaN(existingTime)) existingTime = 0
        if (isNaN(newTime)) newTime = 0

        if (newTime >= existingTime) {
          chunkMap.set(row.original_id, row)
        }
      } else {
        chunkMap.set(row.original_id, row)
      }
    }

    const uniqueChunk = Array.from(chunkMap.values())
    const idsToFetch = uniqueChunk.map((r: any) => r.original_id)

    let finalChunk = [...recordsWithoutId]
    let ignored = chunk.length - (uniqueChunk.length + recordsWithoutId.length)

    if (idsToFetch.length > 0) {
      const { data: existingDb, error: fetchError } = await supabase
        .from('daily_readings')
        .select('original_id, data_leitura_real, data_criacao')
        .in('original_id', idsToFetch)

      if (fetchError) {
        console.error(`Erro buscando daily_readings existentes:`, fetchError)
        throw new Error(`Falha ao buscar leituras existentes: ${fetchError.message}`)
      }

      const dbMap = new Map((existingDb || []).map((r) => [r.original_id, r]))

      for (const row of uniqueChunk) {
        const dbRecord = dbMap.get(row.original_id)
        if (dbRecord) {
          let dbTime = new Date(dbRecord.data_leitura_real || dbRecord.data_criacao || 0).getTime()
          let newTime = new Date(row.data_leitura_real || row.data_criacao || 0).getTime()

          if (isNaN(dbTime)) dbTime = 0
          if (isNaN(newTime)) newTime = 0

          if (newTime >= dbTime) {
            finalChunk.push(row)
          } else {
            ignored++
          }
        } else {
          finalChunk.push(row)
        }
      }
    }

    if (finalChunk.length > 0) {
      const { error } = await supabase
        .from('daily_readings')
        .upsert(finalChunk, { onConflict: 'original_id', ignoreDuplicates: false })
      if (error) {
        console.error(`Erro inserindo chunk na tabela daily_readings:`, error)
        throw new Error(`Falha ao inserir registros: ${error.message}`)
      }
    }

    return { inserted: finalChunk.length, ignored }
  } else {
    throw new Error('Tipo de importação desconhecido.')
  }
}

async function processJob(jobId: string) {
  try {
    // 1. "Watchdog" rotina automática para limpar jobs travados
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('import_jobs')
      .update({
        status: 'error',
        error_details: 'Processo encerrado automaticamente (Timeout do Watchdog > 2h).',
        completed_at: new Date().toISOString(),
      })
      .in('status', ['processing', 'pending'])
      .lt('created_at', twoHoursAgo)

    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', jobId)
      .single()
    if (jobError || !job) throw new Error('Job not found')

    if (job.status === 'cancelled') return // Evita processar jobs que o usuário já cancelou

    await supabase
      .from('import_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', jobId)

    const importType = job.import_type
    const isCsv = job.file_path.toLowerCase().endsWith('.csv')

    if (importType === 'pending_debts') {
      await supabase.rpc('truncate_pending_debts')
    }

    let totalProcessed = 0
    let totalRecords = 0
    let latestRecordDate: string | null = null
    let invalidRecords: any[] = []

    // 2. Timeout Inteligente (Limite de Execução de Edge Function)
    const MAX_EXECUTION_TIME = 4.5 * 60 * 1000 // 4.5 minutes
    const jobStartTime = Date.now()

    if (isCsv) {
      // Processamento em Streaming para arquivos CSV
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('imports')
        .createSignedUrl(job.file_path, 3600)
      if (signedUrlError || !signedUrlData)
        throw new Error('Falha ao gerar URL de download para o CSV')

      const res = await fetch(signedUrlData.signedUrl)
      if (!res.ok || !res.body) throw new Error('Falha ao acessar o arquivo CSV')

      const nodeStream = Readable.fromWeb(res.body as any)
      const parser = nodeStream.pipe(
        csvParse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
          relax_column_count: true,
          delimiter: importType === 'pending_debts' ? ';' : [';', ',', '\t', '|'], // Forçar ';' em pending_debts
        }),
      )

      let chunk: any[] = []
      const chunkSize = 1000 // Reduzido para 1000 para evitar erro de limite de memória (Memory Limit Exceeded)
      let lastUpdateTime = Date.now()
      let isFirstRecord = true

      for await (const record of parser) {
        if (isFirstRecord) {
          isFirstRecord = false
          const keys = Object.keys(record)
          // Circuit Breaker: previne inserir uma linha gigante indicando delimitador inválido
          if (keys.some((k) => k.length > 60)) {
            throw new Error(
              'Falha na detecção de colunas. Verifique se o arquivo usa o delimitador correto (ponto-e-vírgula obrigatório para pendências) e tem os cabeçalhos corretos.',
            )
          }
        }

        totalRecords++
        const normalized = normalizeRecord(record, importType)

        let isValid = true
        if (importType === 'pending_debts' && normalized.refs) {
          const tokens = String(normalized.refs).trim().split(/\s+/)
          const refRegex = /^'(?:NEG|\d{2}\/\d{2})$/
          if (!tokens.every((t) => refRegex.test(t))) {
            isValid = false
            invalidRecords.push({
              uc: normalized.uc,
              cod_pess_fat: normalized.cod_pess_fat,
              refs: normalized.refs,
            })
          }
        }

        if (!isValid) continue

        if (totalRecords % 5000 === 0 && importType === 'daily_readings') {
          console.log(`[Diagnostic] Reached record ${totalRecords}. Processing successfully...`)
        }

        if (importType === 'settlements' && normalized.datacriacao) {
          if (!latestRecordDate || new Date(normalized.datacriacao) > new Date(latestRecordDate)) {
            latestRecordDate = normalized.datacriacao
          }
        }

        chunk.push(normalized)

        if (chunk.length >= chunkSize) {
          // Checa por cancelamento
          const { data: currentJob } = await supabase
            .from('import_jobs')
            .select('status')
            .eq('id', jobId)
            .single()
          if (currentJob && currentJob.status === 'cancelled') {
            throw new Error('Cancelado pelo usuário.')
          }

          // Checa por timeout
          if (Date.now() - jobStartTime > MAX_EXECUTION_TIME) {
            const resChunk = await insertChunk(importType, chunk)
            totalProcessed += resChunk.inserted
            throw new Error(
              `Timeout de segurança atingido. Processamento interrompido parcialmente. ${totalProcessed} registros salvos.`,
            )
          }

          const resChunk = await insertChunk(importType, chunk)
          totalProcessed += resChunk.inserted
          chunk = []

          const now = Date.now()
          if (now - lastUpdateTime > 2000) {
            await supabase
              .from('import_jobs')
              .update({
                processed_records: totalProcessed,
                total_records: totalRecords,
              })
              .eq('id', jobId)
            lastUpdateTime = now
          }
        }
      }

      if (chunk.length > 0) {
        const { data: currentJob } = await supabase
          .from('import_jobs')
          .select('status')
          .eq('id', jobId)
          .single()
        if (currentJob && currentJob.status === 'cancelled') {
          throw new Error('Cancelado pelo usuário.')
        }
        const resChunk = await insertChunk(importType, chunk)
        totalProcessed += resChunk.inserted
      }
    } else {
      // Processamento em memória para arquivos XLSX
      const { data: fileData, error: fileError } = await supabase.storage
        .from('imports')
        .download(job.file_path)
      if (fileError || !fileData) throw new Error('Falha ao baixar o arquivo XLSX')

      const arrayBuffer = await fileData.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'buffer', cellDates: true })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: null })

      if (rows.length === 0) throw new Error('O arquivo está vazio.')
      totalRecords = rows.length

      let chunk: any[] = []
      const chunkSize = 1000 // Reduzido para 1000 para evitar erro de limite de memória (Memory Limit Exceeded)
      let lastUpdateTime = Date.now()
      let isFirstRecord = true

      for (let i = 0; i < rows.length; i++) {
        if (isFirstRecord) {
          isFirstRecord = false
          const keys = Object.keys(rows[i] as object)
          if (keys.some((k) => k.length > 60)) {
            throw new Error('Falha na detecção de colunas no XLSX. Formato inválido.')
          }
        }

        const normalized = normalizeRecord(rows[i], importType)

        let isValid = true
        if (importType === 'pending_debts' && normalized.refs) {
          const tokens = String(normalized.refs).trim().split(/\s+/)
          const refRegex = /^'(?:NEG|\d{2}\/\d{2})$/
          if (!tokens.every((t) => refRegex.test(t))) {
            isValid = false
            invalidRecords.push({
              uc: normalized.uc,
              cod_pess_fat: normalized.cod_pess_fat,
              refs: normalized.refs,
            })
          }
        }

        if (!isValid) continue

        if (i > 0 && i % 5000 === 0 && importType === 'daily_readings') {
          console.log(`[Diagnostic] Reached record ${i} on XLSX. Processing successfully...`)
        }

        if (importType === 'settlements' && normalized.datacriacao) {
          if (!latestRecordDate || new Date(normalized.datacriacao) > new Date(latestRecordDate)) {
            latestRecordDate = normalized.datacriacao
          }
        }

        chunk.push(normalized)

        if (chunk.length >= chunkSize) {
          const { data: currentJob } = await supabase
            .from('import_jobs')
            .select('status')
            .eq('id', jobId)
            .single()
          if (currentJob && currentJob.status === 'cancelled') {
            throw new Error('Cancelado pelo usuário.')
          }

          if (Date.now() - jobStartTime > MAX_EXECUTION_TIME) {
            const resChunk = await insertChunk(importType, chunk)
            totalProcessed += resChunk.inserted
            throw new Error(
              `Timeout de segurança atingido. Processamento interrompido parcialmente. ${totalProcessed} registros salvos.`,
            )
          }

          const resChunk = await insertChunk(importType, chunk)
          totalProcessed += resChunk.inserted
          chunk = []

          const now = Date.now()
          if (now - lastUpdateTime > 2000) {
            await supabase
              .from('import_jobs')
              .update({
                processed_records: totalProcessed,
                total_records: totalRecords,
              })
              .eq('id', jobId)
            lastUpdateTime = now
          }
        }
      }

      if (chunk.length > 0) {
        const { data: currentJob } = await supabase
          .from('import_jobs')
          .select('status')
          .eq('id', jobId)
          .single()
        if (currentJob && currentJob.status === 'cancelled') {
          throw new Error('Cancelado pelo usuário.')
        }
        const resChunk = await insertChunk(importType, chunk)
        totalProcessed += resChunk.inserted
      }
    }

    // Rotinas pós-importação
    if (importType === 'settlements') {
      await supabase.rpc('execute_post_import_routines')
    }

    // Finaliza Job somente se não houver sido cancelado por outra interface
    const { data: finalJob } = await supabase
      .from('import_jobs')
      .select('status')
      .eq('id', jobId)
      .single()
    if (finalJob && finalJob.status === 'cancelled') {
      return
    }

    let errorDetails = null
    if (invalidRecords.length > 0) {
      errorDetails = JSON.stringify({
        type: 'DISCARDS',
        message: `${invalidRecords.length} registros descartados por REFS inválido.`,
        records: invalidRecords.slice(0, 100),
      })
    }

    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_records: totalRecords,
        processed_records: totalProcessed,
        error_details: errorDetails,
      })
      .eq('id', jobId)

    let tableNameLabel = importType
    if (importType === 'pending_debts') tableNameLabel = 'Pendências (Substituição Total) [Nuvem]'
    else if (importType === 'settlements') tableNameLabel = 'Baixas (Carga Incremental) [Nuvem]'
    else if (importType === 'daily_readings') tableNameLabel = 'Leituras Diárias [Nuvem]'
    else if (importType === 'gis_users') tableNameLabel = 'Usuários GIS [Nuvem]'

    await supabase.from('import_history').insert({
      table_name: tableNameLabel,
      total_records: totalRecords,
      inserted_records: totalProcessed,
      ignored_records: totalRecords > totalProcessed ? totalRecords - totalProcessed : 0,
      latest_record_date: latestRecordDate,
    })
  } catch (error: any) {
    console.error('Job error:', error)

    // Ignora a atualização de erro se a intenção foi mesmo o cancelamento do usuário
    if (error.message === 'Cancelado pelo usuário.') {
      return
    }

    await supabase
      .from('import_jobs')
      .update({
        status: 'error',
        error_details: error.message || String(error),
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return new Response(JSON.stringify({ error: 'jobId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const promise = processJob(jobId)
    // Run the import processing in the background
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore: EdgeRuntime is available globally in Supabase edge functions
      EdgeRuntime.waitUntil(promise)
    } else {
      promise.catch(console.error)
    }

    return new Response(JSON.stringify({ message: 'Job started' }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
