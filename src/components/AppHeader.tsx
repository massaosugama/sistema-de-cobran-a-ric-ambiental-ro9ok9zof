import { Bell, Search, PlusCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'

const RECENT_UCS = ['1098234', '1098235', '1098200']

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <SidebarTrigger className="text-primary hover:bg-primary/10 hover:text-primary" />

        <div className="hidden md:flex items-center gap-2.5 px-4 border-l border-border h-8">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Recentes:
          </span>
          <div className="flex gap-2">
            {RECENT_UCS.map((uc) => (
              <Link key={uc} to={`/customer/1`}>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600 hover:bg-primary hover:text-white cursor-pointer transition-colors font-medium border border-slate-200"
                >
                  {uc}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative w-full max-w-md ml-auto md:ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar UC, CPF/CNPJ ou Nome..."
            className="w-full bg-slate-100/50 pl-9 border-slate-200 focus-visible:ring-primary/30 rounded-full h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary font-semibold"
        >
          <PlusCircle className="h-4 w-4" />
          Contato Avulso
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-primary hover:bg-primary/5"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#ff8c00] border-2 border-background"></span>
        </Button>
      </div>
    </header>
  )
}
