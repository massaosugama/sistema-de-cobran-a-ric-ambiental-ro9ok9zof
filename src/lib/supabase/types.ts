// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      contact_history: {
        Row: {
          cod_pess_fat: string | null
          contact_type: Database['public']['Enums']['contact_type_enum'] | null
          created_at: string
          id: string
          notes: string | null
          operator_id: string | null
          quality_result: string | null
          status: string | null
          uc: string | null
        }
        Insert: {
          cod_pess_fat?: string | null
          contact_type?: Database['public']['Enums']['contact_type_enum'] | null
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          quality_result?: string | null
          status?: string | null
          uc?: string | null
        }
        Update: {
          cod_pess_fat?: string | null
          contact_type?: Database['public']['Enums']['contact_type_enum'] | null
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          quality_result?: string | null
          status?: string | null
          uc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'contact_history_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_history_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'pending_debts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
        ]
      }
      follow_up_tasks: {
        Row: {
          action: string | null
          cod_pess_fat: string | null
          completed: boolean | null
          created_at: string
          due_date: string | null
          id: string
          operator_id: string | null
          uc: string | null
        }
        Insert: {
          action?: string | null
          cod_pess_fat?: string | null
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          operator_id?: string | null
          uc?: string | null
        }
        Update: {
          action?: string | null
          cod_pess_fat?: string | null
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          operator_id?: string | null
          uc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'follow_up_tasks_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'pending_debts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
        ]
      }
      pending_debts: {
        Row: {
          cod_pess_fat: string
          endereco: string | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          proprietario_celular: string | null
          proprietario_cpf_cnpj: string | null
          proprietario_nome: string | null
          qt_fats: number | null
          refs: string | null
          responsavel_celular: string | null
          responsavel_cpf_cnpj: string | null
          responsavel_nome: string | null
          setor: string | null
          situ_docto: string | null
          ta_nome_de_quem: string | null
          uc: string
          uc_repete: string | null
          valor_total: number | null
        }
        Insert: {
          cod_pess_fat: string
          endereco?: string | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          proprietario_celular?: string | null
          proprietario_cpf_cnpj?: string | null
          proprietario_nome?: string | null
          qt_fats?: number | null
          refs?: string | null
          responsavel_celular?: string | null
          responsavel_cpf_cnpj?: string | null
          responsavel_nome?: string | null
          setor?: string | null
          situ_docto?: string | null
          ta_nome_de_quem?: string | null
          uc: string
          uc_repete?: string | null
          valor_total?: number | null
        }
        Update: {
          cod_pess_fat?: string
          endereco?: string | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          proprietario_celular?: string | null
          proprietario_cpf_cnpj?: string | null
          proprietario_nome?: string | null
          qt_fats?: number | null
          refs?: string | null
          responsavel_celular?: string | null
          responsavel_cpf_cnpj?: string | null
          responsavel_nome?: string | null
          setor?: string | null
          situ_docto?: string | null
          ta_nome_de_quem?: string | null
          uc?: string
          uc_repete?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          cod_pess_fat: string | null
          databaixa_final: string | null
          databaixa_inicial: string | null
          datacredito_final: string | null
          datacredito_inicial: string | null
          id: string
          neg_data: string | null
          neg_desconto: number | null
          neg_parcelas: number | null
          neg_valor_acordo: number | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          qt_fats: number | null
          refs: string | null
          tipo_baixa: string | null
          uc: string | null
          valor_total: number | null
        }
        Insert: {
          cod_pess_fat?: string | null
          databaixa_final?: string | null
          databaixa_inicial?: string | null
          datacredito_final?: string | null
          datacredito_inicial?: string | null
          id?: string
          neg_data?: string | null
          neg_desconto?: number | null
          neg_parcelas?: number | null
          neg_valor_acordo?: number | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          qt_fats?: number | null
          refs?: string | null
          tipo_baixa?: string | null
          uc?: string | null
          valor_total?: number | null
        }
        Update: {
          cod_pess_fat?: string | null
          databaixa_final?: string | null
          databaixa_inicial?: string | null
          datacredito_final?: string | null
          datacredito_inicial?: string | null
          id?: string
          neg_data?: string | null
          neg_desconto?: number | null
          neg_parcelas?: number | null
          neg_valor_acordo?: number | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          qt_fats?: number | null
          refs?: string | null
          tipo_baixa?: string | null
          uc?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contact_type_enum:
        | 'WTK PASSIVO'
        | 'TEL PASSIVO'
        | 'WTK ATIVO'
        | 'TEL ATIVO'
        | 'E-MAIL'
        | 'OUTRO'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contact_type_enum: [
        'WTK PASSIVO',
        'TEL PASSIVO',
        'WTK ATIVO',
        'TEL ATIVO',
        'E-MAIL',
        'OUTRO',
      ],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: contact_history
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   operator_id: uuid (nullable)
//   contact_type: contact_type_enum (nullable)
//   status: text (nullable)
//   quality_result: text (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   cod_pess_fat: text (nullable)
// Table: follow_up_tasks
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   operator_id: uuid (nullable)
//   action: text (nullable)
//   due_date: date (nullable)
//   completed: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   cod_pess_fat: text (nullable)
// Table: pending_debts
//   uc: text (not null)
//   setor: text (nullable)
//   endereco: text (nullable)
//   uc_repete: text (nullable)
//   ta_nome_de_quem: text (nullable)
//   qt_fats: integer (nullable)
//   situ_docto: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (not null)
//   pessoa_fatura_nome: text (nullable)
//   pessoa_fatura_cpf_cnpj: text (nullable)
//   pessoa_fatura_celular: text (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_cpf_cnpj: text (nullable)
//   proprietario_celular: text (nullable)
//   responsavel_nome: text (nullable)
//   responsavel_cpf_cnpj: text (nullable)
//   responsavel_celular: text (nullable)
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: settlements
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   qt_fats: integer (nullable)
//   tipo_baixa: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (nullable)
//   pessoa_fatura_nome: text (nullable)
//   pessoa_fatura_cpf_cnpj: text (nullable)
//   pessoa_fatura_celular: text (nullable)
//   databaixa_inicial: date (nullable)
//   databaixa_final: date (nullable)
//   datacredito_inicial: date (nullable)
//   datacredito_final: date (nullable)
//   neg_data: date (nullable)
//   neg_valor_acordo: numeric (nullable)
//   neg_parcelas: integer (nullable)
//   neg_desconto: numeric (nullable)

// --- CONSTRAINTS ---
// Table: contact_history
//   FOREIGN KEY contact_history_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY contact_history_pkey: PRIMARY KEY (id)
//   FOREIGN KEY contact_history_uc_cod_pess_fat_fkey: FOREIGN KEY (uc, cod_pess_fat) REFERENCES pending_debts(uc, cod_pess_fat) ON DELETE CASCADE
// Table: follow_up_tasks
//   FOREIGN KEY follow_up_tasks_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY follow_up_tasks_pkey: PRIMARY KEY (id)
//   FOREIGN KEY follow_up_tasks_uc_cod_pess_fat_fkey: FOREIGN KEY (uc, cod_pess_fat) REFERENCES pending_debts(uc, cod_pess_fat) ON DELETE CASCADE
// Table: pending_debts
//   PRIMARY KEY pending_debts_pkey: PRIMARY KEY (uc, cod_pess_fat)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: settlements
//   PRIMARY KEY settlements_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: contact_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: follow_up_tasks
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: pending_debts
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: settlements
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
