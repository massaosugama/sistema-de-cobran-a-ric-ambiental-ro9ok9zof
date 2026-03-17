import { Outlet } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export default function Layout() {
  return (
    <>
      {/* Brand Accent Top Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary to-[#ff8c00] fixed top-0 left-0 z-50"></div>

      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-screen bg-slate-50 pt-1">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </>
  )
}
