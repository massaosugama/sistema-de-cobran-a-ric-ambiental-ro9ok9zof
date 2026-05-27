import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

export function TableToolbar({
  search,
  onSearchChange,
  limit,
  onLimitChange,
  total,
}: {
  search: string
  onSearchChange: (val: string) => void
  limit: number
  onLimitChange: (val: number) => void
  total: number
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b bg-white">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar UC, Nome, CPF/CNPJ..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <span className="text-sm font-medium text-slate-500">Mostrar</span>
        <Select value={limit.toString()} onValueChange={(v) => onLimitChange(Number(v))}>
          <SelectTrigger className="w-[80px] bg-slate-50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm">
          {total} registros
        </div>
      </div>
    </div>
  )
}
