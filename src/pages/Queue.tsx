import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ArrowRight, Clock, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getDebts, ParsedDebt } from '@/services/debts'
import { useDebounce } from '@/hooks/use-debounce'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const safeText = (text: any): string => (typeof text === 'string' ? text : '')
const safeSlice = (text: any, start: number, end?: number): string =>
  typeof text === 'string' ? text.slice(start, end) : ''

export default function Queue() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [searchAddress, setSearchAddress] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const debouncedSearchAddress = useDebounce(searchAddress, 500)

  const [unattended, setUnattended] = useState<ParsedDebt[]>([])
  const [attended, setAttended] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    getDebts(debouncedSearch, user.id, debouncedSearchAddress)
      .then((data) => {
        setUnattended(data.unattended)
        setAttended(data.attended)
        setLoading(false)
      })
      .catch(console.error)
  }, [debouncedSearch, debouncedSearchAddress, user?.id])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive'
      case 'media':
        return 'warning'
      default:
        return 'secondary'
    }
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
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtre UC, Nome ou Cpf/Cnpj"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-white border-slate-200 shadow-sm h-10 w-full focus-visible:ring-primary/20"
            />
          </div>
          <div className="relative w-full sm:w-[240px]">
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
                    <TableHead className="font-semibold text-slate-600 w-[120px]">
                      Valor Total
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
                        className="hover:bg-primary/5 border-slate-100 group transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col max-w-[180px] sm:max-w-[250px]">
                            <span
                              className="font-bold text-slate-900 truncate"
                              title={safeText(customer.name)}
                            >
                              {safeText(customer.name)}
                            </span>
                            <span
                              className="text-xs font-medium text-slate-500 truncate"
                              title={`${customer.uc} • ${safeText(customer.document)}`}
                            >
                              UC: {customer.uc} • {safeText(customer.document)}
                            </span>
                            {customer.address && (
                              <span
                                className="text-xs font-medium text-slate-400 truncate mt-0.5"
                                title={safeText(customer.address)}
                              >
                                {safeText(customer.address)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start">
                            <span className="font-bold text-slate-900 whitespace-nowrap">
                              R${' '}
                              {customer.totalDebt.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge
                                variant={getPriorityColor(customer.priority) as any}
                                className="w-fit text-[10px] px-1.5 py-0 uppercase tracking-wider shadow-none"
                              >
                                {customer.priority}
                              </Badge>
                              {customer.lastOperatorName && (
                                <Badge
                                  className="w-fit text-[10px] px-1.5 py-0 uppercase tracking-wider shadow-none bg-slate-600 text-white hover:bg-slate-700"
                                  title={`Último atendimento por: ${safeText(customer.lastOperatorName)}`}
                                >
                                  {safeSlice(customer.lastOperatorName, 0, 4)}
                                </Badge>
                              )}
                            </div>
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
                        className="hover:bg-primary/5 border-slate-100 group transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col max-w-[180px] sm:max-w-[250px]">
                            <span
                              className="font-bold text-slate-900 truncate"
                              title={safeText(customer.name)}
                            >
                              {safeText(customer.name)}
                            </span>
                            <span
                              className="text-xs font-medium text-slate-500 truncate"
                              title={`UC: ${customer.uc} • R$ ${customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            >
                              UC: {customer.uc} • R${' '}
                              {customer.totalDebt.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {customer.address && (
                              <span
                                className="text-xs font-medium text-slate-400 truncate mt-0.5"
                                title={safeText(customer.address)}
                              >
                                {safeText(customer.address)}
                              </span>
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
