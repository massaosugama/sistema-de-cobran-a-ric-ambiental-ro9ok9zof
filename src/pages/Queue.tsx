import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, MoreHorizontal, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MOCK_CUSTOMERS } from '@/lib/mock'

export default function Queue() {
  const [filter, setFilter] = useState('todas')

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
        return <Badge variant="secondary">Pendente</Badge>
      case 'promessa':
        return (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            Promessa
          </Badge>
        )
      case 'em_andamento':
        return (
          <Badge variant="outline" className="border-primary text-primary">
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
          <h1 className="text-3xl font-bold tracking-tight text-primary">Fila de Atendimento</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus contatos pendentes e priorize a recuperação.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">Atribuir Novos</Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Tabs defaultValue="todas" className="w-full md:w-auto" onValueChange={setFilter}>
              <TabsList>
                <TabsTrigger value="todas">Minha Fila</TabsTrigger>
                <TabsTrigger value="atrasados">Atrasados (Hoje)</TabsTrigger>
                <TabsTrigger value="prioridade">Alta Prioridade</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar na fila..." className="pl-9" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">UC</TableHead>
                <TableHead>Devedor</TableHead>
                <TableHead>Dias Atraso</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próx. Ação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_CUSTOMERS.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50 group transition-colors">
                  <TableCell className="font-medium">{customer.uc}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-primary">{customer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        CPF/CNPJ: {customer.document}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {customer.overdueDays}
                      <Badge
                        variant={getPriorityColor(customer.priority) as any}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {customer.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {customer.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusLabel(customer.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.nextAction || 'Não agendado'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                    >
                      <Link to={`/customer/${customer.id}`}>
                        Abrir <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
