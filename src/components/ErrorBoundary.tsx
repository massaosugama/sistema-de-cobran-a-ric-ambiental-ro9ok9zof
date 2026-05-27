import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px] p-8 text-center bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Oops! Algo deu errado.</h2>
          <p className="text-slate-600 max-w-md mb-6 text-sm">
            Ocorreu um erro inesperado ao renderizar esta tela. Isso pode ser causado pelo recurso
            de tradução automática do navegador ou por alguma extensão.
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </Button>
          {this.state.error && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg w-full max-w-2xl text-left overflow-auto border border-slate-100">
              <p className="text-xs font-mono text-slate-500 break-all">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
