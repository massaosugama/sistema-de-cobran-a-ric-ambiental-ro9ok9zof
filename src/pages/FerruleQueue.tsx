import { QueueBoard } from '@/components/QueueBoard'
import { Wrench } from 'lucide-react'

export default function FerruleQueue() {
  const columns = [
    {
      id: 'para_abrir_os',
      title: 'Para Abrir OS',
      prevStatus: 'unassign',
      nextStatus: 'os_ferrule_aberta',
    },
    {
      id: 'os_ferrule_aberta',
      title: 'OS Aberta',
      prevStatus: 'para_abrir_os',
      nextStatus: 'ferrule_executado',
    },
    {
      id: 'ferrule_executado',
      title: 'Executado',
      prevStatus: 'os_ferrule_aberta',
      nextStatus: null,
      matchStatuses: ['ferrule_executado', 'completed'],
    },
  ]

  return (
    <div className="animate-fade-in-up">
      <QueueBoard
        title="Fila Ferrule"
        description="Gestão de ordens de corte direto na rede (Ferrule)"
        icon={Wrench}
        queueType="ferrule"
        columns={columns}
        allowUnassign={true}
      />
    </div>
  )
}
