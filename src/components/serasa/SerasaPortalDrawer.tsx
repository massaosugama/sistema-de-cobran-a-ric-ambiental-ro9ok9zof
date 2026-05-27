import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

const SERASA_LINK =
  'https://empresas.serasaexperian.com.br/meus-produtos/login?_gl=1*1d4x6ac*_gcl_aw*R0NMLjE3NDgzNTA5NzYuQ2owS0NRand4ZFhCQmhERUFSSXNBQVVrUDZpcmg5alRXSW5xdUllMzYtQkdna2p4ZzF1d2x6MXlTWHFhTmgxWEFFOGtyQ2ZHY3FCeWppTWFBb25TRUFMd193Y0I.*_gcl_au*MTU0MzE2NDEyMy4xNzQ3MDUxMzEy*_ga*MTIwMTI0MTc0NS4xNzQ3MDUxMzEy*_ga_L4BG2T2NER*czE3NDgzNTEwNzQkbzIkZzAkdDE3NDgzNTEwNzQkajYwJGwwJGgwJGRSZ1VGSGxlbUxfa1h6SFIzUjllYV9PWkFpazJKbnFqZUpB'

interface Props {
  isOpen: boolean
  onOpenChange: (val: boolean) => void
}

export function SerasaPortalDrawer({ isOpen, onOpenChange }: Props) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[95vw] sm:max-w-[90vw] p-0 flex flex-col z-[200]">
        <SheetHeader className="p-4 border-b bg-white">
          <SheetTitle>Portal Serasa</SheetTitle>
          <SheetDescription>Realize a baixa ou exclusão diretamente no portal.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 w-full bg-slate-50 relative">
          <iframe src={SERASA_LINK} className="w-full h-full border-0" title="Portal Serasa" />
          <div className="absolute bottom-4 right-4 z-10">
            <Button onClick={() => window.open(SERASA_LINK, '_blank')} className="shadow-lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir em nova guia
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
