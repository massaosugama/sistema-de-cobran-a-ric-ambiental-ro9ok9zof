import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Paperclip,
  Scale,
  Phone,
  Scissors,
  Split,
  Target,
  UserMinus,
  Wrench,
  CircleDollarSign,
} from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { parseDebtRow, type ParsedDebt } from '@/services/debts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { UnifiedUploadArea, type UploadedFile } from '@/components/UnifiedUploadArea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'

export type QueueDebt = ParsedDebt & {
  latest_contact_date?: string | null
  termo_date?: string | null
  has_termo?: boolean
  operator_ids?: string[] | null
  contact_count?: number
  valor_retidas_em_aberto?: number
  raw_qt_fats?: number
  raw_valor_vencido?: number
  is_legal?: boolean
  is_strategic?: boolean
  is_cut?: boolean
  is_recut?: boolean
  is_ferrule?: boolean
}

export default function CheckTerms() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)

  // Global Filters State
  const [filterConnection, setFilterConnection] = useState('ligacao')
  const [filterStatus, setFilterStatus] = useState('nao_contem_retidas')
  const [filterDue, setFilterDue] = useState('ambos')
  const [filterHasNegociacao, setFilterHasNegociacao] = useState('sim')
  const [filterNegociacoesVencidas, setFilterNegociacoesVencidas] = useState('sim')
  const [selectedQueues, setSelectedQueues] = useState<string[]>([])

  const [globalSearch, setGlobalSearch] = useState('')
  const [globalAddress, setGlobalAddress] = useState('')
  const [globalPhone, setGlobalPhone] = useState('')
  const debouncedGlobalSearch = useDebounce(globalSearch, 500)
  const debouncedGlobalAddress = useDebounce(globalAddress, 500)
  const debouncedGlobalPhone = useDebounce(globalPhone, 500)

  // Debtors State
  const [debtors, setDebtors] = useState<QueueDebt[]>([])
  const [debtorsCount, setDebtorsCount] = useState(0)
  const [debtorsTotalVencidoNeg, setDebtorsTotalVencidoNeg] = useState(0)
  const [debtorsLoading, setDebtorsLoading] = useState(false)
  const [debtorsPage, setDebtorsPage] = useState(1)
  const [debtorsPageSize, setDebtorsPageSize] = useState('10')
  const [debtorsSortBy, setDebtorsSortBy] = useState('negoc_vencidas')

  // Attended State
  const [contacts, setContacts] = useState<QueueDebt[]>([])
  const [contactsCount, setContactsCount] = useState(0)

  // Regularized State
  const [regularized, setRegularized] = useState<any[]>([])
  const [regularizedCount, setRegularizedCount] = useState(0)
  const [regularizedLoading, setRegularizedLoading] = useState(false)
  const [regularizedPage, setRegularizedPage] = useState(1)
  const [regularizedPageSize, setRegularizedPageSize] = useState('10')
  const [contactsTotalVencidoNeg, setContactsTotalVencidoNeg] = useState(0)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPage, setContactsPage] = useState(1)
  const [contactsPageSize, setContactsPageSize] = useState('10')
  const [contactsSortBy, setContactsSortBy] = useState('negoc_vencidas')

  // Transfer State
  const [transferAction, setTransferAction] = useState<{
    debt: QueueDebt
    queue: 'legal' | 'cut' | 'recut' | 'ferrule'
  } | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  // Operators List
  const [operators, setOperators] = useState<any[]>([])

  // Modal State
  const [selectedDebt, setSelectedDebt] = useState<QueueDebt | null>(null)

  // View Only Regularized Attachments State
  const [isViewOnlySheetOpen, setIsViewOnlySheetOpen] = useState(false)
  const [viewOnlyFiles, setViewOnlyFiles] = useState<UploadedFile[]>([])
  const [viewOnlyUc, setViewOnlyUc] = useState<string | null>(null)

  // Attachments State
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [fileDeleteAction, setFileDeleteAction] = useState<{
    file: UploadedFile
    resolve: (value: boolean) => void
  } | null>(null)
  const [isUndoDialogOpen, setIsUndoDialogOpen] = useState(false)

  const confirmFileDelete = useCallback((index: number, file: UploadedFile): Promise<boolean> => {
    return new Promise((resolve) => {
      setFileDeleteAction({
        file,
        resolve: (confirmed) => {
          setFileDeleteAction(null)
          resolve(confirmed)
        },
      })
    })
  }, [])

  const handleUndoTermo = async () => {
    if (!selectedDebt) return
    setIsUploading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('contact_history')
        .select('id')
        .eq('uc', selectedDebt.uc)
        .eq('cod_pess_fat', selectedDebt.personCode || selectedDebt.uc)
        .eq('status', 'TERMO_ANEXADO')
        .eq('is_active', true)

      if (fetchError) throw fetchError

      if (data && data.length > 0) {
        const { error: updateError } = await supabase
          .from('contact_history')
          .update({ is_active: false })
          .in(
            'id',
            data.map((d) => d.id),
          )

        if (updateError) throw updateError
      }

      toast({ title: 'Sucesso', description: 'Confirmação desfeita. Registro retornado.' })
      setIsUndoDialogOpen(false)
      setIsAttachSheetOpen(false)
      fetchDebtors()
      fetchContacts()
      fetchRegularized()
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Erro', description: 'Erro ao desfazer confirmação', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleViewRegularized = (r: any) => {
    let files: UploadedFile[] = []
    if (r.images) {
      try {
        const parsed = typeof r.images === 'string' ? JSON.parse(r.images) : r.images
        if (Array.isArray(parsed)) {
          files = parsed
        }
      } catch (e) {
        console.error('Error parsing regularized images', e)
      }
    }
    setViewOnlyFiles(files)
    setViewOnlyUc(r.uc)
    setIsViewOnlySheetOpen(true)
  }

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, first_name, last_name, color')
      .order('first_name', { ascending: true })
      .then(({ data }) => {
        if (data) setOperators(data)
      })
  }, [])

  const applyGlobalFilters = useCallback(
    (q: any) => {
      if (filterConnection === 'ligacao') {
        q = q.or('setor.neq.4036,setor.is.null')
      } else if (filterConnection === 'lotes') {
        q = q.eq('setor', '4036')
      }

      if (filterStatus === 'nao_contem_retidas') {
        q = q.or('valor_retidas_em_aberto.lte.0,valor_retidas_em_aberto.is.null')
      } else if (filterStatus === 'contem_retidas') {
        q = q.gt('valor_retidas_em_aberto', 0)
      }

      if (filterDue === 'vencidos') {
        q = q.gt('valor_vencido', 0)
      } else if (filterDue === 'a_vencer') {
        q = q.gt('valor_a_vencer', 0)
      }

      if (filterHasNegociacao === 'sim') {
        q = q.ilike('refs', '%NEG%')
      }

      if (filterNegociacoesVencidas === 'sim') {
        q = q.eq('tem_negociacao_vencida', true)
      }

      if (selectedQueues.length > 0) {
        const orConditions: string[] = []
        if (selectedQueues.includes('sem_fase')) {
          orConditions.push(
            'and(is_strategic.eq.false,is_legal.eq.false,is_cut.eq.false,is_recut.eq.false,is_ferrule.eq.false)',
          )
        }
        if (selectedQueues.includes('estrategica')) orConditions.push('is_strategic.eq.true')
        if (selectedQueues.includes('juridico')) orConditions.push('is_legal.eq.true')
        if (selectedQueues.includes('corte')) orConditions.push('is_cut.eq.true')
        if (selectedQueues.includes('recorte')) orConditions.push('is_recut.eq.true')
        if (selectedQueues.includes('ferrule')) orConditions.push('is_ferrule.eq.true')

        if (orConditions.length > 0) {
          q = q.or(orConditions.join(','))
        }
      }

      if (debouncedGlobalSearch) {
        q = q.or(
          `uc.ilike.%${debouncedGlobalSearch}%,pessoa_fatura_nome.ilike.%${debouncedGlobalSearch}%,cod_pess_fat.ilike.%${debouncedGlobalSearch}%`,
        )
      }
      if (debouncedGlobalAddress) {
        q = q.ilike('endereco', `%${debouncedGlobalAddress}%`)
      }
      if (debouncedGlobalPhone) {
        const cleanPhone = debouncedGlobalPhone.replace(/\D/g, '')
        if (cleanPhone) {
          const wildcardPhone = `%${cleanPhone.split('').join('%')}%`
          q = q.or(
            `pessoa_fatura_celular.ilike.${wildcardPhone},proprietario_celular.ilike.${wildcardPhone},responsavel_celular.ilike.${wildcardPhone}`,
          )
        }
      }
      return q
    },
    [
      filterConnection,
      filterStatus,
      filterDue,
      filterHasNegociacao,
      filterNegociacoesVencidas,
      selectedQueues,
      debouncedGlobalSearch,
      debouncedGlobalAddress,
      debouncedGlobalPhone,
    ],
  )

  const fetchDebtors = useCallback(async () => {
    setDebtorsLoading(true)
    try {
      let q = supabase.from('vw_terms_queue_debts' as any).select('*', { count: 'exact' })
      q = applyGlobalFilters(q)
      q = q.eq('has_termo', false)

      let sumQ = supabase.from('vw_terms_queue_debts' as any).select('valor_vencido_neg_com_ativa')
      sumQ = applyGlobalFilters(sumQ)
      sumQ = sumQ.eq('has_termo', false)

      const size = parseInt(debtorsPageSize)
      const from = (debtorsPage - 1) * size
      const to = from + size - 1

      if (debtorsSortBy === 'uc') {
        q = q
          .order('uc_numeric' as any, { ascending: true, nullsFirst: false })
          .order('uc', { ascending: true })
      } else if (debtorsSortBy === 'nome') {
        q = q.order('pessoa_fatura_nome', { ascending: true, nullsFirst: false })
      } else if (debtorsSortBy === 'negoc_vencidas') {
        q = q
          .order('valor_vencido_neg_com_ativa', { ascending: false, nullsFirst: false })
          .order('valor_total', { ascending: false })
      } else {
        q = q.order('valor_total', { ascending: false })
      }

      q = q.range(from, to)

      const [mainRes, sumRes] = await Promise.all([q, sumQ])

      if (!mainRes.error && mainRes.data) {
        if (!sumRes.error && sumRes.data) {
          const sum = sumRes.data.reduce(
            (acc, curr) => acc + (Number(curr.valor_vencido_neg_com_ativa) || 0),
            0,
          )
          setDebtorsTotalVencidoNeg(sum)
        } else {
          setDebtorsTotalVencidoNeg(0)
        }

        const data = mainRes.data
        const count = mainRes.count

        setDebtors(
          data.map((row: any) => ({
            ...parseDebtRow(row),
            latest_contact_date: row.latest_contact_date,
            termo_date: row.termo_date,
            has_termo: row.has_termo,
            operator_ids: row.operator_ids,
            contact_count: row.contact_count,
            valor_retidas_em_aberto: Number(row.valor_retidas_em_aberto) || 0,
            raw_qt_fats: row.qt_fats,
            raw_valor_vencido: row.valor_vencido,
            is_legal: row.is_legal,
            is_strategic: row.is_strategic,
            is_cut: row.is_cut,
            is_recut: row.is_recut,
            is_ferrule: row.is_ferrule,
          })),
        )
        setDebtorsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDebtorsLoading(false)
    }
  }, [applyGlobalFilters, debtorsPage, debtorsPageSize, debtorsSortBy])

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true)
    try {
      let q = supabase.from('vw_terms_queue_debts' as any).select('*', { count: 'exact' })
      q = q.eq('has_termo', true)
      q = applyGlobalFilters(q)

      let sumQ = supabase.from('vw_terms_queue_debts' as any).select('valor_vencido_neg_com_ativa')
      sumQ = sumQ.eq('has_termo', true)
      sumQ = applyGlobalFilters(sumQ)

      const size = parseInt(contactsPageSize)
      const from = (contactsPage - 1) * size
      const to = from + size - 1

      if (contactsSortBy === 'uc') {
        q = q
          .order('uc_numeric' as any, { ascending: true, nullsFirst: false })
          .order('uc', { ascending: true })
      } else if (contactsSortBy === 'nome') {
        q = q.order('pessoa_fatura_nome', { ascending: true, nullsFirst: false })
      } else if (contactsSortBy === 'negoc_vencidas') {
        q = q
          .order('valor_vencido_neg_com_ativa', { ascending: false, nullsFirst: false })
          .order('termo_date', { ascending: false, nullsFirst: false })
      } else if (contactsSortBy === 'valor_total') {
        q = q
          .order('valor_total', { ascending: false })
          .order('termo_date', { ascending: false, nullsFirst: false })
      } else {
        q = q.order('termo_date', { ascending: false, nullsFirst: false })
      }

      q = q.range(from, to)

      const [mainRes, sumRes] = await Promise.all([q, sumQ])

      if (!mainRes.error && mainRes.data) {
        if (!sumRes.error && sumRes.data) {
          const sum = sumRes.data.reduce(
            (acc, curr) => acc + (Number(curr.valor_vencido_neg_com_ativa) || 0),
            0,
          )
          setContactsTotalVencidoNeg(sum)
        } else {
          setContactsTotalVencidoNeg(0)
        }

        const data = mainRes.data
        const count = mainRes.count

        setContacts(
          data.map((row: any) => ({
            ...parseDebtRow(row),
            latest_contact_date: row.latest_contact_date,
            termo_date: row.termo_date,
            has_termo: row.has_termo,
            operator_ids: row.operator_ids,
            contact_count: row.contact_count,
            valor_retidas_em_aberto: Number(row.valor_retidas_em_aberto) || 0,
            raw_qt_fats: row.qt_fats,
            raw_valor_vencido: row.valor_vencido,
            is_legal: row.is_legal,
            is_strategic: row.is_strategic,
            is_cut: row.is_cut,
            is_recut: row.is_recut,
            is_ferrule: row.is_ferrule,
          })),
        )
        setContactsCount(count || 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setContactsLoading(false)
    }
  }, [applyGlobalFilters, contactsPage, contactsPageSize, contactsSortBy])

  const fetchRegularized = useCallback(async () => {
    setRegularizedLoading(true)
    try {
      const size = parseInt(regularizedPageSize)
      const offset = (regularizedPage - 1) * size

      const { data, error } = await supabase.rpc('get_regularized_assignments', {
        p_limit: size,
        p_offset: offset,
      })

      if (error) throw error

      if (data) {
        setRegularized(data)
        setRegularizedCount(data.length > 0 ? Number(data[0].total_count) : 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRegularizedLoading(false)
    }
  }, [regularizedPage, regularizedPageSize])

  useEffect(() => {
    fetchDebtors()
  }, [fetchDebtors])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    fetchRegularized()
  }, [fetchRegularized])

  useEffect(() => {
    const handleContactAdded = () => {
      fetchContacts()
      fetchDebtors()
      fetchRegularized()
    }
    window.addEventListener('contact-added', handleContactAdded)
    return () => window.removeEventListener('contact-added', handleContactAdded)
  }, [fetchContacts, fetchDebtors, fetchRegularized])

  const handleAnexar = async (debt: QueueDebt) => {
    setSelectedDebt(debt)
    setIsAttachSheetOpen(true)

    if (debt.has_termo) {
      setIsUploading(true)
      try {
        const { data, error } = await supabase
          .from('contact_history')
          .select('notes')
          .eq('uc', debt.uc)
          .eq('cod_pess_fat', debt.personCode || debt.uc)
          .eq('status', 'TERMO_ANEXADO')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        let existingFiles: UploadedFile[] = []
        if (data && data.notes) {
          try {
            const parsed = JSON.parse(data.notes)
            if (parsed.files && Array.isArray(parsed.files)) {
              existingFiles = parsed.files
            }
          } catch (e) {
            console.error('Error parsing notes', e)
          }
        }
        setAttachedFiles(existingFiles)
      } catch (err: any) {
        console.error(err)
        toast({ title: 'Erro', description: 'Erro ao carregar anexos', variant: 'destructive' })
        setAttachedFiles([])
      } finally {
        setIsUploading(false)
      }
    } else {
      setAttachedFiles([])
    }
  }

  const handleSaveAttachments = async () => {
    if (!selectedDebt || attachedFiles.length === 0) {
      toast({
        title: 'Nenhum arquivo',
        description: 'Adicione pelo menos um arquivo.',
        variant: 'destructive',
      })
      return
    }

    setIsUploading(true)
    try {
      const uploadedUrls = []

      for (const file of attachedFiles) {
        if (file.url.startsWith('data:')) {
          const res = await fetch(file.url)
          const blob = await res.blob()
          const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const { data, error } = await supabase.storage.from('termos').upload(fileName, blob, {
            contentType: file.type || blob.type,
          })

          if (error) throw error

          const { data: publicUrlData } = supabase.storage.from('termos').getPublicUrl(fileName)
          uploadedUrls.push({
            name: file.name,
            url: publicUrlData.publicUrl,
            caption: file.caption,
          })
        } else {
          uploadedUrls.push(file)
        }
      }

      if (selectedDebt.has_termo) {
        const { data: existingRecords, error: fetchError } = await supabase
          .from('contact_history')
          .select('id')
          .eq('uc', selectedDebt.uc)
          .eq('cod_pess_fat', selectedDebt.personCode || selectedDebt.uc)
          .eq('status', 'TERMO_ANEXADO')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)

        if (fetchError) throw fetchError

        if (existingRecords && existingRecords.length > 0) {
          const { error: updateError } = await supabase
            .from('contact_history')
            .update({
              notes: JSON.stringify({ message: 'Termos anexados', files: uploadedUrls }),
            })
            .eq('id', existingRecords[0].id)

          if (updateError) throw updateError
        } else {
          const { error: contactError } = await supabase.from('contact_history').insert({
            uc: selectedDebt.uc,
            cod_pess_fat: selectedDebt.personCode || selectedDebt.uc,
            operator_id: user?.id,
            contact_type: 'OUTRO',
            status: 'TERMO_ANEXADO',
            notes: JSON.stringify({ message: 'Termos anexados', files: uploadedUrls }),
            snapshot_valor_total: selectedDebt.totalDebt,
            snapshot_valor_vencido: selectedDebt.raw_valor_vencido,
            snapshot_qt_fats: selectedDebt.raw_qt_fats,
          })
          if (contactError) throw contactError
        }
      } else {
        const { error: contactError } = await supabase.from('contact_history').insert({
          uc: selectedDebt.uc,
          cod_pess_fat: selectedDebt.personCode || selectedDebt.uc,
          operator_id: user?.id,
          contact_type: 'OUTRO',
          status: 'TERMO_ANEXADO',
          notes: JSON.stringify({ message: 'Termos anexados', files: uploadedUrls }),
          snapshot_valor_total: selectedDebt.totalDebt,
          snapshot_valor_vencido: selectedDebt.raw_valor_vencido,
          snapshot_qt_fats: selectedDebt.raw_qt_fats,
        })
        if (contactError) throw contactError
      }

      toast({ title: 'Sucesso', description: 'Confirmação e anexos salvos com sucesso!' })
      setIsAttachSheetOpen(false)
      setAttachedFiles([])
      setSelectedDebt(null)
      fetchDebtors()
      fetchContacts()
      fetchRegularized()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro',
        description: err.message || 'Erro ao salvar anexos',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTransferToQueue = async () => {
    if (!transferAction) return
    const { debt, queue } = transferAction
    setIsTransferring(true)
    try {
      const initialStatus = queue === 'legal' ? 'a_encaminhar' : 'para_abrir_os'

      const { error } = await supabase.from('strategic_assignments').insert({
        uc: debt.uc,
        cod_pess_fat: debt.personCode || debt.uc,
        snapshot_nome_cliente: debt.name,
        snapshot_qt_fats: debt.raw_qt_fats,
        snapshot_valor_vencido: debt.raw_valor_vencido,
        status: initialStatus,
        queue_type: queue,
      })

      if (error) throw error

      const queueName =
        queue === 'legal'
          ? 'Jurídico'
          : queue === 'cut'
            ? 'Corte'
            : queue === 'recut'
              ? 'Re-Corte'
              : 'Ferrule'

      toast({
        title: 'Transferência Concluída',
        description: `O registro foi transferido para a Fila ${queueName}.`,
      })

      setTransferAction(null)
      fetchDebtors()
      fetchContacts()
      fetchRegularized()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro na transferência',
        description: err.message || 'Não foi possível transferir o registro.',
        variant: 'destructive',
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const renderPagination = (
    page: number,
    setPage: (p: number) => void,
    totalCount: number,
    pageSize: string,
  ) => {
    const size = parseInt(pageSize)
    const totalPages = Math.ceil(totalCount / size)
    const from = (page - 1) * size + 1
    const to = Math.min(page * size, totalCount)

    return (
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-slate-500">
          {totalCount > 0 ? `Mostrando ${from} a ${to} de ${totalCount}` : 'Nenhum registro'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium px-2 text-slate-600">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderDebtCard = (debt: QueueDebt, isAttended: boolean) => (
    <div
      key={`${debt.uc}_${debt.personCode}`}
      className="p-4 border-b bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 group"
    >
      <div className="flex-1 min-w-0 space-y-1">
        <h3 className="text-[13px] font-bold text-slate-800 truncate uppercase">
          {debt.name || 'SEM NOME'}
        </h3>
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
          <span>UC: {debt.uc}</span>
          {debt.personCode && <span>• {debt.personCode}</span>}
          {debt.isLoteVago && (
            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1">
              Lote Vago
            </span>
          )}
          {debt.valor_retidas_em_aberto && debt.valor_retidas_em_aberto > 0 ? (
            <span className="bg-fuchsia-100 text-fuchsia-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1">
              Retida
            </span>
          ) : null}
          {debt.valor_vencido_neg_com_ativa !== undefined &&
            debt.valor_vencido_neg_com_ativa > 0 && (
              <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1">
                Neg. Vencida: R${' '}
                {debt.valor_vencido_neg_com_ativa.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
          {debt.is_strategic && (
            <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1 flex items-center gap-0.5">
              <Target className="w-2.5 h-2.5" /> [Estratégica]
            </span>
          )}
          {debt.is_legal && (
            <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1 flex items-center gap-0.5">
              <Scale className="w-2.5 h-2.5" /> [Jurídico]
            </span>
          )}
          {debt.is_cut && (
            <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1 flex items-center gap-0.5">
              <Scissors className="w-2.5 h-2.5" /> [Corte]
            </span>
          )}
          {debt.is_recut && (
            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1 flex items-center gap-0.5">
              <Split className="w-2.5 h-2.5" /> [Re-Corte]
            </span>
          )}
          {debt.is_ferrule && (
            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1 flex items-center gap-0.5">
              <Wrench className="w-2.5 h-2.5" /> [Ferrule]
            </span>
          )}
        </div>
        {isAttended && (
          <div className="text-[11px] font-bold text-slate-700">
            R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
        {debt.address && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
            <span className="truncate uppercase">{debt.address}</span>
            <MapPin className="w-3 h-3 shrink-0 text-blue-500" />
          </div>
        )}
        {debt.operator_ids && debt.operator_ids.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {debt.operator_ids.map((opId) => {
              const op = operators.find((o) => o.id === opId)
              return (
                <span
                  key={opId}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase"
                  style={{ backgroundColor: op?.color || '#64748b' }}
                >
                  {op?.first_name || op?.name?.substring(0, 4) || 'OP'}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-between h-full min-h-[60px] gap-2">
        {!isAttended ? (
          <div className="text-[13px] font-bold text-slate-800">
            R$ {debt.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <div className="flex items-center text-[11px] text-slate-500 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {debt.termo_date ? format(parseISO(debt.termo_date), 'dd/MM às HH:mm') : '-'}
          </div>
        )}

        <div className="flex items-center gap-1 mt-auto">
          {profile &&
            profile.role !== 'consultas' &&
            !debt.is_legal &&
            !debt.is_cut &&
            !debt.is_recut &&
            !debt.is_ferrule && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTransferAction({ debt, queue: 'legal' })
                  }}
                  className="text-slate-300 hover:text-orange-500 transition-colors p-1"
                  title="Transferir para Fila Jurídico"
                >
                  <Scale className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTransferAction({ debt, queue: 'cut' })
                  }}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  title="Transferir para Fila Corte"
                >
                  <Scissors className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTransferAction({ debt, queue: 'recut' })
                  }}
                  className="text-slate-300 hover:text-purple-500 transition-colors p-1"
                  title="Transferir para Fila Re-Corte"
                >
                  <Split className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTransferAction({ debt, queue: 'ferrule' })
                  }}
                  className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                  title="Transferir para Fila Ferrule"
                >
                  <Wrench className="w-4 h-4" />
                </button>
              </>
            )}
          <button
            onClick={() => handleAnexar(debt)}
            className="text-slate-300 hover:text-primary transition-colors p-1"
            title="Anexar Termos"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )

  const renderDebtorsQueue = () => (
    <div className="flex flex-col bg-white">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-bold text-base text-slate-800">Registros Gerais</h2>
            <p className="text-[11px] text-slate-500">Todos os registros filtrados</p>
            <div className="text-[13px] font-bold text-destructive mt-1.5 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4 text-destructive/80" />
              Soma de Negoc. Vencidas: R${' '}
              {debtorsTotalVencidoNeg.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <Select
            value={debtorsPageSize}
            onValueChange={(v) => {
              setDebtorsPageSize(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Select
            value={debtorsSortBy}
            onValueChange={(v) => {
              setDebtorsSortBy(v)
              setDebtorsPage(1)
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negoc_vencidas">Negoc. Vencidas</SelectItem>
              <SelectItem value="valor_total">Valor Total da Dívida</SelectItem>
              <SelectItem value="uc">UC</SelectItem>
              <SelectItem value="nome">Nome do Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
        <span>evedor / UC / CÓD.PESSOA</span>
        <span className="w-32 text-right pr-6">DÍVIDA TOTAL</span>
      </div>

      <div>
        {debtorsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : debtors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum devedor encontrado.</div>
        ) : (
          debtors.map((d) => renderDebtCard(d, false))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(debtorsPage, setDebtorsPage, debtorsCount, debtorsPageSize)}
      </div>
    </div>
  )

  const renderAttendedQueue = () => (
    <div className="flex flex-col bg-white">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-bold text-base text-blue-600">
              Negociações confirmadas e Termos Anexados
            </h2>
            <p className="text-[11px] text-slate-500">Registros com confissão de dívida</p>
            <div className="text-[13px] font-bold text-destructive mt-1.5 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4 text-destructive/80" />
              Soma de Negoc. Vencidas: R${' '}
              {contactsTotalVencidoNeg.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <Select
            value={contactsPageSize}
            onValueChange={(v) => {
              setContactsPageSize(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end">
          <Select
            value={contactsSortBy}
            onValueChange={(v) => {
              setContactsSortBy(v)
              setContactsPage(1)
            }}
          >
            <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="negoc_vencidas">Negoc. Vencidas</SelectItem>
              <SelectItem value="valor_total">Valor Total da Dívida</SelectItem>
              <SelectItem value="uc">UC</SelectItem>
              <SelectItem value="nome">Nome do Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
        <span>Devedor / UC</span>
        <span className="w-32 text-right pr-6">Data do Termo</span>
      </div>

      <div>
        {contactsLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum termo anexado.</div>
        ) : (
          contacts.map((c) => renderDebtCard(c, true))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(contactsPage, setContactsPage, contactsCount, contactsPageSize)}
      </div>
    </div>
  )

  const renderRegularizedQueue = () => (
    <div className="flex flex-col bg-white">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-bold text-base text-emerald-600">Casos Sequenciados</h2>
            <p className="text-[11px] text-slate-500">
              Registros com termos anexados que não estão mais na base de pendências ativas
            </p>
          </div>
          <Select
            value={regularizedPageSize}
            onValueChange={(v) => {
              setRegularizedPageSize(v)
              setRegularizedPage(1)
            }}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50 text-[10px] font-bold text-slate-500 uppercase">
        <span>Devedor / UC</span>
        <span className="w-32 text-right pr-6">Status / Data</span>
      </div>

      <div>
        {regularizedLoading ? (
          <div className="text-center py-8 text-slate-500 text-sm">Carregando...</div>
        ) : regularized.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum registro regularizado encontrado.
          </div>
        ) : (
          regularized.map((r) => (
            <div
              key={r.id}
              className="p-4 border-b bg-white hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-[13px] font-bold text-slate-800 truncate uppercase">
                  {r.snapshot_nome_cliente || 'SEM NOME'}
                </h3>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1">
                  <span>UC: {r.uc}</span>
                  {r.cod_pess_fat && <span>• {r.cod_pess_fat}</span>}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end justify-between h-full min-h-[60px] gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  {r.status?.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center text-[10px] text-slate-500 mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {r.created_at ? format(parseISO(r.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                </div>
                {r.images && (
                  <button
                    onClick={() => handleViewRegularized(r)}
                    className="text-slate-300 hover:text-primary transition-colors p-1 mt-auto"
                    title="Ver Anexos"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t bg-white shrink-0">
        {renderPagination(
          regularizedPage,
          setRegularizedPage,
          regularizedCount,
          regularizedPageSize,
        )}
      </div>
    </div>
  )

  return (
    <ErrorBoundary>
      <div className="animate-fade-in-up flex flex-col space-y-4 pb-10">
        <div className="shrink-0 mb-2 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
              Checar Negociações
            </h1>
            <p className="text-sm text-slate-500">
              Localize rapidamente os devedores, gerencie as negociações e acompanhe os termos de
              confissão anexados.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full xl:w-auto">
            <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 xl:justify-end flex-wrap items-center">
              <ToggleGroup
                type="multiple"
                value={selectedQueues}
                onValueChange={(v) => {
                  setSelectedQueues(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
                className="bg-white border rounded-md h-9 px-1 gap-1"
              >
                <ToggleGroupItem
                  value="sem_fase"
                  aria-label="Sem Fila"
                  title="Sem Fila"
                  className="h-7 w-7 p-0 data-[state=on]:bg-slate-200"
                >
                  <UserMinus className="h-4 w-4 text-slate-500" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="estrategica"
                  aria-label="Estratégica"
                  title="Fila Estratégias"
                  className="h-7 w-7 p-0 data-[state=on]:bg-indigo-200"
                >
                  <Target className="h-4 w-4 text-indigo-600" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="juridico"
                  aria-label="Jurídico"
                  title="Fila Jurídico"
                  className="h-7 w-7 p-0 data-[state=on]:bg-orange-200"
                >
                  <Scale className="h-4 w-4 text-orange-600" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="corte"
                  aria-label="Corte"
                  title="Fila Corte"
                  className="h-7 w-7 p-0 data-[state=on]:bg-red-200"
                >
                  <Scissors className="h-4 w-4 text-red-600" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="recorte"
                  aria-label="Re-Corte"
                  title="Fila Re-Corte"
                  className="h-7 w-7 p-0 data-[state=on]:bg-purple-200"
                >
                  <Split className="h-4 w-4 text-purple-600" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="ferrule"
                  aria-label="Ferrule"
                  title="Fila Ferrule"
                  className="h-7 w-7 p-0 data-[state=on]:bg-blue-200"
                >
                  <Wrench className="h-4 w-4 text-blue-600" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Select
                value={filterConnection}
                onValueChange={(v) => {
                  setFilterConnection(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ligacao">Só com Ligação</SelectItem>
                  <SelectItem value="lotes">Só Lotes Vagos</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contem_retidas">Contém Retidas</SelectItem>
                  <SelectItem value="nao_contem_retidas">Não Contém Retidas</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterDue}
                onValueChange={(v) => {
                  setFilterDue(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vencidos">Vencidos</SelectItem>
                  <SelectItem value="a_vencer">A Vencer</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterHasNegociacao}
                onValueChange={(v) => {
                  setFilterHasNegociacao(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Possui Negociação</SelectItem>
                  <SelectItem value="todos">Todos os Registros</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterNegociacoesVencidas}
                onValueChange={(v) => {
                  setFilterNegociacoesVencidas(v)
                  setDebtorsPage(1)
                  setContactsPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[190px] h-9 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Negoc. Vencidas: Sim</SelectItem>
                  <SelectItem value="ambos">Negoc. Vencidas: Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:flex md:flex-row gap-2 xl:justify-end">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filtre UC, nome ou Cpf/Cnpj"
                  value={globalSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setGlobalSearch(val)
                    if (val && /^\d+$/.test(val.trim())) {
                      setDebtorsSortBy('uc')
                      setContactsSortBy('uc')
                    }
                    setDebtorsPage(1)
                    setContactsPage(1)
                  }}
                  className="pl-9 h-9 bg-white"
                />
              </div>
              <div className="relative w-full md:w-[250px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por endereço"
                  value={globalAddress}
                  onChange={(e) => {
                    setGlobalAddress(e.target.value)
                    setDebtorsPage(1)
                    setContactsPage(1)
                  }}
                  className="pl-9 h-9 bg-white"
                />
              </div>
              <div className="relative w-full md:w-[200px]">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por telefone"
                  value={globalPhone}
                  onChange={(e) => {
                    setGlobalPhone(e.target.value)
                    setDebtorsPage(1)
                    setContactsPage(1)
                  }}
                  className="pl-9 h-9 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="-mx-4 sm:mx-0">
          <div className="flex flex-col gap-6 px-4 sm:px-0 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
                {renderDebtorsQueue()}
              </div>
              <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
                {renderAttendedQueue()}
              </div>
            </div>

            <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
              {renderRegularizedQueue()}
            </div>
          </div>
        </div>

        <AlertDialog
          open={!!transferAction}
          onOpenChange={(open) => !open && !isTransferring && setTransferAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Transferir para Fila{' '}
                {transferAction?.queue === 'legal'
                  ? 'Jurídico'
                  : transferAction?.queue === 'cut'
                    ? 'Corte'
                    : transferAction?.queue === 'recut'
                      ? 'Re-Corte'
                      : 'Ferrule'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Deseja realmente transferir este registro para a Fila{' '}
                {transferAction?.queue === 'legal'
                  ? 'Jurídico'
                  : transferAction?.queue === 'cut'
                    ? 'Corte'
                    : transferAction?.queue === 'recut'
                      ? 'Re-Corte'
                      : 'Ferrule'}
                ?
                <br />
                <br />
                <span className="block text-slate-700">
                  <strong>UC:</strong> {transferAction?.debt?.uc}
                </span>
                <span className="block text-slate-700 mt-1">
                  <strong>Cliente:</strong> {transferAction?.debt?.name || 'SEM NOME'}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isTransferring}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleTransferToQueue()
                }}
                disabled={isTransferring}
              >
                {isTransferring ? 'Transferindo...' : 'Transferir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet
          open={isAttachSheetOpen}
          onOpenChange={(open) => {
            if (!open && !isUploading) {
              setIsAttachSheetOpen(false)
              setSelectedDebt(null)
              setAttachedFiles([])
            }
          }}
        >
          <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white">
            <SheetHeader>
              <SheetTitle>Anexar Termos</SheetTitle>
              <SheetDescription>
                Adicione os termos de confissão de dívida para a UC {selectedDebt?.uc}.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <UnifiedUploadArea
                value={attachedFiles}
                onChange={setAttachedFiles}
                onRemoveFile={confirmFileDelete}
              />
            </div>
            <SheetFooter className="shrink-0 mt-auto pt-4 border-t flex flex-col sm:flex-row justify-between gap-3">
              {selectedDebt?.has_termo ? (
                <Button
                  variant="destructive"
                  onClick={() => setIsUndoDialogOpen(true)}
                  disabled={isUploading}
                  className="w-full sm:w-auto"
                >
                  Desfazer Confirmação
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAttachSheetOpen(false)}
                  disabled={isUploading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveAttachments}
                  disabled={isUploading || attachedFiles.length === 0}
                  className="w-full sm:w-auto px-6"
                >
                  {isUploading ? 'Salvando...' : 'Confirmar Negociação e Anexar'}
                </Button>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* File Delete Alert - Outside SheetContent to prevent Radix UI pointer-event locks */}
        <AlertDialog
          open={!!fileDeleteAction}
          onOpenChange={(open) => {
            if (!open && fileDeleteAction) {
              fileDeleteAction.resolve(false)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir anexo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o anexo{' '}
                <strong>{fileDeleteAction?.file.name}</strong>?
                <br />
                Esta ação será consolidada apenas ao salvar a negociação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={(e) => {
                  e.preventDefault()
                  fileDeleteAction?.resolve(false)
                }}
              >
                Não
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  fileDeleteAction?.resolve(true)
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sim, Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sheet
          open={isViewOnlySheetOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsViewOnlySheetOpen(false)
              setViewOnlyFiles([])
              setViewOnlyUc(null)
            }
          }}
        >
          <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white">
            <SheetHeader>
              <SheetTitle>Anexos Regularizados</SheetTitle>
              <SheetDescription>Visualização de arquivos da UC {viewOnlyUc}.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {viewOnlyFiles.length === 0 ? (
                <div className="text-center text-sm text-slate-500 mt-10">
                  Nenhum arquivo encontrado.
                </div>
              ) : (
                viewOnlyFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span
                        className="text-sm font-medium text-slate-800 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                      {file.caption && (
                        <span className="text-xs text-slate-500 truncate" title={file.caption}>
                          {file.caption}
                        </span>
                      )}
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm font-bold shrink-0"
                    >
                      Abrir
                    </a>
                  </div>
                ))
              )}
            </div>
            <SheetFooter className="shrink-0 mt-auto pt-4 border-t">
              <Button onClick={() => setIsViewOnlySheetOpen(false)} className="w-full">
                Fechar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Undo Termo Alert - Outside SheetContent to prevent Radix UI pointer-event locks */}
        <AlertDialog open={isUndoDialogOpen} onOpenChange={setIsUndoDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desfazer confirmação de Negociação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá o termo da lista de "Termos Anexados" e desfará a confirmação. Se
                a dívida ainda existir na base ativa, o registro retornará aos "Registros Gerais".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUploading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleUndoTermo()
                }}
                disabled={isUploading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isUploading ? 'Desfazendo...' : 'Sim, Desfazer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  )
}
