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
import ImportData from './pages/ImportData'
import CadastralUpdates from './pages/CadastralUpdates'
import Reversions from './pages/Reversions'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Login from './pages/Login'

const App = () => (
  <AppStateProvider>
    <AuthProvider>
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
                <Route path="/import" element={<ImportData />} />
                <Route path="/reversions" element={<Reversions />} />
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
