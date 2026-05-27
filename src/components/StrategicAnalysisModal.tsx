import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
} from '@/components/ui/sheet'
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Scale,
  CheckCircle2,
  Printer,
  Save,
  AlertCircle,
  Building2,
  Phone,
  Zap,
  Download,
  Undo2,
  ClipboardList,
  Mail,
  CreditCard,
  FileSignature,
  Paperclip,
} from 'lucide-react'
import { SendEmailModal } from '@/components/SendEmailModal'
import { UnifiedUploadArea, type UploadedFile } from '@/components/UnifiedUploadArea'
import { printStrategicReport } from '@/utils/print-strategic-report'
import { useAuth } from '@/hooks/use-auth'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface StrategicAnalysisModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: any
  onSaved: () => void
  queueType: string
}

const AnalysisSection = ({
  title,
  icon: Icon,
  iconColor,
  textValue,
  onTextChange,
  textPlaceholder,
  imagesValue,
  onImagesChange,
  extraContent,
  disabled,
  historicalFiles = [],
}: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
      <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
    </h3>

    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        1. Anotações Livres
      </div>
      <div className="flex flex-col md:flex-row gap-3 items-start">
        <Textarea
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={textPlaceholder}
          className="min-h-[100px] bg-slate-50 flex-1"
          disabled={disabled}
        />
        {extraContent}
      </div>
    </div>

    <div className="space-y-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          2. Área de Upload (Arraste ou Ctrl+V) &amp; 3. Galeria de Anexos
        </div>
      </div>

      {historicalFiles && historicalFiles.length > 0 && (
        <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <FileSignature className="w-3.5 h-3.5" />
            Documentos Históricos de Negociação
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {historicalFiles.map((file: any, i: number) => (
              <a
                key={i}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-md hover:border-primary/50 hover:bg-primary/5 transition-colors group relative h-24"
                title={file.name}
              >
                <Paperclip className="w-6 h-6 text-slate-400 group-hover:text-primary mb-2 transition-colors" />
                <span className="text-[10px] font-medium text-slate-600 w-full text-center truncate px-1">
                  {file.name || 'Documento'}
                </span>
                {file.caption && (
                  <span className="text-[9px] text-slate-400 w-full text-center truncate px-1 mt-0.5">
                    {file.caption}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      <UnifiedUploadArea value={imagesValue} onChange={onImagesChange} />
    </div>
  </div>
)

export function StrategicAnalysisModal({
  open,
  onOpenChange,
  assignment,
  onSaved,
  queueType,
}: StrategicAnalysisModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.role || '')
        })
    }
  }, [user?.id])

  const isConsultas = userRole?.toLowerCase() === 'consultas'
  const [parecer, setParecer] = useState('')
  const [parecerConsumo, setParecerConsumo] = useState('')
  const [parecerImovel, setParecerImovel] = useState('')
  const [parecerInLoco, setParecerInLoco] = useState('')
  const [parecerPerfilPagador, setParecerPerfilPagador] = useState('')
  const [parecerNegociacoes, setParecerNegociacoes] = useState('')
  const [telefonesLocalizados, setTelefonesLocalizados] = useState('')

  const [imagesGeral, setImagesGeral] = useState<UploadedFile[]>([])
  const [imagesImovel, setImagesImovel] = useState<UploadedFile[]>([])
  const [imagesConsumo, setImagesConsumo] = useState<UploadedFile[]>([])
  const [imagesInLoco, setImagesInLoco] = useState<UploadedFile[]>([])
  const [imagesPerfilPagador, setImagesPerfilPagador] = useState<UploadedFile[]>([])
  const [imagesNegociacoes, setImagesNegociacoes] = useState<UploadedFile[]>([])
  const [imagesTelefones, setImagesTelefones] = useState<UploadedFile[]>([])
  const [address, setAddress] = useState('Buscando endereço...')
  const [historicalTermsFiles, setHistoricalTermsFiles] = useState<UploadedFile[]>([])

  const [initialState, setInitialState] = useState<any>(null)
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const [showPrintChoice, setShowPrintChoice] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showUndoAlert, setShowUndoAlert] = useState(false)
  const [printImagesLayout, setPrintImagesLayout] = useState<'1' | '2'>('2')

  useEffect(() => {
    if (assignment && open) {
      setParecer(assignment.parecer || '')
      const fetchAddress = async () => {
        try {
          const { data } = await supabase
            .from('pending_debts')
            .select('endereco')
            .eq('uc', assignment.uc)
            .eq('cod_pess_fat', assignment.cod_pess_fat)
            .limit(1)
            .single()
          if (data?.endereco) setAddress(data.endereco)
          else setAddress('Endereço não disponível')
        } catch (e) {
          setAddress('Endereço não disponível')
        }
      }

      const fetchTerms = async () => {
        try {
          const { data } = await supabase
            .from('contact_history')
            .select('notes')
            .eq('uc', assignment.uc)
            .eq('cod_pess_fat', assignment.cod_pess_fat)
            .eq('status', 'TERMO_ANEXADO')
            .eq('is_active', true)
            .order('created_at', { ascending: false })

          if (data && data.length > 0) {
            let files: UploadedFile[] = []
            data.forEach((item: any) => {
              if (item.notes) {
                try {
                  const parsed = JSON.parse(item.notes)
                  if (parsed.files && Array.isArray(parsed.files)) {
                    files = [...files, ...parsed.files]
                  }
                } catch {
                  /* intentionally ignored */
                }
              }
            })
            setHistoricalTermsFiles(files)
          } else {
            setHistoricalTermsFiles([])
          }
        } catch (e) {
          setHistoricalTermsFiles([])
        }
      }

      fetchAddress()
      fetchTerms()

      setParecerConsumo(assignment.parecer_consumo || '')
      setParecerImovel(assignment.parecer_imovel || '')
      setParecerInLoco(assignment.parecer_inloco || '')
      setParecerPerfilPagador(assignment.parecer_perfil_pagador || '')
      setParecerNegociacoes(assignment.parecer_negociacoes || '')
      setTelefonesLocalizados(assignment.telefones_localizados || '')
      try {
        const parsed =
          typeof assignment.images === 'string' ? JSON.parse(assignment.images) : assignment.images
        const allImages = Array.isArray(parsed) ? parsed : []

        const initialGeral = allImages.filter((img: any) => !img.section || img.section === 'geral')
        const initialImovel = allImages.filter((img: any) => img.section === 'imovel')
        const initialConsumo = allImages.filter((img: any) => img.section === 'consumo')
        const initialInLoco = allImages.filter((img: any) => img.section === 'inloco')
        const initialPerfilPagador = allImages.filter(
          (img: any) => img.section === 'perfil_pagador',
        )
        const initialNegociacoes = allImages.filter(
          (img: any) => img.section === 'negociacoes' || img.section === 'termos',
        )
        const initialTelefones = allImages.filter(
          (img: any) => img.section === 'telefones' || img.section === 'telefone',
        )

        setImagesGeral(initialGeral)
        setImagesImovel(initialImovel)
        setImagesConsumo(initialConsumo)
        setImagesInLoco(initialInLoco)
        setImagesPerfilPagador(initialPerfilPagador)
        setImagesNegociacoes(initialNegociacoes)
        setImagesTelefones(initialTelefones)

        setInitialState({
          parecer: assignment.parecer || '',
          parecerConsumo: assignment.parecer_consumo || '',
          parecerImovel: assignment.parecer_imovel || '',
          parecerInLoco: assignment.parecer_inloco || '',
          parecerPerfilPagador: assignment.parecer_perfil_pagador || '',
          parecerNegociacoes: assignment.parecer_negociacoes || '',
          telefonesLocalizados: assignment.telefones_localizados || '',
          imagesGeral: initialGeral,
          imagesImovel: initialImovel,
          imagesConsumo: initialConsumo,
          imagesInLoco: initialInLoco,
          imagesPerfilPagador: initialPerfilPagador,
          imagesNegociacoes: initialNegociacoes,
          imagesTelefones: initialTelefones,
        })
      } catch {
        setImagesGeral([])
        setImagesImovel([])
        setImagesConsumo([])
        setImagesInLoco([])
        setImagesPerfilPagador([])
        setImagesNegociacoes([])
        setImagesTelefones([])
        setInitialState({
          parecer: assignment.parecer || '',
          parecerConsumo: assignment.parecer_consumo || '',
          parecerImovel: assignment.parecer_imovel || '',
          parecerInLoco: assignment.parecer_inloco || '',
          parecerPerfilPagador: assignment.parecer_perfil_pagador || '',
          parecerNegociacoes: assignment.parecer_negociacoes || '',
          telefonesLocalizados: assignment.telefones_localizados || '',
          imagesGeral: [],
          imagesImovel: [],
          imagesConsumo: [],
          imagesInLoco: [],
          imagesPerfilPagador: [],
          imagesNegociacoes: [],
          imagesTelefones: [],
        })
      }
    } else if (!open) {
      setImagesGeral([])
      setImagesImovel([])
      setImagesConsumo([])
      setImagesInLoco([])
      setImagesPerfilPagador([])
      setImagesNegociacoes([])
      setImagesTelefones([])
      setHistoricalTermsFiles([])
      setInitialState(null)
      setShowUnsavedAlert(false)
    }
  }, [assignment, open])

  const hasChanges = useMemo(() => {
    if (!initialState) return false

    const serializeFiles = (files: UploadedFile[]) =>
      JSON.stringify(files.map((f) => ({ url: f.url, name: f.name, caption: f.caption })))

    return (
      parecer !== initialState.parecer ||
      parecerConsumo !== initialState.parecerConsumo ||
      parecerImovel !== initialState.parecerImovel ||
      parecerInLoco !== initialState.parecerInLoco ||
      parecerPerfilPagador !== initialState.parecerPerfilPagador ||
      parecerNegociacoes !== initialState.parecerNegociacoes ||
      telefonesLocalizados !== initialState.telefonesLocalizados ||
      serializeFiles(imagesGeral) !== serializeFiles(initialState.imagesGeral) ||
      serializeFiles(imagesImovel) !== serializeFiles(initialState.imagesImovel) ||
      serializeFiles(imagesConsumo) !== serializeFiles(initialState.imagesConsumo) ||
      serializeFiles(imagesInLoco) !== serializeFiles(initialState.imagesInLoco) ||
      serializeFiles(imagesPerfilPagador) !== serializeFiles(initialState.imagesPerfilPagador) ||
      serializeFiles(imagesNegociacoes) !== serializeFiles(initialState.imagesNegociacoes) ||
      serializeFiles(imagesTelefones) !== serializeFiles(initialState.imagesTelefones)
    )
  }, [
    parecer,
    parecerConsumo,
    parecerImovel,
    parecerInLoco,
    parecerPerfilPagador,
    parecerNegociacoes,
    telefonesLocalizados,
    imagesGeral,
    imagesImovel,
    imagesConsumo,
    imagesInLoco,
    imagesPerfilPagador,
    imagesNegociacoes,
    imagesTelefones,
    initialState,
  ])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleOpenChange = (newOpen: boolean) => {
    if (loading) return
    if (!newOpen && hasChanges && !isConsultas) {
      setShowUnsavedAlert(true)
      return
    }
    onOpenChange(newOpen)
  }

  const handlePrintClick = () => {
    if (!assignment) return
    if (assignment.operator_id && assignment.operator_id !== user?.id && assignment.operator) {
      setShowPrintChoice(true)
    } else {
      const defaultName =
        [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
          .filter(Boolean)
          .join(' ') ||
        user?.user_metadata?.name ||
        user?.email?.split('@')[0] ||
        'Operador'
      executePrint(defaultName)
    }
  }

  const executePrint = (printedName: string) => {
    const printData = {
      ...assignment,
      endereco: address,
      parecer,
      parecer_consumo: parecerConsumo,
      parecer_imovel: parecerImovel,
      parecer_inloco: parecerInLoco,
      parecer_perfil_pagador: parecerPerfilPagador,
      parecer_negociacoes: parecerNegociacoes,
      telefones_localizados: telefonesLocalizados,
    }

    const combinedImages = [
      ...imagesGeral.map((img) => ({ ...img, section: 'geral' })),
      ...imagesImovel.map((img) => ({ ...img, section: 'imovel' })),
      ...imagesConsumo.map((img) => ({ ...img, section: 'consumo' })),
      ...imagesPerfilPagador.map((img) => ({ ...img, section: 'perfil_pagador' })),
      ...imagesNegociacoes.map((img) => ({ ...img, section: 'negociacoes' })),
      ...imagesInLoco.map((img) => ({ ...img, section: 'inloco' })),
      ...imagesTelefones.map((img) => ({ ...img, section: 'telefones' })),
    ]

    const getReportTitle = (type: string) => {
      if (type === 'strategic') return 'RELATÓRIO DE ANÁLISE ESTRATÉGICA'
      if (type === 'legal') return 'RELATÓRIO DE ANÁLISE JURÍDICA'
      if (type === 'cut') return 'RELATÓRIO DE ANÁLISE CORTE'
      if (type === 'recut') return 'RELATÓRIO DE ANÁLISE RE-CORTE'
      return 'RELATÓRIO DE ANÁLISE'
    }

    printStrategicReport(
      printData,
      combinedImages,
      printedName,
      getReportTitle(queueType),
      printImagesLayout,
    )
    setShowPrintChoice(false)
  }

  const handleExportCSV = async () => {
    if (!telefonesLocalizados) {
      toast.error('Nenhum telefone para exportar.')
      return
    }

    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s-]*)?\d{4,5}[\s-]*\d{4}/g
    const rawMatches = telefonesLocalizados.match(phoneRegex) || []

    const formattedNumbers = rawMatches
      .map((n) => {
        let cleaned = n.replace(/\D/g, '')
        if (cleaned.startsWith('55') && cleaned.length >= 12) return cleaned
        return `55${cleaned}`
      })
      .filter((n) => n.length >= 12)

    const uniqueNumbers = Array.from(new Set(formattedNumbers))

    if (uniqueNumbers.length === 0) {
      toast.error('Nenhum telefone válido encontrado (min 10 dígitos).')
      return
    }

    let logradouro = address
    const matchNro = address.match(/^(.*?)(?:Nº|N°|nº|n°|Nro|nro)/i)
    if (matchNro && matchNro[1]) {
      logradouro = matchNro[1].trim()
    } else {
      const matchN = address.match(/^(.*?)(?:N\s+\d+)/i)
      if (matchN && matchN[1]) {
        logradouro = matchN[1].trim()
      }
    }

    const nome = assignment.snapshot_nome_cliente || 'NÃO IDENTIFICADO'

    let csv = 'Telefone;UC;Nome;Endereco;Logradouro\n'
    uniqueNumbers.forEach((num) => {
      csv += `${num};${assignment.uc};${nome};${address};${logradouro}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `telefones_${assignment.uc}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Arquivo CSV exportado com sucesso!')
  }

  const handleSave = async (newStatus?: string, shouldClose: boolean = true) => {
    if (!assignment) return
    setLoading(true)

    const combinedImages = [
      ...imagesGeral.map((img) => ({ ...img, section: 'geral' })),
      ...imagesImovel.map((img) => ({ ...img, section: 'imovel' })),
      ...imagesConsumo.map((img) => ({ ...img, section: 'consumo' })),
      ...imagesPerfilPagador.map((img) => ({ ...img, section: 'perfil_pagador' })),
      ...imagesNegociacoes.map((img) => ({ ...img, section: 'negociacoes' })),
      ...imagesInLoco.map((img) => ({ ...img, section: 'inloco' })),
      ...imagesTelefones.map((img) => ({ ...img, section: 'telefones' })),
    ]

    const updates: any = {
      parecer,
      parecer_consumo: parecerConsumo,
      parecer_imovel: parecerImovel,
      parecer_inloco: parecerInLoco,
      parecer_perfil_pagador: parecerPerfilPagador,
      parecer_negociacoes: parecerNegociacoes,
      telefones_localizados: telefonesLocalizados,
      images: combinedImages,
    }
    if (newStatus && newStatus !== assignment.status) {
      updates.status = newStatus
      if (['completed', 'processo_finalizado', 'ferrule_executado'].includes(newStatus)) {
        updates.completed_at = new Date().toISOString()
        updates.pontos = 10
      }
    }

    let error = null
    if (assignment.id) {
      const { error: updateError } = await supabase
        .from('strategic_assignments')
        .update(updates)
        .eq('id', assignment.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('strategic_assignments').insert({
        ...updates,
        uc: assignment.uc,
        cod_pess_fat: assignment.cod_pess_fat,
        snapshot_nome_cliente: assignment.snapshot_nome_cliente,
        snapshot_qt_fats: assignment.snapshot_qt_fats,
        snapshot_valor_vencido: assignment.snapshot_valor_vencido,
        queue_type: assignment.queue_type || 'strategic',
        status: updates.status || 'started',
      })
      error = insertError
    }

    if (error) toast.error('Erro ao salvar análise')
    else {
      toast.success('Análise salva!')
      onSaved()

      setInitialState({
        parecer,
        parecerConsumo,
        parecerImovel,
        parecerInLoco,
        parecerPerfilPagador,
        parecerNegociacoes,
        telefonesLocalizados,
        imagesGeral: [...imagesGeral],
        imagesImovel: [...imagesImovel],
        imagesConsumo: [...imagesConsumo],
        imagesInLoco: [...imagesInLoco],
        imagesPerfilPagador: [...imagesPerfilPagador],
        imagesNegociacoes: [...imagesNegociacoes],
        imagesTelefones: [...imagesTelefones],
      })

      if (shouldClose) {
        onOpenChange(false)
      }
    }
    setLoading(false)
  }

  const handleForward = async () => {
    if (!assignment) return
    setLoading(true)

    const combinedImages = [
      ...imagesGeral.map((img) => ({ ...img, section: 'geral' })),
      ...imagesImovel.map((img) => ({ ...img, section: 'imovel' })),
      ...imagesConsumo.map((img) => ({ ...img, section: 'consumo' })),
      ...imagesPerfilPagador.map((img) => ({ ...img, section: 'perfil_pagador' })),
      ...imagesNegociacoes.map((img) => ({ ...img, section: 'negociacoes' })),
      ...imagesInLoco.map((img) => ({ ...img, section: 'inloco' })),
      ...imagesTelefones.map((img) => ({ ...img, section: 'telefones' })),
    ]

    const updates: any = {
      parecer,
      parecer_consumo: parecerConsumo,
      parecer_imovel: parecerImovel,
      parecer_inloco: parecerInLoco,
      parecer_perfil_pagador: parecerPerfilPagador,
      parecer_negociacoes: parecerNegociacoes,
      telefones_localizados: telefonesLocalizados,
      images: combinedImages,
      queue_type: 'legal',
      status: 'a_encaminhar',
      previous_queue: assignment.queue_type,
      previous_status: assignment.status,
    }

    let error = null
    if (assignment.id) {
      const { error: updateError } = await supabase
        .from('strategic_assignments')
        .update(updates)
        .eq('id', assignment.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('strategic_assignments').insert({
        ...updates,
        uc: assignment.uc,
        cod_pess_fat: assignment.cod_pess_fat,
        snapshot_nome_cliente: assignment.snapshot_nome_cliente,
        snapshot_qt_fats: assignment.snapshot_qt_fats,
        snapshot_valor_vencido: assignment.snapshot_valor_vencido,
      })
      error = insertError
    }

    if (error) toast.error('Erro ao encaminhar para jurídico')
    else {
      toast.success('Caso encaminhado para o Jurídico!')
      onSaved()
      onOpenChange(false)
    }
    setLoading(false)
  }

  const handleUndoCompletion = async () => {
    if (!assignment || !assignment.id) return
    setLoading(true)

    let revertStatus = 'started'
    switch (assignment.queue_type) {
      case 'legal':
        revertStatus = 'encaminhado'
        break
      case 'cut':
        revertStatus = 'os_corte_aberta'
        break
      case 'recut':
        revertStatus = 'os_recorte_aberta'
        break
      case 'ferrule':
        revertStatus = 'os_ferrule_aberta'
        break
      case 'strategic':
        revertStatus = 'started'
        break
    }

    const { error } = await supabase
      .from('strategic_assignments')
      .update({
        status: revertStatus,
        completed_at: null,
      })
      .eq('id', assignment.id)

    if (error) {
      toast.error('Erro ao desfazer conclusão')
    } else {
      toast.success('Conclusão desfeita! Caso retornou para a etapa anterior.')
      onSaved()
      onOpenChange(false)
    }
    setLoading(false)
  }

  const finalStatus = useMemo(() => {
    if (!assignment) return 'completed'
    if (assignment.queue_type === 'legal') return 'processo_finalizado'
    if (assignment.queue_type === 'ferrule') return 'ferrule_executado'
    return 'completed'
  }, [assignment])

  const formatCurrency = (val: number | null) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  if (!assignment) return null

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="sm:max-w-4xl md:max-w-5xl w-full p-0 flex flex-col gap-0 overflow-hidden bg-slate-50 border-l shadow-2xl">
          <SheetHeader className="sr-only">
            <SheetTitle>
              {queueType === 'strategic'
                ? 'Análise Estratégica'
                : queueType === 'legal'
                  ? 'Análise Jurídico'
                  : queueType === 'cut'
                    ? 'Análise Corte'
                    : queueType === 'recut'
                      ? 'Análise Re-Corte'
                      : 'Análise Ferrule'}
            </SheetTitle>
            <SheetDescription>
              {queueType === 'strategic'
                ? 'Análise Estratégica'
                : queueType === 'legal'
                  ? 'Análise Jurídico'
                  : queueType === 'cut'
                    ? 'Análise Corte'
                    : queueType === 'recut'
                      ? 'Análise Re-Corte'
                      : 'Análise Ferrule'}
            </SheetDescription>
          </SheetHeader>

          <div className="bg-slate-100 p-4 pr-12 shrink-0 flex items-center justify-between border-b">
            <h2 className="text-lg font-bold text-slate-800">
              {queueType === 'strategic'
                ? 'Análise Estratégica'
                : queueType === 'legal'
                  ? 'Análise Jurídico'
                  : queueType === 'cut'
                    ? 'Análise Corte'
                    : queueType === 'recut'
                      ? 'Análise Re-Corte'
                      : 'Análise Ferrule'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailModal(true)}
                className="h-8 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 mr-2" /> Enviar E-mail
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintClick}
                className="h-8 bg-white"
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 relative">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="min-w-[100px]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">UC</div>
                    <div className="text-xl font-black text-slate-900">{assignment.uc}</div>
                  </div>
                  <div className="w-[220px] shrink-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Cliente
                    </div>
                    <div className="text-sm font-bold text-slate-900 uppercase leading-snug">
                      {assignment.snapshot_nome_cliente || 'NÃO IDENTIFICADO'}
                    </div>
                  </div>
                  <div className="min-w-[140px]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Valor Vencido
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(assignment.snapshot_valor_vencido)}
                    </div>
                  </div>
                  <div className="min-w-[100px]">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Faturas
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {assignment.snapshot_qt_fats} ref(s)
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Referências
                    </div>
                    <div className="text-sm font-bold text-slate-900 leading-relaxed tracking-wide">
                      {assignment.snapshot_refs || '-'}
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-200 my-5"></div>

                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Endereço
                  </div>
                  <div className="text-sm font-bold text-slate-900 uppercase">{address}</div>
                </div>
              </div>

              <AnalysisSection
                title="Parecer Geral da Análise"
                icon={AlertCircle}
                iconColor="text-primary"
                textValue={parecer}
                onTextChange={setParecer}
                textPlaceholder="Sua conclusão sobre o caso e recomendação de próximos passos..."
                imagesValue={imagesGeral}
                onImagesChange={setImagesGeral}
                disabled={isConsultas}
              />

              <AnalysisSection
                title="Análise do Imóvel"
                icon={Building2}
                iconColor="text-blue-500"
                textValue={parecerImovel}
                onTextChange={setParecerImovel}
                textPlaceholder="Imóvel ocupado? Alugado? Condições físicas..."
                imagesValue={imagesImovel}
                onImagesChange={setImagesImovel}
                disabled={isConsultas}
              />

              <AnalysisSection
                title="Análise do Consumo / Hidrômetro"
                icon={Zap}
                iconColor="text-amber-500"
                textValue={parecerConsumo}
                onTextChange={setParecerConsumo}
                textPlaceholder="Análise de média de consumo, cortes, irregularidades..."
                imagesValue={imagesConsumo}
                onImagesChange={setImagesConsumo}
                disabled={isConsultas}
              />

              <AnalysisSection
                title="Perfil de Pagador"
                icon={CreditCard}
                iconColor="text-indigo-500"
                textValue={parecerPerfilPagador}
                onTextChange={setParecerPerfilPagador}
                textPlaceholder="Análise do histórico de pagamentos, pontualidade, acordos anteriores..."
                imagesValue={imagesPerfilPagador}
                onImagesChange={setImagesPerfilPagador}
                disabled={isConsultas}
              />

              <AnalysisSection
                title="Análise das Negociações"
                icon={FileSignature}
                iconColor="text-purple-500"
                textValue={parecerNegociacoes}
                onTextChange={setParecerNegociacoes}
                textPlaceholder="Anotações sobre negociações, acordos firmados, termos assinados..."
                imagesValue={imagesNegociacoes}
                onImagesChange={setImagesNegociacoes}
                disabled={isConsultas}
                historicalFiles={historicalTermsFiles}
              />

              <AnalysisSection
                title='Análise "In-Loco" - Fiscalização / Engenharia'
                icon={ClipboardList}
                iconColor="text-emerald-500"
                textValue={parecerInLoco}
                onTextChange={setParecerInLoco}
                textPlaceholder="Relato da visita, evidências de fraudes, medições locais..."
                imagesValue={imagesInLoco}
                onImagesChange={setImagesInLoco}
                disabled={isConsultas}
              />

              <AnalysisSection
                title="Telefones Localizados"
                icon={Phone}
                iconColor="text-slate-400"
                textValue={telefonesLocalizados}
                onTextChange={setTelefonesLocalizados}
                textPlaceholder="Ex: (11) 99999-9999, recado com Maria..."
                imagesValue={imagesTelefones}
                onImagesChange={setImagesTelefones}
                disabled={isConsultas}
                extraContent={
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="shrink-0 w-full md:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                }
              />
            </div>
          </div>

          <div className="p-4 bg-white border-t flex justify-end items-center shrink-0 z-10">
            <div className="flex items-center gap-2">
              {!isConsultas &&
                ['completed', 'processo_finalizado', 'ferrule_executado'].includes(
                  assignment.status,
                ) && (
                  <Button
                    variant="outline"
                    onClick={() => setShowUndoAlert(true)}
                    disabled={loading}
                    className="border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                  >
                    <Undo2 className="w-4 h-4 mr-2" /> Desfazer Conclusão
                  </Button>
                )}
              {!isConsultas ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!hasChanges) {
                      handleOpenChange(false)
                    } else {
                      handleSave(assignment.status, false)
                    }
                  }}
                  disabled={loading}
                  className="text-slate-600 w-[120px]"
                >
                  {hasChanges ? (
                    <>
                      <Save className="w-4 h-4 mr-2" /> SALVAR
                    </>
                  ) : (
                    'FECHAR'
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={loading}
                  className="text-slate-600 w-[120px]"
                >
                  FECHAR
                </Button>
              )}
              {!isConsultas &&
                assignment.queue_type === 'strategic' &&
                !['completed', 'processo_finalizado', 'ferrule_executado'].includes(
                  assignment.status,
                ) && (
                  <Button
                    variant="outline"
                    onClick={handleForward}
                    disabled={loading}
                    className="border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Scale className="w-4 h-4 mr-2" /> Encaminhar Jurídico
                  </Button>
                )}
              {!isConsultas &&
                !['completed', 'processo_finalizado', 'ferrule_executado'].includes(
                  assignment.status,
                ) && (
                  <Button
                    onClick={() => handleSave(finalStatus)}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir Análise
                  </Button>
                )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações que não foram salvas. Deseja salvar antes de fechar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onOpenChange(false)}>
              Sair sem salvar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowUnsavedAlert(false)
                handleSave(assignment.status, true)
              }}
            >
              Salvar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUndoAlert} onOpenChange={setShowUndoAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desfazer Conclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desfazer a conclusão desta análise? O caso retornará para a
              etapa anterior e você poderá editá-lo novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setShowUndoAlert(false)
                handleUndoCompletion()
              }}
            >
              Sim, Desfazer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPrintChoice} onOpenChange={setShowPrintChoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atenção!</DialogTitle>
            <DialogDescription>
              Imprimir usando o Operador Atribuído, ou o Operador logado?
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 border-y border-slate-100 my-2">
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
              Layout das Imagens:
            </Label>
            <RadioGroup
              value={printImagesLayout}
              onValueChange={(val) => setPrintImagesLayout(val as '1' | '2')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer">
                  1 por linha (Maior)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer">
                  2 por linha (Padrão)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="default"
              onClick={() => {
                const loggedName =
                  [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  user?.user_metadata?.name ||
                  user?.email?.split('@')[0] ||
                  'Operador'
                executePrint(loggedName)
              }}
            >
              Operador Logado (
              {user?.user_metadata?.first_name ||
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                'Eu'}
              )
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const assignedName =
                  [assignment?.operator?.first_name, assignment?.operator?.last_name]
                    .filter(Boolean)
                    .join(' ') ||
                  assignment?.operator?.name ||
                  'Operador Atribuído'
                executePrint(assignedName)
              }}
            >
              Operador Atribuído (
              {assignment?.operator?.first_name || assignment?.operator?.name || 'N/A'})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* @ts-expect-error - added new props for perfil_pagador */}
      <SendEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        assignment={{
          ...assignment,
          parecer_perfil_pagador: parecerPerfilPagador,
        }}
        address={address}
        parecer={parecer}
        parecerConsumo={parecerConsumo}
        parecerImovel={parecerImovel}
        parecerInLoco={parecerInLoco}
        parecerPerfilPagador={parecerPerfilPagador}
        parecerNegociacoes={parecerNegociacoes}
        telefonesLocalizados={telefonesLocalizados}
        imagesGeral={imagesGeral}
        imagesImovel={imagesImovel}
        imagesConsumo={imagesConsumo}
        imagesInLoco={imagesInLoco}
        imagesPerfilPagador={imagesPerfilPagador}
        imagesNegociacoes={imagesNegociacoes}
        imagesTelefones={imagesTelefones}
        queueType={queueType}
        printedName={
          [user?.user_metadata?.first_name, user?.user_metadata?.last_name]
            .filter(Boolean)
            .join(' ') ||
          user?.user_metadata?.name ||
          user?.email?.split('@')[0] ||
          'Operador'
        }
      />
    </>
  )
}
