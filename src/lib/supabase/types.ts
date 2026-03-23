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
          is_active: boolean | null
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
          is_active?: boolean | null
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
          is_active?: boolean | null
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
      portfolio_history: {
        Row: {
          created_at: string
          id: string
          snapshot_date: string
          total_cases: number
          total_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot_date: string
          total_cases?: number
          total_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          snapshot_date?: string
          total_cases?: number
          total_value?: number
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
          is_admin: boolean | null
          last_name: string | null
          last_quote_index: number | null
          name: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          last_quote_index?: number | null
          name?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          last_quote_index?: number | null
          name?: string | null
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
      record_portfolio_snapshot: { Args: never; Returns: undefined }
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
// Table: contact_history_audit
//   id: uuid (not null, default: gen_random_uuid())
//   contact_id: uuid (nullable)
//   changed_by: uuid (nullable)
//   old_data: jsonb (nullable)
//   new_data: jsonb (nullable)
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
// Table: portfolio_history
//   id: uuid (not null, default: gen_random_uuid())
//   snapshot_date: date (not null)
//   total_cases: integer (not null, default: 0)
//   total_value: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
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

// --- CONSTRAINTS ---
// Table: contact_history
//   FOREIGN KEY contact_history_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY contact_history_pkey: PRIMARY KEY (id)
// Table: contact_history_audit
//   FOREIGN KEY contact_history_audit_changed_by_fkey: FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL
//   FOREIGN KEY contact_history_audit_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contact_history(id) ON DELETE CASCADE
//   PRIMARY KEY contact_history_audit_pkey: PRIMARY KEY (id)
// Table: follow_up_tasks
//   FOREIGN KEY follow_up_tasks_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY follow_up_tasks_pkey: PRIMARY KEY (id)
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
//   FOREIGN KEY quote_clicks_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: quotes
//   PRIMARY KEY quotes_pkey: PRIMARY KEY (id)
// Table: settlements
//   PRIMARY KEY settlements_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: contact_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_history_audit
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
// Table: portfolio_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: profiles
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
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
//           (SELECT count(*) FROM public.contact_history ch WHERE ch.operator_id = p.id) as total_contacts,
//           (SELECT count(*) FROM public.contact_history ch WHERE ch.operator_id = p.id AND date(ch.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo')) as today_contacts,
//           (SELECT count(*) FROM public.follow_up_tasks ft WHERE ft.operator_id = p.id) as total_followups,
//           (SELECT count(*) FROM public.follow_up_tasks ft WHERE ft.operator_id = p.id AND date(ft.created_at AT TIME ZONE 'America/Sao_Paulo') = date(now() AT TIME ZONE 'America/Sao_Paulo')) as today_followups
//       FROM public.profiles p;
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
//       'total_cases', count(*),
//       'total_value', COALESCE(sum(valor_total), 0)
//     ) INTO result
//     FROM (
//       SELECT uc, cod_pess_fat, sum(valor_total) as valor_total
//       FROM public.pending_debts
//       GROUP BY uc, cod_pess_fat
//     ) t;
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
//     INSERT INTO public.profiles (id, email, name, first_name, last_name)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'name', ''),
//       NEW.raw_user_meta_data->>'first_name',
//       NEW.raw_user_meta_data->>'last_name'
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
// FUNCTION record_portfolio_snapshot()
//   CREATE OR REPLACE FUNCTION public.record_portfolio_snapshot()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       INSERT INTO public.portfolio_history (snapshot_date, total_cases, total_value)
//       SELECT
//           CURRENT_DATE,
//           COUNT(*),
//           COALESCE(SUM(valor_total), 0)
//       FROM (
//           SELECT uc, cod_pess_fat, SUM(valor_total) as valor_total
//           FROM public.pending_debts
//           GROUP BY uc, cod_pess_fat
//       ) unique_cases
//       ON CONFLICT (snapshot_date) DO UPDATE
//       SET total_cases = EXCLUDED.total_cases,
//           total_value = EXCLUDED.total_value;
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
// Table: pending_debts
//   on_pending_debts_change: CREATE TRIGGER on_pending_debts_change AFTER INSERT OR DELETE OR UPDATE ON public.pending_debts FOR EACH STATEMENT EXECUTE FUNCTION trigger_record_snapshot()

// --- INDEXES ---
// Table: portfolio_history
//   CREATE UNIQUE INDEX portfolio_history_snapshot_date_key ON public.portfolio_history USING btree (snapshot_date)
// Table: profiles
//   CREATE INDEX profiles_color_idx ON public.profiles USING btree (color)
