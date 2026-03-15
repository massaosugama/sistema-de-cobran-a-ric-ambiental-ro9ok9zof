import { Bell, Search, PlusCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'

const RECENT_UCS = ['1098234', '1098235', '1098200']

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4 shadow-subtle shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger />
        <div className="hidden md:flex items-center gap-2 px-4 border-l border-r">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Recentes:
          </span>
          {RECENT_UCS.map((uc) => (
            <Link key={uc} to={`/customer/1`}>
              <Badge
                variant="secondary"
                className="hover:bg-primary hover:text-white cursor-pointer transition-colors"
              >
                {uc}
              </Badge>
            </Link>
          ))}
        </div>
        <div className="relative w-full max-w-md ml-auto md:ml-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar UC, CPF/CNPJ ou Nome..."
            className="w-full bg-accent pl-9 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <PlusCircle className="h-4 w-4" />
          Novo Contato Avulso
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-destructive border border-background"></span>
        </Button>
      </div>
    </header>
  )
}
