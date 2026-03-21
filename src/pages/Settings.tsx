import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1 font-medium">Parâmetros e preferências do sistema.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-slate-700" />
            Opções do Sistema
          </CardTitle>
          <CardDescription>Página em construção.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            As configurações de equipe, regras de negócio e integrações ficarão disponíveis aqui em
            breve.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
