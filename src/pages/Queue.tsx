import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Clock, MapPin, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDebts, ParsedDebt } from '@/services/debts'
import { useDebounce } from '@/hooks/use-debounce'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const safeText = (text: any): string => (typeof text === 'string' ? text : '')
const safeSlice = (text: any, start: number, end?: number): string =>
  typeof text === 'string' ? text.slice(start, end) : ''

export default function Queue() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const [debtStatus, setDebtStatus] = useState<'vencido' | 'a_vencer' | 'ambos'>('vencido')
  const [hideLotes, setHideLotes] = useState(true)
  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

  const [unattended, setUnattended] = useState<ParsedDebt[]>([])
  const [attended, setAttended] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = useCallback(() => {
    if (!user?.id) return
    setLoading(true)
    setUnattended([])
    setAttended([])
    getDebts(debouncedSearch, user.id, debouncedSearchAddress, debtStatus, hideLotes)
      .then((data) => {
        setUnattended(data.unattended)
        setAttended(data.attended)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [debouncedSearch, debouncedSearchAddress, debtStatus, hideLotes, user?.id])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  useEffect(() => {
    window.addEventListener('contact-added', fetchQueue)
    return () => window.removeEventListener('contact-added', fetchQueue)
  }, [fetchQueue])

  const getDisplayedValue = (customer: ParsedDebt) => {
    if (debtStatus === 'vencido') return customer.valorVencido
    if (debtStatus === 'a_vencer') return customer.valorAVencer
    return customer.totalDebt
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Fila Rápida</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Gerencie seus contatos pendentes e acompanhe suas negociações em andamento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 mr-2 bg-white px-3 py-2 rounded-full border border-slate-200 shadow-sm">
            <Switch id="hide-lotes" checked={hideLotes} onCheckedChange={setHideLotes} />
            <Label
              htmlFor="hide-lotes"
              className="text-xs font-semibold text-slate-600 whitespace-nowrap cursor-pointer"
            >
              Ocultar Lotes Vagos
            </Label>
          </div>
          <Select value={debtStatus} onValueChange={(v: any) => setDebtStatus(v)}>
            <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-full bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="a_vencer">A Vencer</SelectItem>
              <SelectItem value="ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtre UC, Nome ou Cpf/Cnpj"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
            />
          </div>
          <div className="relative w-full sm:w-[220px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtre Endereço"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Coluna Esquerda: Fila de Devedores */}
        <Card className="border-slate-200 shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          <CardHeader className="pb-3 border-b bg-slate-50/50 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Fila de Devedores
                </CardTitle>
                <CardDescription>Novas oportunidades de negociação</CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-white shadow-sm border-slate-200 text-slate-600"
              >
                {unattended.length} pendentes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden [&>div]:h-full [&>div]:overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50/90 sticky top-0 z-10 outline outline-1 outline-slate-100 shadow-sm backdrop-blur-sm">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-600">Devedor / UC</TableHead>
                    <TableHead className="font-semibold text-slate-600 w-[180px]">
                      {debtStatus === 'vencido'
                        ? 'Valor Vencido'
                        : debtStatus === 'a_vencer'
                          ? 'Valor A Vencer'
                          : 'Valor Total'}
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-slate-500 font-medium"
                      >
                        Buscando devedores...
                      </TableCell>
                    </TableRow>
                  ) : unattended.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-slate-500 font-medium"
                      >
                        Nenhum devedor novo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unattended.map((customer) => (
                      <TableRow
                        key={`${customer.uc}_${customer.personCode}`}
                        className={cn(
                          'border-slate-100 group transition-colors',
                          customer.isLoteVago
                            ? 'bg-amber-50/40 hover:bg-amber-100/50'
                            : 'hover:bg-primary/5',
                        )}
                      >
                        <TableCell>
                          <div className="flex flex-col max-w-[180px] sm:max-w-[250px]">
                            <span
                              className={cn(
                                'font-bold truncate',
                                customer.isLoteVago ? 'text-amber-950' : 'text-slate-900',
                              )}
                              title={safeText(customer.name)}
                            >
                              {safeText(customer.name)}
                            </span>
                            <span
                              className="text-xs font-medium text-slate-500 truncate flex items-center gap-1 flex-wrap"
                              title={`${customer.uc} • ${safeText(customer.document)}`}
                            >
                              UC: {customer.uc} • {safeText(customer.document)}
                              {customer.isLoteVago && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] px-1.5 py-0 leading-none uppercase shrink-0"
                                >
                                  Lote Vago
                                </Badge>
                              )}
                            </span>
                            {customer.address && (
                              <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                <span
                                  className="text-xs font-medium text-slate-400 truncate max-w-[150px] sm:max-w-[200px]"
                                  title={safeText(customer.address)}
                                >
                                  {safeText(customer.address)}
                                </span>
                                <a
                                  href={`https://www.google.com.br/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center text-[10px] text-primary hover:text-primary/80 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors shrink-0"
                                  title="Ver no Mapa"
                                >
                                  <MapPin className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 whitespace-nowrap">
                                R${' '}
                                {getDisplayedValue(customer).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              {(customer.valorVencido > 0 || customer.valorAVencer > 0) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-slate-400 hover:text-primary cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="p-2 bg-white border border-slate-200 shadow-lg rounded-lg text-xs">
                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Vencido:</span>
                                        <span className="font-bold text-rose-600">
                                          R${' '}
                                          {(customer.valorVencido || 0).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">A Vencer:</span>
                                        <span className="font-bold text-emerald-600">
                                          R${' '}
                                          {(customer.valorAVencer || 0).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            {customer.recentOperators && customer.recentOperators.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {customer.recentOperators.map((op, idx) => (
                                  <Badge
                                    key={idx}
                                    className={cn(
                                      'w-fit text-[9px] px-1.5 py-0 uppercase tracking-wider shadow-none hover:opacity-80 transition-opacity',
                                      idx === 0
                                        ? 'bg-slate-600 text-white'
                                        : idx === 1
                                          ? 'bg-slate-400 text-white'
                                          : 'bg-slate-300 text-slate-700',
                                    )}
                                    title={`Atendido por: ${op}`}
                                  >
                                    {safeSlice(op, 0, 4)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-slate-400 group-hover:text-primary group-hover:bg-primary/10 rounded-full transition-all"
                          >
                            <Link to={`/customer/${customer.id}`} title="Atender Devedor">
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Coluna Direita: Fila de Atendimento */}
        <Card className="border-slate-200 shadow-sm flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          <CardHeader className="pb-3 border-b bg-primary/5 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-primary">
                  Fila de Atendimento
                </CardTitle>
                <CardDescription className="text-primary/70">
                  Meus contatos em andamento
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-white shadow-sm border-primary/20 text-primary"
              >
                {attended.length} em carteira
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden [&>div]:h-full [&>div]:overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50/90 sticky top-0 z-10 outline outline-1 outline-slate-100 shadow-sm backdrop-blur-sm">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-600">Devedor / UC</TableHead>
                    <TableHead className="font-semibold text-slate-600 w-[140px]">
                      Último Contato
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-600 w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-slate-500 font-medium"
                      >
                        Buscando atendimentos...
                      </TableCell>
                    </TableRow>
                  ) : attended.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-10 text-slate-500 font-medium"
                      >
                        Você ainda não iniciou nenhum atendimento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attended.map((customer) => (
                      <TableRow
                        key={`${customer.uc}_${customer.personCode}`}
                        className={cn(
                          'border-slate-100 group transition-colors',
                          customer.isLoteVago
                            ? 'bg-amber-50/40 hover:bg-amber-100/50'
                            : 'hover:bg-primary/5',
                        )}
                      >
                        <TableCell>
                          <div className="flex flex-col max-w-[180px] sm:max-w-[250px]">
                            <span
                              className={cn(
                                'font-bold truncate',
                                customer.isLoteVago ? 'text-amber-950' : 'text-slate-900',
                              )}
                              title={safeText(customer.name)}
                            >
                              {safeText(customer.name)}
                            </span>
                            <span
                              className="text-xs font-medium text-slate-500 truncate flex items-center gap-1 flex-wrap"
                              title={`UC: ${customer.uc}`}
                            >
                              UC: {customer.uc}
                              {customer.isLoteVago && (
                                <Badge
                                  variant="outline"
                                  className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] px-1.5 py-0 leading-none uppercase shrink-0"
                                >
                                  Lote Vago
                                </Badge>
                              )}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-xs font-semibold text-slate-700">
                                R${' '}
                                {getDisplayedValue(customer).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              {(customer.valorVencido > 0 || customer.valorAVencer > 0) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-slate-400 hover:text-primary cursor-help shrink-0" />
                                  </TooltipTrigger>
                                  <TooltipContent className="p-2 bg-white border border-slate-200 shadow-lg rounded-lg text-xs">
                                    <div className="space-y-1">
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Vencido:</span>
                                        <span className="font-bold text-rose-600">
                                          R${' '}
                                          {(customer.valorVencido || 0).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">A Vencer:</span>
                                        <span className="font-bold text-emerald-600">
                                          R${' '}
                                          {(customer.valorAVencer || 0).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            {customer.address && (
                              <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                <span
                                  className="text-xs font-medium text-slate-400 truncate max-w-[150px] sm:max-w-[200px]"
                                  title={safeText(customer.address)}
                                >
                                  {safeText(customer.address)}
                                </span>
                                <a
                                  href={`https://www.google.com.br/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center text-[10px] text-primary hover:text-primary/80 hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors shrink-0"
                                  title="Ver no Mapa"
                                >
                                  <MapPin className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {customer.recentOperators && customer.recentOperators.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                {customer.recentOperators.map((op, idx) => (
                                  <Badge
                                    key={idx}
                                    className={cn(
                                      'w-fit text-[9px] px-1.5 py-0 uppercase tracking-wider shadow-none hover:opacity-80 transition-opacity',
                                      idx === 0
                                        ? 'bg-slate-600 text-white'
                                        : idx === 1
                                          ? 'bg-slate-400 text-white'
                                          : 'bg-slate-300 text-slate-700',
                                    )}
                                    title={`Atendido por: ${op}`}
                                  >
                                    {safeSlice(op, 0, 4)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600 whitespace-nowrap">
                            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs font-medium">
                              {customer.lastContactDate
                                ? format(new Date(customer.lastContactDate), "dd/MM 'às' HH:mm", {
                                    locale: ptBR,
                                  })
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-slate-400 group-hover:text-primary group-hover:bg-primary/10 rounded-full transition-all"
                          >
                            <Link to={`/customer/${customer.id}`} title="Continuar Atendimento">
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
