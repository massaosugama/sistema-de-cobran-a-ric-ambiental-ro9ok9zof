import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  PhoneCall,
  Database,
  CalendarDays,
  Menu,
  User,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import logoImg from '@/assets/ricambiental_logo-01-500-porcento-fbb5f.png'
import { SidebarQuote } from './SidebarQuote'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fila Rápida', href: '/queue', icon: PhoneCall },
  { name: 'Follow-up', href: '/follow-up', icon: CalendarDays },
  { name: 'Baixas', href: '/settlements', icon: CreditCard },
  { name: 'Reversões', href: '/reversions', icon: TrendingUp },
  { name: 'Devedores', href: '/debtors', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Importação', href: '/import', icon: Database },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const { state, toggleSidebar } = useSidebar()
  const { user, signOut } = useAuth()

  const isCustomerScreen = location.pathname.startsWith('/customer/')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-col border-b py-3 px-2 relative transition-all duration-200">
        {state === 'expanded' ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-slate-900 hidden md:flex"
              onClick={toggleSidebar}
              title="Ocultar Menu Lateral"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center gap-2 mt-5 px-2 mb-2">
              <img src={logoImg} alt="RIC Ambiental" className="w-full h-11 object-contain" />
              <h1 className="text-[13px] font-black tracking-tight text-slate-800 text-center leading-tight">
                Ric Recupera &<br />
                Desenvolve
              </h1>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity mt-1 mb-1"
            onClick={toggleSidebar}
            title="Expandir Menu Lateral"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold">
              R
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.name}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Knowledge Base Area */}
        {!isCustomerScreen && state === 'expanded' && (
          <div className="mt-auto">
            <SidebarQuote />
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 shrink-0">
                    <User className="h-4 w-4 text-slate-600" />
                  </div>
                  {state === 'expanded' && (
                    <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                      <span className="truncate font-semibold">Minha Conta</span>
                      <span className="truncate text-xs text-slate-500">
                        {user?.email || 'Usuário'}
                      </span>
                    </div>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side={state === 'collapsed' ? 'right' : 'top'}
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Conectado como</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair do Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        {state === 'expanded' && (
          <div className="mt-3 mb-1 flex justify-center">
            <span className="text-[10px] text-slate-400 font-medium tracking-wider select-none">
              v0.0.106
            </span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
