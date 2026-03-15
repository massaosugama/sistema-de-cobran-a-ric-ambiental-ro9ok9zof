import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListTodo, BarChart3, Settings, ShieldAlert, Trophy } from 'lucide-react'
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
  { title: 'Relatórios & Produtividade', url: '/reports', icon: BarChart3 },
  { title: 'Configurações', url: '/settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <ShieldAlert className="h-6 w-6 text-emerald-500" />
          <span>Ric Ambiental</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={CURRENT_USER.avatar} />
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{CURRENT_USER.name}</span>
            <span className="text-xs text-muted-foreground truncate">{CURRENT_USER.role}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-md bg-accent p-2 text-xs font-medium text-accent-foreground">
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-warning" />
            <span>Pontos Hoje</span>
          </div>
          <span className="font-bold text-primary">{CURRENT_USER.points}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
