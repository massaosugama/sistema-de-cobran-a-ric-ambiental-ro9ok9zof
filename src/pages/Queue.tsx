import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export default function Queue() {
  const [filter, setFilter] = useState('todas')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [debts, setDebts] = useState<ParsedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDebts(debouncedSearch)
      .then((data) => {
        setDebts(data)
        setLoading(false)
      })
      .catch(console.error)
  }, [debouncedSearch])

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-600 font-medium border-slate-200"
          >
            Pendente
          </Badge>
        )
      case 'promessa':
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm">
            Promessa
          </Badge>
        )
      case 'em_andamento':
        return (
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 font-medium"
          >
            Em Andamento
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Fila de Atendimento</h1>
          <p className="text-slate-500 mt-1 font-medium">
            Gerencie seus contatos pendentes e priorize a recuperação.
          </p>
        </div>
        <Button className="font-bold shadow-md shadow-primary/20">Atribuir Novos</Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Tabs defaultValue="todas" className="w-full md:w-auto" onValueChange={setFilter}>
              <TabsList className="bg-slate-100 p-1 rounded-full">
                <TabsTrigger
                  value="todas"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Minha Fila
                </TabsTrigger>
                <TabsTrigger
                  value="atrasados"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Atrasados (Hoje)
                </TabsTrigger>
                <TabsTrigger
                  value="prioridade"
                  className="rounded-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                >
                  Alta Prioridade
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar na fila..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-full bg-slate-50 border-slate-200 h-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-slate-200 text-slate-500"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="w-[100px] font-semibold text-slate-600">UC</TableHead>
                <TableHead className="font-semibold text-slate-600">Devedor</TableHead>
                <TableHead className="font-semibold text-slate-600">Dias Atraso</TableHead>
                <TableHead className="font-semibold text-slate-600">Valor Total</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                    Buscando devedores...
                  </TableCell>
                </TableRow>
              ) : debts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500 font-medium">
                    Nenhum devedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                debts.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="hover:bg-primary/5 border-slate-100 group transition-colors"
                  >
                    <TableCell className="font-medium text-slate-700">{customer.uc}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{customer.name}</span>
                        <span className="text-xs font-medium text-slate-500">
                          CPF/CNPJ: {customer.document}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{customer.overdueDays}</span>
                        <Badge
                          variant={getPriorityColor(customer.priority) as any}
                          className="text-[10px] px-2 py-0 uppercase font-bold tracking-wider"
                        >
                          {customer.priority}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      R$ {customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusLabel(customer.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="opacity-0 group-hover:opacity-100 transition-all text-primary font-bold hover:bg-primary/10 hover:text-primary rounded-full px-4"
                      >
                        <Link to={`/customer/${customer.id}`}>
                          Atender <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
