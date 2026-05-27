import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'

export type CriticalRoute = {
  id: string
  route: string
  cycle: string
  expectedUcs: number
  readUcs: number
  percentage: number
  remainingDays: number
  criticality: string
}

type SortConfig = {
  key: keyof CriticalRoute | null
  direction: 'asc' | 'desc'
}

const SortableHeader = ({
  column,
  title,
  currentSort,
  onSort,
  align = 'left',
}: {
  column: keyof CriticalRoute
  title: string
  currentSort: SortConfig
  onSort: (col: keyof CriticalRoute) => void
  align?: 'left' | 'right'
}) => (
  <Button
    variant="ghost"
    onClick={() => onSort(column)}
    className={`-ml-4 h-8 data-[state=open]:bg-accent hover:bg-slate-100 flex items-center gap-1 text-slate-600 font-semibold ${align === 'right' ? 'w-full justify-end pr-0' : ''}`}
  >
    {title}
    {currentSort.key === column ? (
      currentSort.direction === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : (
        <ArrowDown className="h-4 w-4" />
      )
    ) : (
      <ArrowUpDown className="h-4 w-4 opacity-50" />
    )}
  </Button>
)

const getCriticalityBadge = (criticality: string) => {
  switch (criticality) {
    case 'Não Iniciada':
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
          Não Iniciada
        </Badge>
      )
    case 'Atrasada':
      return (
        <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600">
          Atrasada
        </Badge>
      )
    case 'Prazo Curto':
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-400 text-yellow-950 hover:bg-yellow-500 border-yellow-500"
        >
          Prazo Curto
        </Badge>
      )
    case 'Em Andamento':
      return (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
          Em Andamento
        </Badge>
      )
    case 'Concluída':
      return (
        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
          Concluída
        </Badge>
      )
    default:
      return <Badge>{criticality}</Badge>
  }
}

export function CriticalRoutesTable({ data = [] }: { data?: CriticalRoute[] }) {
  const ITEMS_PER_PAGE = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })

  const sortedData = useMemo(() => {
    let sortableItems = [...data]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) return sortConfig.direction === 'asc' ? -1 : 1
        if (a[sortConfig.key!] > b[sortConfig.key!]) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [data, sortConfig])

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleSort = (key: keyof CriticalRoute) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">Nenhuma rota encontrada</p>
        <p className="text-xs">Os dados importados aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead>
                <SortableHeader
                  column="route"
                  title="Rota"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="cycle"
                  title="Ciclo"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="expectedUcs"
                  title="UCS Esperadas"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="right"
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="readUcs"
                  title="UCS Lidas"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="right"
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="percentage"
                  title="Percentual"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="text-right">
                <SortableHeader
                  column="remainingDays"
                  title="Dias Restantes"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align="right"
                />
              </TableHead>
              <TableHead>
                <SortableHeader
                  column="criticality"
                  title="Criticidade"
                  currentSort={sortConfig}
                  onSort={handleSort}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-slate-700">{row.route}</TableCell>
                <TableCell className="text-slate-600">{row.cycle}</TableCell>
                <TableCell className="text-right text-slate-600">{row.expectedUcs}</TableCell>
                <TableCell className="text-right text-slate-600">{row.readUcs}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-9 text-xs font-medium text-slate-600 text-right">
                      {row.percentage}%
                    </span>
                    <Progress
                      value={row.percentage}
                      className="h-2.5 w-[80px]"
                      indicatorColor={row.percentage === 100 ? '#10B981' : undefined}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className={row.remainingDays < 0 ? 'text-red-600' : 'text-slate-700'}>
                    {row.remainingDays}
                  </span>
                </TableCell>
                <TableCell>{getCriticalityBadge(row.criticality)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between px-2 gap-4">
        <div className="text-sm text-slate-500">
          Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} até{' '}
          {Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} de {sortedData.length}{' '}
          registros
        </div>
        <Pagination className="w-auto mx-0">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i} className="hidden sm:inline-flex">
                <PaginationLink
                  onClick={() => setCurrentPage(i + 1)}
                  isActive={currentPage === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={
                  currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
