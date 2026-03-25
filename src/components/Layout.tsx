import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { CompleteProfileDialog } from './CompleteProfileDialog'

export default function Layout() {
  return (
    <>
      <CompleteProfileDialog />

      {/* Brand Accent Top Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary to-[#ff8c00] fixed top-0 left-0 z-50"></div>

      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-screen bg-slate-50 pt-1">
          {/* Mobile Header - Only visible on small screens */}
          <div className="md:hidden flex items-center justify-between p-3 border-b bg-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
                R
              </div>
              <span className="font-bold text-[15px] text-slate-800 tracking-tight">
                Ric Recupera
              </span>
            </div>
            <SidebarTrigger className="h-9 w-9 text-slate-500" />
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </>
  )
}
