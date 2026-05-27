import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase/client'
import { History } from 'lucide-react'

export function SerasaHistory({ refreshTrigger }: { refreshTrigger: number }) {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('import_history')
      .select('*')
      .eq('table_name', 'serasa_negativations')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory(data || []))
  }, [refreshTrigger])

  return (
    <Card className="mt-8 shadow-sm border-slate-200">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-700 text-lg">
          <History className="h-5 w-5 text-slate-500" /> Últimas Importações
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Data/Hora</TableHead>
              <TableHead className="text-right">Total Lidos</TableHead>
              <TableHead className="text-right">Inseridos</TableHead>
              <TableHead className="text-right pr-6">Ignorados</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-6">
                  Nenhum histórico encontrado.
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-6">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.total_records}</TableCell>
                  <TableCell className="text-right text-green-600 font-bold">
                    {item.inserted_records}
                  </TableCell>
                  <TableCell className="text-right text-amber-600 pr-6">
                    {item.ignored_records}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
