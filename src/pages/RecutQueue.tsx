import { Split } from 'lucide-react'
import { QueueBoard } from '@/components/QueueBoard'

export default function RecutQueue() {
  return (
    <QueueBoard
      title="Fila Re-Corte"
      description="Gestão de casos identificados para re-corte de fornecimento."
      icon={Split}
      queueType="recut"
      allowUnassign={true}
      columns={[
        {
          id: 'para_abrir_os',
          title: '1 - Para abrir OS',
          nextStatus: 'os_recorte_aberta',
          prevStatus: null,
        },
        {
          id: 'os_recorte_aberta',
          title: '2 - OS Re-Corte aberta',
          nextStatus: 'completed',
          prevStatus: 'para_abrir_os',
        },
        {
          id: 'completed',
          title: '3 - Finalizado',
          nextStatus: null,
          prevStatus: 'os_recorte_aberta',
        },
      ]}
    />
  )
}
