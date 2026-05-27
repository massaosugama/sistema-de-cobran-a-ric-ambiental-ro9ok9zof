import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { SerasaDevedoresANegativarTable } from './SerasaDevedoresANegativarTable'
import { SerasaWorkflowTable } from './SerasaWorkflowTable'

interface Props {
  refreshTrigger: number
  onDataChanged: () => void
}

export function SerasaWorkflow({ refreshTrigger, onDataChanged }: Props) {
  const [selectedRefs, setSelectedRefs] = useState<string[] | null>(() => {
    const saved = localStorage.getItem('serasa_selected_refs')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  })

  const handleRefsChange = (refs: string[]) => {
    setSelectedRefs(refs)
    localStorage.setItem('serasa_selected_refs', JSON.stringify(refs))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="a_negativar" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="a_negativar">Devedores a Negativar</TabsTrigger>
            <TabsTrigger value="sendo_negativado">Sendo Negativado</TabsTrigger>
            <TabsTrigger value="negativados">Negativados</TabsTrigger>
            <TabsTrigger value="nao_negativar">Não Negativar</TabsTrigger>
          </TabsList>
          <Button
            onClick={onDataChanged}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Tabelas
          </Button>
        </div>

        <TabsContent value="a_negativar" className="mt-0">
          <SerasaDevedoresANegativarTable
            refreshTrigger={refreshTrigger}
            onDataChanged={onDataChanged}
            selectedRefs={selectedRefs}
            onRefsChange={handleRefsChange}
          />
        </TabsContent>

        <TabsContent value="sendo_negativado" className="mt-0">
          <SerasaWorkflowTable
            status="sendo_negativado"
            refreshTrigger={refreshTrigger}
            onDataChanged={onDataChanged}
          />
        </TabsContent>

        <TabsContent value="negativados" className="mt-0">
          <SerasaWorkflowTable
            status="negativado"
            refreshTrigger={refreshTrigger}
            onDataChanged={onDataChanged}
          />
        </TabsContent>

        <TabsContent value="nao_negativar" className="mt-0">
          <SerasaWorkflowTable
            status="nao_negativar"
            refreshTrigger={refreshTrigger}
            onDataChanged={onDataChanged}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
