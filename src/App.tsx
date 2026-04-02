import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from './hooks/use-auth'
import { AppStateProvider } from './hooks/use-app-state'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Index from './pages/Index'
import Queue from './pages/Queue'
import FollowUp from './pages/FollowUp'
import CustomerPage from './pages/customer/CustomerPage'
import Reports from './pages/Reports'
import ImportData from './pages/ImportData'
import CadastralUpdates from './pages/CadastralUpdates'
import Settlements from './pages/Settlements'
import Reversions from './pages/Reversions'
import Debtors from './pages/Debtors'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import { useEffect } from 'react'

function LayoutFixer() {
  useEffect(() => {
    let timeoutId: number | undefined
    const fixLayout = () => {
      const labels = document.querySelectorAll('label')
      labels.forEach((label) => {
        const text = label.textContent?.trim() || ''
        if (text === 'Agendar Próxima Ação' || text === 'Observações') {
          let el = label.parentElement
          while (el && el !== document.body) {
            if (
              el.classList.contains('grid') &&
              (el.classList.contains('grid-cols-2') || el.classList.contains('md:grid-cols-2'))
            ) {
              el.classList.remove(
                'grid-cols-2',
                'md:grid-cols-2',
                'sm:grid-cols-2',
                'lg:grid-cols-2',
              )
              el.classList.add('grid-cols-1')
              break
            }
            if (el.classList.contains('flex') && el.classList.contains('flex-row')) {
              el.classList.remove('flex-row')
              el.classList.add('flex-col')
              break
            }
            el = el.parentElement
          }

          if (text === 'Observações') {
            const textarea = label.parentElement?.querySelector('textarea')
            if (textarea) {
              textarea.classList.remove('min-h-[80px]', 'h-20')
              textarea.style.minHeight = '160px'
            }
          }
        }
      })
    }

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length > 0)) {
        window.clearTimeout(timeoutId)
        timeoutId = window.setTimeout(fixLayout, 50)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    fixLayout()

    return () => {
      observer.disconnect()
      window.clearTimeout(timeoutId)
    }
  }, [])
  return null
}

const App = () => (
  <AppStateProvider>
    <AuthProvider>
      <LayoutFixer />
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/follow-up" element={<FollowUp />} />
                <Route path="/cadastral-updates" element={<CadastralUpdates />} />
                <Route path="/customer/:id" element={<CustomerPage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/import" element={<ImportData />} />
                <Route path="/settlements" element={<Settlements />} />
                <Route path="/reversions" element={<Reversions />} />
                <Route path="/debtors" element={<Debtors />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </AppStateProvider>
)

export default App
