import { createContext, useContext, useState, ReactNode } from 'react'

interface AppStateContextType {
  isImporting: boolean
  setIsImporting: (val: boolean) => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export const useAppState = () => {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within an AppStateProvider')
  return context
}

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [isImporting, setIsImporting] = useState(false)

  return (
    <AppStateContext.Provider value={{ isImporting, setIsImporting }}>
      {children}
    </AppStateContext.Provider>
  )
}
