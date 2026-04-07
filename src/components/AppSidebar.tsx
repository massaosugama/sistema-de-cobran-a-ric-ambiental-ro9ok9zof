import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Presentation,
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
  UserCog,
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
  useSidebar,
} from '@/components/ui/sidebar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import logoImg from '@/assets/ricambiental_logo-01-500-porcento-fbb5f.png'
import { SidebarQuote } from './SidebarQuote'

const navigation = [
  { name: 'Visão Geral', href: '/', icon: LayoutDashboard },
  { name: 'Painel Estratégico', href: '/strategic-dashboard', icon: Presentation },
  { name: 'Fila Rápida', href: '/queue', icon: PhoneCall },
  { name: 'Follow-up', href: '/follow-up', icon: CalendarDays },
  { name: 'Atualizar Cadastros', href: '/cadastral-updates', icon: UserCog },
  { name: 'Reversões', href: '/reversions', icon: TrendingUp },
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
            <div className="absolute left-1 top-1 hidden md:flex z-10">
              <HoverCard openDelay={100} closeDelay={150}>
                <HoverCardTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                    title="Minha Conta"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent align="start" side="bottom" sideOffset={8} className="w-56 p-2">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">Conectado como</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div
                    onClick={() => signOut()}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 text-red-600 font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair do Sistema</span>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-slate-400 hover:text-slate-900 hidden md:flex"
              onClick={toggleSidebar}
              title="Ocultar Menu Lateral"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center gap-2 mt-5 px-2 mb-2 relative">
              <img src={logoImg} alt="RIC Ambiental" className="w-full h-11 object-contain" />
              <h1 className="text-[13px] font-black tracking-tight text-slate-800 text-center leading-tight">
                Ric Recupera &<br />
                Desenvolve
              </h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider select-none -mt-1">
                v0.0.106
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 mt-1 mb-1">
            <HoverCard openDelay={100} closeDelay={150}>
              <HoverCardTrigger asChild>
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Minha Conta"
                >
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent align="start" side="right" sideOffset={8} className="w-56 p-2">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">Conectado como</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                <div
                  onClick={() => signOut()}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 text-red-600 font-medium"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair do Sistema</span>
                </div>
              </HoverCardContent>
            </HoverCard>

            <div
              className="flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={toggleSidebar}
              title="Expandir Menu Lateral"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold">
                =&gt;
              </div>
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
          <div className="mt-auto mb-4">
            <SidebarQuote />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
