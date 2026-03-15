export type Status = 'pendente' | 'em_andamento' | 'promessa' | 'pago' | 'recusado' | 'outro'

export interface Customer {
  id: string
  uc: string
  personCode: string
  name: string
  document: string
  address: string
  overdueDays: number
  totalDebt: number
  status: Status
  lastContact?: string
  nextAction?: string
  priority: 'alta' | 'media' | 'baixa'
  phones: { number: string; isValid: boolean }[]
  invoices: { ref: string; value: number; days: number }[]
  redundancyAlert?: { operator: string; daysAgo: number }
}

export const CURRENT_USER = {
  name: 'Ana Costa',
  role: 'Operadora de Cobrança N2',
  points: 1245,
  avatar: 'https://img.usecurling.com/ppl/thumbnail?gender=female&seed=12',
}

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    uc: '1098234',
    personCode: 'P-9921',
    name: 'Carlos Almeida Silva',
    document: '123.456.789-00',
    address: 'Rua das Flores, 123, Bairro Centro',
    overdueDays: 45,
    totalDebt: 1250.5,
    status: 'pendente',
    nextAction: '2023-11-10',
    priority: 'alta',
    phones: [
      { number: '(11) 98888-1111', isValid: true },
      { number: '(11) 3333-2222', isValid: false },
    ],
    invoices: [
      { ref: '08/2023', value: 450.5, days: 45 },
      { ref: '09/2023', value: 400.0, days: 15 },
    ],
    redundancyAlert: { operator: 'Marcos P.', daysAgo: 5 },
  },
  {
    id: '2',
    uc: '1098235',
    personCode: 'P-9922',
    name: 'Empresa Alpha Ltda',
    document: '00.111.222/0001-33',
    address: 'Av. Industrial, 5000, Galpão 2',
    overdueDays: 120,
    totalDebt: 8500.0,
    status: 'em_andamento',
    lastContact: '2023-10-25',
    nextAction: '2023-11-05',
    priority: 'alta',
    phones: [{ number: '(11) 4000-5000', isValid: true }],
    invoices: [{ ref: '05/2023', value: 8500.0, days: 120 }],
  },
  {
    id: '3',
    uc: '1098236',
    personCode: 'P-9923',
    name: 'Beatriz Santos',
    document: '987.654.321-11',
    address: 'Condomínio Bela Vista, Bloco B',
    overdueDays: 15,
    totalDebt: 120.0,
    status: 'promessa',
    lastContact: '2023-11-01',
    nextAction: '2023-11-06',
    priority: 'baixa',
    phones: [{ number: '(11) 97777-6666', isValid: true }],
    invoices: [{ ref: '10/2023', value: 120.0, days: 15 }],
  },
]

export const MOCK_INTERACTIONS = [
  {
    id: '1',
    date: '2023-11-01T10:30:00',
    type: 'Telefone',
    operator: 'Ana Costa',
    status: 'Promessa de Pagamento',
    note: 'Cliente informou que pagará na sexta-feira.',
  },
  {
    id: '2',
    date: '2023-10-20T14:15:00',
    type: 'WhatsApp',
    operator: 'Marcos P.',
    status: 'Mensagem Entregue',
    note: 'Boleto enviado via link WTK.',
  },
  {
    id: '3',
    date: '2023-10-15T09:00:00',
    type: 'Baixa',
    operator: 'Sistema',
    status: 'Pagamento Parcial',
    note: 'Baixa de R$ 400,00 via PIX.',
    isPayment: true,
  },
]
