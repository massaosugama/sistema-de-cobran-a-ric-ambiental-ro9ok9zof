import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface Props {
  item: any
  isOpen: boolean
  onOpenChange: (val: boolean) => void
  onBaixarAqui: (id: string) => void
  onBaixarSerasa: () => void
  onExcluir: (id: string) => void
}

export function SerasaActionDialog({
  item,
  isOpen,
  onOpenChange,
  onBaixarAqui,
  onBaixarSerasa,
  onExcluir,
}: Props) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  if (!item) return null

  const handleExcluir = () => {
    onExcluir(item.id)
    setConfirmDeleteOpen(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ações do Registro</DialogTitle>
            <DialogDescription>Selecione a ação desejada para o registro.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-medium">CPF/CNPJ:</span>
              <span className="text-slate-800">{item.cpf_cnpj}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500 font-medium">Nome:</span>
              <span className="text-slate-800 text-right">{item.nome}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-500 font-medium">Valor:</span>
              <span className="text-slate-800">
                R$ {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <DialogFooter className="flex w-full flex-col sm:flex-row items-center gap-2 justify-end sm:justify-end mt-4">
            <Button
              variant="destructive"
              onClick={() => setConfirmDeleteOpen(true)}
              className="w-full sm:w-auto mr-auto sm:mr-auto"
            >
              Excluir registro
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                onBaixarAqui(item.id)
                onOpenChange(false)
              }}
            >
              Baixar Aqui
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={onBaixarSerasa}>
              Baixar Serasa
            </Button>
            <DialogClose asChild>
              <Button variant="secondary" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="z-[250]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o registro do CPF/CNPJ{' '}
              <span className="font-semibold text-slate-800">{item.cpf_cnpj}</span> da tabela de
              importação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-red-600 hover:bg-red-700">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
