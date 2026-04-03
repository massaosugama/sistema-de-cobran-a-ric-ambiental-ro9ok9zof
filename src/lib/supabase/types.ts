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
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      cadastral_updates: {
        Row: {
          cod_pess_fat: string | null
          created_at: string
          customer_name: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          requester_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolver_id: string | null
          status: string
          uc: string
        }
        Insert: {
          cod_pess_fat?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          requester_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolver_id?: string | null
          status?: string
          uc: string
        }
        Update: {
          cod_pess_fat?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          requester_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolver_id?: string | null
          status?: string
          uc?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cadastral_updates_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cadastral_updates_resolver_id_fkey'
            columns: ['resolver_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      contact_history: {
        Row: {
          cod_pess_fat: string | null
          contact_type: Database['public']['Enums']['contact_type_enum'] | null
          created_at: string
          id: string
          is_active: boolean | null
          notes: string | null
          operator_id: string | null
          quality_result: string | null
          snapshot_qt_fats: number | null
          snapshot_refs: string | null
          snapshot_valor_a_vencer: number | null
          snapshot_valor_total: number | null
          snapshot_valor_vencido: number | null
          status: string | null
          uc: string | null
        }
        Insert: {
          cod_pess_fat?: string | null
          contact_type?: Database['public']['Enums']['contact_type_enum'] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          operator_id?: string | null
          quality_result?: string | null
          snapshot_qt_fats?: number | null
          snapshot_refs?: string | null
          snapshot_valor_a_vencer?: number | null
          snapshot_valor_total?: number | null
          snapshot_valor_vencido?: number | null
          status?: string | null
          uc?: string | null
        }
        Update: {
          cod_pess_fat?: string | null
          contact_type?: Database['public']['Enums']['contact_type_enum'] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          operator_id?: string | null
          quality_result?: string | null
          snapshot_qt_fats?: number | null
          snapshot_refs?: string | null
          snapshot_valor_a_vencer?: number | null
          snapshot_valor_total?: number | null
          snapshot_valor_vencido?: number | null
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
        ]
      }
      contact_history_audit: {
        Row: {
          changed_by: string | null
          contact_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          changed_by?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          changed_by?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'contact_history_audit_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_history'
            referencedColumns: ['id']
          },
        ]
      }
      contact_results: {
        Row: {
          cod_pess_fat: string
          contact_id: string | null
          created_at: string
          data_baixa: string
          dias_para_reversao: number
          id: string
          pontos_reversao: number | null
          settlement_id: string | null
          uc: string
          valor_recuperado: number
        }
        Insert: {
          cod_pess_fat: string
          contact_id?: string | null
          created_at?: string
          data_baixa: string
          dias_para_reversao: number
          id?: string
          pontos_reversao?: number | null
          settlement_id?: string | null
          uc: string
          valor_recuperado: number
        }
        Update: {
          cod_pess_fat?: string
          contact_id?: string | null
          created_at?: string
          data_baixa?: string
          dias_para_reversao?: number
          id?: string
          pontos_reversao?: number | null
          settlement_id?: string | null
          uc?: string
          valor_recuperado?: number
        }
        Relationships: [
          {
            foreignKeyName: 'contact_results_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_history'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_results_settlement_id_fkey'
            columns: ['settlement_id']
            isOneToOne: false
            referencedRelation: 'settlements'
            referencedColumns: ['id']
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
          is_active: boolean | null
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
          is_active?: boolean | null
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
          is_active?: boolean | null
          operator_id?: string | null
          uc?: string | null
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          id: string
          ignored_records: number
          inserted_records: number
          latest_record_date: string | null
          table_name: string
          total_records: number
        }
        Insert: {
          created_at?: string
          id?: string
          ignored_records?: number
          inserted_records?: number
          latest_record_date?: string | null
          table_name: string
          total_records?: number
        }
        Update: {
          created_at?: string
          id?: string
          ignored_records?: number
          inserted_records?: number
          latest_record_date?: string | null
          table_name?: string
          total_records?: number
        }
        Relationships: []
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
          valor_a_vencer: number | null
          valor_retidas_em_aberto: number | null
          valor_total: number | null
          valor_vencido: number | null
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
          valor_a_vencer?: number | null
          valor_retidas_em_aberto?: number | null
          valor_total?: number | null
          valor_vencido?: number | null
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
          valor_a_vencer?: number | null
          valor_retidas_em_aberto?: number | null
          valor_total?: number | null
          valor_vencido?: number | null
        }
        Relationships: []
      }
      portfolio_history: {
        Row: {
          created_at: string
          id: string
          snapshot_date: string
          total_a_vencer: number
          total_cases: number
          total_lotes_cases: number
          total_lotes_value: number
          total_retidas: number | null
          total_retidas_cases: number
          total_value: number
          total_vencido: number
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot_date: string
          total_a_vencer?: number
          total_cases?: number
          total_lotes_cases?: number
          total_lotes_value?: number
          total_retidas?: number | null
          total_retidas_cases?: number
          total_value?: number
          total_vencido?: number
        }
        Update: {
          created_at?: string
          id?: string
          snapshot_date?: string
          total_a_vencer?: number
          total_cases?: number
          total_lotes_cases?: number
          total_lotes_value?: number
          total_retidas?: number | null
          total_retidas_cases?: number
          total_value?: number
          total_vencido?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          color: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          last_login: string | null
          last_name: string | null
          last_quote_index: number | null
          name: string | null
          reminder_enabled: boolean | null
          reminder_interval: number | null
          role: string | null
          snooze_enabled: boolean | null
          snooze_interval: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          last_name?: string | null
          last_quote_index?: number | null
          name?: string | null
          reminder_enabled?: boolean | null
          reminder_interval?: number | null
          role?: string | null
          snooze_enabled?: boolean | null
          snooze_interval?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          last_login?: string | null
          last_name?: string | null
          last_quote_index?: number | null
          name?: string | null
          reminder_enabled?: boolean | null
          reminder_interval?: number | null
          role?: string | null
          snooze_enabled?: boolean | null
          snooze_interval?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_clicks: {
        Row: {
          created_at: string
          id: string
          quote_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quote_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quote_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'quote_clicks_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'quote_clicks_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          id: string
          link: string | null
          order_index: number
          text: string
          theory: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          order_index?: number
          text: string
          theory?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          order_index?: number
          text?: string
          theory?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          cod_pess_fat: string | null
          created_at: string
          databaixa_final: string | null
          databaixa_inicial: string | null
          datacredito_final: string | null
          datacredito_inicial: string | null
          datacriacao: string | null
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
          created_at?: string
          databaixa_final?: string | null
          databaixa_inicial?: string | null
          datacredito_final?: string | null
          datacredito_inicial?: string | null
          datacriacao?: string | null
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
          created_at?: string
          databaixa_final?: string | null
          databaixa_inicial?: string | null
          datacredito_final?: string | null
          datacredito_inicial?: string | null
          datacriacao?: string | null
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
      cleanup_old_settlements: { Args: never; Returns: undefined }
      execute_post_import_routines: { Args: never; Returns: undefined }
      get_dashboard_evolution: { Args: { tz?: string }; Returns: Json }
      get_operator_stats: {
        Args: never
        Returns: {
          operator_id: string
          today_contacts: number
          today_followups: number
          total_contacts: number
          total_followups: number
        }[]
      }
      get_portfolio_stats: { Args: never; Returns: Json }
      process_conversions: { Args: never; Returns: undefined }
      record_portfolio_snapshot: { Args: never; Returns: undefined }
      remove_duplicate_settlements: { Args: never; Returns: Json }
      truncate_pending_debts: { Args: never; Returns: undefined }
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
// Table: app_settings
//   key: text (not null)
//   value: jsonb (not null)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: cadastral_updates
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   cod_pess_fat: text (nullable)
//   customer_name: text (nullable)
//   requester_id: uuid (nullable)
//   resolver_id: uuid (nullable)
//   status: text (not null, default: 'pending'::text)
//   notes: text (nullable)
//   resolution_notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   resolved_at: timestamp with time zone (nullable)
//   is_active: boolean (nullable, default: true)
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
//   is_active: boolean (nullable, default: true)
//   snapshot_valor_total: numeric (nullable)
//   snapshot_valor_vencido: numeric (nullable)
//   snapshot_valor_a_vencer: numeric (nullable)
//   snapshot_qt_fats: integer (nullable)
//   snapshot_refs: text (nullable)
// Table: contact_history_audit
//   id: uuid (not null, default: gen_random_uuid())
//   contact_id: uuid (nullable)
//   changed_by: uuid (nullable)
//   old_data: jsonb (nullable)
//   new_data: jsonb (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: contact_results
//   id: uuid (not null, default: gen_random_uuid())
//   contact_id: uuid (nullable)
//   uc: text (not null)
//   cod_pess_fat: text (not null)
//   settlement_id: uuid (nullable)
//   valor_recuperado: numeric (not null)
//   data_baixa: date (not null)
//   dias_para_reversao: integer (not null)
//   pontos_reversao: integer (nullable, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
// Table: follow_up_tasks
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   operator_id: uuid (nullable)
//   action: text (nullable)
//   due_date: date (nullable)
//   completed: boolean (nullable, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   cod_pess_fat: text (nullable)
//   is_active: boolean (nullable, default: true)
// Table: import_history
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   table_name: text (not null)
//   total_records: integer (not null, default: 0)
//   inserted_records: integer (not null, default: 0)
//   ignored_records: integer (not null, default: 0)
//   latest_record_date: timestamp with time zone (nullable)
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
//   valor_vencido: numeric (nullable, default: 0)
//   valor_a_vencer: numeric (nullable, default: 0)
//   valor_retidas_em_aberto: numeric (nullable, default: 0)
// Table: portfolio_history
//   id: uuid (not null, default: gen_random_uuid())
//   snapshot_date: date (not null)
//   total_cases: integer (not null, default: 0)
//   total_value: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
//   total_vencido: numeric (not null, default: 0)
//   total_a_vencer: numeric (not null, default: 0)
//   total_retidas: numeric (nullable, default: 0)
//   total_lotes_cases: integer (not null, default: 0)
//   total_lotes_value: numeric (not null, default: 0)
//   total_retidas_cases: integer (not null, default: 0)
// Table: profiles
//   id: uuid (not null)
//   email: text (not null)
//   name: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   last_quote_index: integer (nullable, default: 0)
//   first_name: text (nullable)
//   last_name: text (nullable)
//   is_admin: boolean (nullable, default: false)
//   color: text (nullable)
//   is_active: boolean (nullable, default: true)
//   updated_at: timestamp with time zone (nullable, default: now())
//   last_login: timestamp with time zone (nullable)
//   role: text (nullable, default: 'consultas'::text)
//   reminder_enabled: boolean (nullable, default: true)
//   snooze_enabled: boolean (nullable, default: true)
//   reminder_interval: integer (nullable, default: 30)
//   snooze_interval: integer (nullable, default: 15)
// Table: quote_clicks
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   quote_id: uuid (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: quotes
//   id: uuid (not null, default: gen_random_uuid())
//   text: text (not null)
//   theory: text (nullable)
//   link: text (nullable)
//   order_index: integer (not null)
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
//   created_at: timestamp with time zone (not null, default: now())
//   datacriacao: timestamp with time zone (nullable)

// --- CONSTRAINTS ---
// Table: app_settings
//   PRIMARY KEY app_settings_pkey: PRIMARY KEY (key)
// Table: cadastral_updates
//   PRIMARY KEY cadastral_updates_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cadastral_updates_requester_id_fkey: FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY cadastral_updates_resolver_id_fkey: FOREIGN KEY (resolver_id) REFERENCES profiles(id) ON DELETE SET NULL
// Table: contact_history
//   FOREIGN KEY contact_history_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY contact_history_pkey: PRIMARY KEY (id)
// Table: contact_history_audit
//   FOREIGN KEY contact_history_audit_changed_by_fkey: FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY contact_history_audit_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contact_history(id) ON DELETE CASCADE
//   PRIMARY KEY contact_history_audit_pkey: PRIMARY KEY (id)
// Table: contact_results
//   FOREIGN KEY contact_results_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contact_history(id) ON DELETE CASCADE
//   UNIQUE contact_results_contact_id_settlement_id_key: UNIQUE (contact_id, settlement_id)
//   PRIMARY KEY contact_results_pkey: PRIMARY KEY (id)
//   FOREIGN KEY contact_results_settlement_id_fkey: FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE
// Table: follow_up_tasks
//   FOREIGN KEY follow_up_tasks_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY follow_up_tasks_pkey: PRIMARY KEY (id)
// Table: import_history
//   PRIMARY KEY import_history_pkey: PRIMARY KEY (id)
// Table: pending_debts
//   PRIMARY KEY pending_debts_pkey: PRIMARY KEY (uc, cod_pess_fat)
// Table: portfolio_history
//   PRIMARY KEY portfolio_history_pkey: PRIMARY KEY (id)
//   UNIQUE portfolio_history_snapshot_date_key: UNIQUE (snapshot_date)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
// Table: quote_clicks
//   PRIMARY KEY quote_clicks_pkey: PRIMARY KEY (id)
//   FOREIGN KEY quote_clicks_quote_id_fkey: FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
//   FOREIGN KEY quote_clicks_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: quotes
//   PRIMARY KEY quotes_pkey: PRIMARY KEY (id)
// Table: settlements
//   PRIMARY KEY settlements_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: app_settings
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: cadastral_updates
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_history_audit
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_results
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: follow_up_tasks
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: import_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: pending_debts
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: portfolio_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "profiles_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND ((profiles_1.role = 'admin'::text) OR (profiles_1.is_admin = true)))))
//   Policy "profiles_select_all" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "profiles_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND ((profiles_1.role = 'admin'::text) OR (profiles_1.is_admin = true)))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles profiles_1   WHERE ((profiles_1.id = auth.uid()) AND ((profiles_1.role = 'admin'::text) OR (profiles_1.is_admin = true)))))
//   Policy "profiles_update_own" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (auth.uid() = id)
//     WITH CHECK: (auth.uid() = id)
// Table: quote_clicks
//   Policy "authenticated_insert_quote_clicks" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "authenticated_select_quote_clicks" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: quotes
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: settlements
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true

// --- DATABASE FUNCTIONS ---
// FUNCTION audit_contact_history_changes()
//   CREATE OR REPLACE FUNCTION public.audit_contact_history_changes()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       INSERT INTO public.contact_history_audit (contact_id, changed_by, old_data, new_data)
//       VALUES (
//           NEW.id,
//           auth.uid(),
//           row_to_json(OLD),
//           row_to_json(NEW)
//       );
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION cleanup_old_settlements()
//   CREATE OR REPLACE FUNCTION public.cleanup_old_settlements()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     retention_days INT;
//   BEGIN
//     -- Tenta ler o parâmetro de retenção do app_settings, se não encontrar usa 90 como padrão
//     SELECT (value->>'retention_days')::int INTO retention_days
//     FROM public.app_settings
//     WHERE key = 'conversion_params';
//
//     IF retention_days IS NULL THEN
//       retention_days := 90;
//     END IF;
//
//     -- Remove as movimentações de baixas mais antigas que o prazo estipulado (priorizando a data de criação real do registro no GIS)
//     DELETE FROM public.settlements
//     WHERE COALESCE(datacriacao, created_at) < NOW() - (retention_days || ' days')::interval;
//   END;
//   $function$
//
// FUNCTION execute_post_import_routines()
//   CREATE OR REPLACE FUNCTION public.execute_post_import_routines()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     -- 1º: Limpeza de dados baseada no prazo de retenção (retention_days lido do app_settings)
//     PERFORM public.cleanup_old_settlements();
//
//     -- 2º: Processamento do motor de cálculo de conversões apenas nos dados que restaram e são elegíveis
//     PERFORM public.process_conversions();
//   END;
//   $function$
//
// FUNCTION get_dashboard_evolution(text)
//   CREATE OR REPLACE FUNCTION public.get_dashboard_evolution(tz text DEFAULT 'America/Sao_Paulo'::text)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//     curr_portfolio record;
//     prev_portfolio record;
//     curr_contacts bigint;
//     prev_contacts bigint;
//     curr_followups bigint;
//     prev_followups bigint;
//     today_date date := date(now() AT TIME ZONE tz);
//   BEGIN
//     SELECT
//       count(*) FILTER (WHERE COALESCE(setor, '') != '4036') as total_cases,
//       COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_value,
//       COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_vencido,
//       COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_a_vencer,
//       COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0) as total_retidas,
//       count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND valor_retidas_em_aberto > 0) as total_retidas_cases,
//       count(*) FILTER (WHERE COALESCE(setor, '') = '4036') as total_lotes_cases,
//       COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0) as total_lotes_value
//     INTO curr_portfolio
//     FROM public.pending_debts;
//
//     SELECT * INTO prev_portfolio
//     FROM public.portfolio_history
//     WHERE snapshot_date < today_date
//     ORDER BY snapshot_date DESC
//     LIMIT 1;
//
//     SELECT count(*) INTO curr_contacts FROM public.contact_history;
//     SELECT count(*) INTO curr_followups FROM public.follow_up_tasks;
//
//     SELECT count(*) INTO prev_contacts
//     FROM public.contact_history
//     WHERE date(created_at AT TIME ZONE tz) < today_date;
//
//     SELECT count(*) INTO prev_followups
//     FROM public.follow_up_tasks
//     WHERE date(created_at AT TIME ZONE tz) < today_date;
//
//     SELECT json_build_object(
//       'portfolio', json_build_object(
//          'current', json_build_object(
//            'total_cases', curr_portfolio.total_cases,
//            'total_value', curr_portfolio.total_value,
//            'total_vencido', curr_portfolio.total_vencido,
//            'total_a_vencer', curr_portfolio.total_a_vencer,
//            'total_retidas', curr_portfolio.total_retidas,
//            'total_retidas_cases', curr_portfolio.total_retidas_cases,
//            'total_lotes_cases', curr_portfolio.total_lotes_cases,
//            'total_lotes_value', curr_portfolio.total_lotes_value
//          ),
//          'previous', json_build_object(
//            'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
//            'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
//            'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
//            'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer),
//            'total_retidas', COALESCE(prev_portfolio.total_retidas, curr_portfolio.total_retidas),
//            'total_retidas_cases', COALESCE(prev_portfolio.total_retidas_cases, curr_portfolio.total_retidas_cases),
//            'total_lotes_cases', COALESCE(prev_portfolio.total_lotes_cases, curr_portfolio.total_lotes_cases),
//            'total_lotes_value', COALESCE(prev_portfolio.total_lotes_value, curr_portfolio.total_lotes_value)
//          )
//       ),
//       'productivity', json_build_object(
//          'current', json_build_object(
//            'contacts', curr_contacts,
//            'followups', curr_followups,
//            'updates', 0
//          ),
//          'previous', json_build_object(
//            'contacts', prev_contacts,
//            'followups', prev_followups,
//            'updates', 0
//          )
//       )
//     ) INTO result;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_operator_stats()
//   CREATE OR REPLACE FUNCTION public.get_operator_stats()
//    RETURNS TABLE(operator_id uuid, total_contacts bigint, today_contacts bigint, total_followups bigint, today_followups bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       RETURN QUERY
//       SELECT
//           p.id as operator_id,
//           COALESCE(c.total_contacts, 0) as total_contacts,
//           COALESCE(c.today_contacts, 0) as today_contacts,
//           COALESCE(f.total_followups, 0) as total_followups,
//           COALESCE(f.today_followups, 0) as today_followups
//       FROM public.profiles p
//       LEFT JOIN (
//           SELECT
//               ch.operator_id,
//               count(*) as total_contacts,
//               sum(CASE WHEN date(ch.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo') THEN 1 ELSE 0 END) as today_contacts
//           FROM public.contact_history ch
//           GROUP BY ch.operator_id
//       ) c ON c.operator_id = p.id
//       LEFT JOIN (
//           SELECT
//               ft.operator_id,
//               count(*) as total_followups,
//               sum(CASE WHEN date(ft.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo') THEN 1 ELSE 0 END) as today_followups
//           FROM public.follow_up_tasks ft
//           GROUP BY ft.operator_id
//       ) f ON f.operator_id = p.id;
//   END;
//   $function$
//
// FUNCTION get_portfolio_stats()
//   CREATE OR REPLACE FUNCTION public.get_portfolio_stats()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     SELECT json_build_object(
//       'total_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036'),
//       'total_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//       'total_vencido', COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//       'total_a_vencer', COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//       'total_retidas', COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//       'total_lotes_cases', count(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
//       'total_lotes_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
//     ) INTO result
//     FROM public.pending_debts;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, email, name, first_name, last_name, role)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'name', ''),
//       NEW.raw_user_meta_data->>'first_name',
//       NEW.raw_user_meta_data->>'last_name',
//       'consultas'
//     )
//     ON CONFLICT (id) DO UPDATE SET
//       email = EXCLUDED.email,
//       name = EXCLUDED.name,
//       first_name = EXCLUDED.first_name,
//       last_name = EXCLUDED.last_name;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION keep_latest_20_import_history()
//   CREATE OR REPLACE FUNCTION public.keep_latest_20_import_history()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       DELETE FROM public.import_history
//       WHERE id NOT IN (
//           SELECT id FROM public.import_history
//           ORDER BY created_at DESC
//           LIMIT 20
//       );
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION process_conversions()
//   CREATE OR REPLACE FUNCTION public.process_conversions()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     max_days INT;
//     max_score_days INT;
//   BEGIN
//     -- Parametros do sistema
//     SELECT (value->>'max_days')::int INTO max_days FROM public.app_settings WHERE key = 'conversion_params';
//     SELECT (value->>'max_score_days')::int INTO max_score_days FROM public.app_settings WHERE key = 'conversion_params';
//
//     IF max_days IS NULL THEN max_days := 30; END IF;
//     IF max_score_days IS NULL THEN max_score_days := 7; END IF;
//
//     INSERT INTO public.contact_results (contact_id, uc, cod_pess_fat, settlement_id, valor_recuperado, data_baixa, dias_para_reversao, pontos_reversao)
//     SELECT
//       ch.id as contact_id,
//       s.uc,
//       COALESCE(s.cod_pess_fat, ch.cod_pess_fat) as cod_pess_fat,
//       s.id as settlement_id,
//       s.valor_total as valor_recuperado,
//       COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
//       (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
//       CASE WHEN (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN 5 ELSE 2 END as pontos_reversao
//     FROM public.settlements s
//     JOIN public.contact_history ch ON ch.uc = s.uc AND (ch.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
//     WHERE
//       ch.is_active = true
//       AND s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO')
//       AND COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) >= (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date
//       AND (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
//     ON CONFLICT (contact_id, settlement_id) DO NOTHING;
//   END;
//   $function$
//
// FUNCTION protect_profile_roles()
//   CREATE OR REPLACE FUNCTION public.protect_profile_roles()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     is_caller_admin boolean;
//   BEGIN
//     -- If role and is_admin are not being changed, proceed normally
//     IF NEW.role IS NOT DISTINCT FROM OLD.role AND NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin THEN
//       RETURN NEW;
//     END IF;
//
//     -- If system/service_role bypass (auth.uid() is null)
//     IF auth.uid() IS NULL THEN
//       RETURN NEW;
//     END IF;
//
//     -- Check if the caller is an admin
//     SELECT (role = 'admin' OR is_admin = true) INTO is_caller_admin
//     FROM public.profiles
//     WHERE id = auth.uid();
//
//     IF COALESCE(is_caller_admin, false) THEN
//       RETURN NEW;
//     ELSE
//       -- If not admin, ignore the role changes (revert them to OLD values to prevent privilege escalation)
//       NEW.role = OLD.role;
//       NEW.is_admin = OLD.is_admin;
//       RETURN NEW;
//     END IF;
//   END;
//   $function$
//
// FUNCTION record_portfolio_snapshot()
//   CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       INSERT INTO public.portfolio_history (
//           snapshot_date, total_cases, total_value, total_vencido, total_a_vencer, total_retidas, total_retidas_cases,
//           total_lotes_cases, total_lotes_value
//       )
//       SELECT
//           CURRENT_DATE,
//           COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036'),
//           COALESCE(SUM(valor_total) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//           COALESCE(SUM(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//           COALESCE(SUM(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//           COALESCE(SUM(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036'), 0),
//           COUNT(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND valor_retidas_em_aberto > 0),
//           COUNT(*) FILTER (WHERE COALESCE(setor, '') = '4036'),
//           COALESCE(SUM(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'), 0)
//       FROM public.pending_debts
//       ON CONFLICT (snapshot_date) DO UPDATE
//       SET total_cases = EXCLUDED.total_cases,
//           total_value = EXCLUDED.total_value,
//           total_vencido = EXCLUDED.total_vencido,
//           total_a_vencer = EXCLUDED.total_a_vencer,
//           total_retidas = EXCLUDED.total_retidas,
//           total_retidas_cases = EXCLUDED.total_retidas_cases,
//           total_lotes_cases = EXCLUDED.total_lotes_cases,
//           total_lotes_value = EXCLUDED.total_lotes_value;
//   END;
//   $function$
//
// FUNCTION remove_duplicate_settlements()
//   CREATE OR REPLACE FUNCTION public.remove_duplicate_settlements()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     deleted_count INT := 0;
//   BEGIN
//     WITH ranked_settlements AS (
//       SELECT
//         s.id,
//         EXISTS (SELECT 1 FROM public.contact_results cr WHERE cr.settlement_id = s.id) as is_referenced,
//         ROW_NUMBER() OVER (
//           PARTITION BY
//             s.uc,
//             s.cod_pess_fat,
//             s.valor_total,
//             COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data)
//           ORDER BY
//             CASE WHEN EXISTS (SELECT 1 FROM public.contact_results cr WHERE cr.settlement_id = s.id) THEN 0 ELSE 1 END,
//             s.created_at ASC
//         ) as rn
//       FROM public.settlements s
//     ),
//     to_delete AS (
//       SELECT id
//       FROM ranked_settlements
//       WHERE rn > 1 AND is_referenced = false
//     )
//     DELETE FROM public.settlements
//     WHERE id IN (SELECT id FROM to_delete);
//
//     GET DIAGNOSTICS deleted_count = ROW_COUNT;
//
//     RETURN json_build_object('deleted_count', deleted_count);
//   END;
//   $function$
//
// FUNCTION set_current_timestamp_updated_at()
//   CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_record_snapshot()
//   CREATE OR REPLACE FUNCTION public.trigger_record_snapshot()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       PERFORM public.record_portfolio_snapshot();
//       RETURN NULL;
//   END;
//   $function$
//
// FUNCTION truncate_pending_debts()
//   CREATE OR REPLACE FUNCTION public.truncate_pending_debts()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     TRUNCATE TABLE public.pending_debts;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: contact_history
//   trg_audit_contact_history: CREATE TRIGGER trg_audit_contact_history AFTER UPDATE ON public.contact_history FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION audit_contact_history_changes()
// Table: import_history
//   trg_limit_import_history: CREATE TRIGGER trg_limit_import_history AFTER INSERT ON public.import_history FOR EACH ROW EXECUTE FUNCTION keep_latest_20_import_history()
// Table: profiles
//   on_profile_role_update: CREATE TRIGGER on_profile_role_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_roles()
//   set_profiles_updated_at: CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at()

// --- INDEXES ---
// Table: cadastral_updates
//   CREATE INDEX cadastral_updates_created_at_idx ON public.cadastral_updates USING btree (created_at)
//   CREATE INDEX cadastral_updates_status_idx ON public.cadastral_updates USING btree (status)
// Table: contact_history
//   CREATE INDEX contact_history_created_at_idx ON public.contact_history USING btree (created_at)
//   CREATE INDEX contact_history_operator_id_idx ON public.contact_history USING btree (operator_id)
//   CREATE INDEX contact_history_uc_cod_pess_fat_idx ON public.contact_history USING btree (uc, cod_pess_fat)
// Table: contact_results
//   CREATE UNIQUE INDEX contact_results_contact_id_settlement_id_key ON public.contact_results USING btree (contact_id, settlement_id)
// Table: follow_up_tasks
//   CREATE INDEX follow_up_tasks_created_at_idx ON public.follow_up_tasks USING btree (created_at)
//   CREATE INDEX follow_up_tasks_operator_id_idx ON public.follow_up_tasks USING btree (operator_id)
// Table: pending_debts
//   CREATE INDEX pending_debts_valor_total_idx ON public.pending_debts USING btree (valor_total DESC)
// Table: portfolio_history
//   CREATE UNIQUE INDEX portfolio_history_snapshot_date_key ON public.portfolio_history USING btree (snapshot_date)
// Table: profiles
//   CREATE INDEX profiles_color_idx ON public.profiles USING btree (color)
