import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  PhoneCall,
  Database,
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
import logoImg from '@/assets/ricambiental_logo-01-500-porcento-fbb5f.png'
import { SidebarQuote } from './SidebarQuote'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fila Rápida', href: '/queue', icon: PhoneCall },
  { name: 'Baixas', href: '/settlements', icon: CreditCard },
  { name: 'Devedores', href: '/debtors', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Importação', href: '/import', icon: Database },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()

  const isCustomerScreen = location.pathname.startsWith('/customer/')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center h-16 px-4 border-b">
        {state === 'expanded' ? (
          <img src={logoImg} alt="RIC Ambiental" className="w-full h-10 object-contain" />
        ) : (
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold">
            R
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
    </Sidebar>
  )
}
