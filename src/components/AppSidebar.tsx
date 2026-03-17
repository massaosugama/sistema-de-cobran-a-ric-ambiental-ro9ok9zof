import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListTodo, BarChart3, Settings, Waves, Trophy } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CURRENT_USER } from '@/lib/mock'

const NAV_ITEMS = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Fila de Atendimento', url: '/queue', icon: ListTodo },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
  { title: 'Configurações', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="bg-primary/10 p-1.5 rounded-xl text-primary flex items-center justify-center">
            <Waves className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none mt-0.5">
            <span className="font-black text-[22px] text-primary tracking-tight">RIC</span>
            <span className="text-[0.6rem] font-bold text-primary/80 uppercase tracking-[0.2em] ml-0.5">
              Ambiental
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2 mt-4">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold rounded-lg"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-100 p-3 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <Trophy className="h-4 w-4 text-[#ff8c00]" />
            </div>
            <span className="text-orange-900">Pontos Hoje</span>
          </div>
          <span className="font-bold text-[#ff8c00] text-lg">{CURRENT_USER.points}</span>
        </div>

        <div className="flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={CURRENT_USER.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">AC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-foreground truncate">{CURRENT_USER.name}</span>
            <span className="text-xs font-medium text-muted-foreground truncate">
              {CURRENT_USER.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
