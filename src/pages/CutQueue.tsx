import { Scissors } from 'lucide-react'
import { QueueBoard } from '@/components/QueueBoard'

export default function CutQueue() {
  return (
    <QueueBoard
      title="Fila Corte"
      description="Gestão de casos identificados para corte de fornecimento."
      icon={Scissors}
      queueType="cut"
      allowUnassign={true}
      columns={[
        {
          id: 'para_abrir_os',
          title: '1 - Para abrir OS',
          nextStatus: 'os_corte_aberta',
          prevStatus: null,
        },
        {
          id: 'os_corte_aberta',
          title: '2 - OS Corte aberta',
          nextStatus: 'completed',
          prevStatus: 'para_abrir_os',
        },
        {
          id: 'completed',
          title: '3 - Finalizado',
          nextStatus: null,
          prevStatus: 'os_corte_aberta',
        },
      ]}
    />
  )
}
