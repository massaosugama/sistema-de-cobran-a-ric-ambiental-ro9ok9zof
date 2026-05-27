// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'access_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
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
      calendar_settings: {
        Row: {
          added_readers: string[] | null
          created_at: string
          date: string
          id: string
          ignored_readers: string[] | null
          is_working_day: boolean
          notes: string | null
          reader_statuses: Json | null
          updated_at: string
          vencimento_padrao: number | null
          weather_condition: string | null
        }
        Insert: {
          added_readers?: string[] | null
          created_at?: string
          date: string
          id?: string
          ignored_readers?: string[] | null
          is_working_day?: boolean
          notes?: string | null
          reader_statuses?: Json | null
          updated_at?: string
          vencimento_padrao?: number | null
          weather_condition?: string | null
        }
        Update: {
          added_readers?: string[] | null
          created_at?: string
          date?: string
          id?: string
          ignored_readers?: string[] | null
          is_working_day?: boolean
          notes?: string | null
          reader_statuses?: Json | null
          updated_at?: string
          vencimento_padrao?: number | null
          weather_condition?: string | null
        }
        Relationships: []
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
          queue_type: string | null
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
          queue_type?: string | null
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
          queue_type?: string | null
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
      daily_readings: {
        Row: {
          consumo_calculado: number | null
          consumo_real: number | null
          created_at: string
          critica: string | null
          data_apresentacao_documento: string | null
          data_criacao: string | null
          data_leitura_anterior: string | null
          data_leitura_calculada: string | null
          data_leitura_real: string | null
          data_referencia: string | null
          descricao_ligacao: string | null
          documento_id: string | null
          id: string
          leitura_anterior: number | null
          leitura_calculada: number | null
          leitura_id: string | null
          leitura_real: number | null
          localizacao_ligacao: string | null
          lote_medicao_id: string | null
          media_consumo: number | null
          ocorrencia_abreviada: string | null
          ocorrencia_id: string | null
          original_id: string | null
          situacao: string | null
          situacao_ligacao: string | null
          uc: string | null
          uc_id: string | null
          usuario_id: string | null
        }
        Insert: {
          consumo_calculado?: number | null
          consumo_real?: number | null
          created_at?: string
          critica?: string | null
          data_apresentacao_documento?: string | null
          data_criacao?: string | null
          data_leitura_anterior?: string | null
          data_leitura_calculada?: string | null
          data_leitura_real?: string | null
          data_referencia?: string | null
          descricao_ligacao?: string | null
          documento_id?: string | null
          id?: string
          leitura_anterior?: number | null
          leitura_calculada?: number | null
          leitura_id?: string | null
          leitura_real?: number | null
          localizacao_ligacao?: string | null
          lote_medicao_id?: string | null
          media_consumo?: number | null
          ocorrencia_abreviada?: string | null
          ocorrencia_id?: string | null
          original_id?: string | null
          situacao?: string | null
          situacao_ligacao?: string | null
          uc?: string | null
          uc_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          consumo_calculado?: number | null
          consumo_real?: number | null
          created_at?: string
          critica?: string | null
          data_apresentacao_documento?: string | null
          data_criacao?: string | null
          data_leitura_anterior?: string | null
          data_leitura_calculada?: string | null
          data_leitura_real?: string | null
          data_referencia?: string | null
          descricao_ligacao?: string | null
          documento_id?: string | null
          id?: string
          leitura_anterior?: number | null
          leitura_calculada?: number | null
          leitura_id?: string | null
          leitura_real?: number | null
          localizacao_ligacao?: string | null
          lote_medicao_id?: string | null
          media_consumo?: number | null
          ocorrencia_abreviada?: string | null
          ocorrencia_id?: string | null
          original_id?: string | null
          situacao?: string | null
          situacao_ligacao?: string | null
          uc?: string | null
          uc_id?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      daily_readings_summary: {
        Row: {
          day: string
          reader_stats: Json
          total_readings: number
          updated_at: string
        }
        Insert: {
          day: string
          reader_stats?: Json
          total_readings?: number
          updated_at?: string
        }
        Update: {
          day?: string
          reader_stats?: Json
          total_readings?: number
          updated_at?: string
        }
        Relationships: []
      }
      follow_up_tasks: {
        Row: {
          action: string | null
          assigned_by: string | null
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
          assigned_by?: string | null
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
          assigned_by?: string | null
          cod_pess_fat?: string | null
          completed?: boolean | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          operator_id?: string | null
          uc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'follow_up_tasks_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      gis_users: {
        Row: {
          celular: string | null
          created_at: string
          email: string | null
          id: string | null
          is_ativo: boolean | null
          is_leiturista: boolean | null
          is_visivel: boolean | null
          login: string | null
          nome: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          celular?: string | null
          created_at?: string
          email?: string | null
          id?: string | null
          is_ativo?: boolean | null
          is_leiturista?: boolean | null
          is_visivel?: boolean | null
          login?: string | null
          nome?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          celular?: string | null
          created_at?: string
          email?: string | null
          id?: string | null
          is_ativo?: boolean | null
          is_leiturista?: boolean | null
          is_visivel?: boolean | null
          login?: string | null
          nome?: string | null
          updated_at?: string
          usuario_id?: string
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
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: string | null
          file_name: string
          file_path: string
          id: string
          import_type: string
          processed_records: number | null
          started_at: string | null
          status: string
          total_records: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: string | null
          file_name: string
          file_path: string
          id?: string
          import_type: string
          processed_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: string | null
          file_name?: string
          file_path?: string
          id?: string
          import_type?: string
          processed_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      legal_queue: {
        Row: {
          cod_pess_fat: string
          created_at: string
          id: string
          operator_id: string | null
          snapshot_nome_cliente: string | null
          snapshot_qt_fats: number | null
          snapshot_valor_vencido: number | null
          status: string
          strategic_assignment_id: string | null
          uc: string
          updated_at: string | null
        }
        Insert: {
          cod_pess_fat: string
          created_at?: string
          id?: string
          operator_id?: string | null
          snapshot_nome_cliente?: string | null
          snapshot_qt_fats?: number | null
          snapshot_valor_vencido?: number | null
          status?: string
          strategic_assignment_id?: string | null
          uc: string
          updated_at?: string | null
        }
        Update: {
          cod_pess_fat?: string
          created_at?: string
          id?: string
          operator_id?: string | null
          snapshot_nome_cliente?: string | null
          snapshot_qt_fats?: number | null
          snapshot_valor_vencido?: number | null
          status?: string
          strategic_assignment_id?: string | null
          uc?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'legal_queue_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'legal_queue_strategic_assignment_id_fkey'
            columns: ['strategic_assignment_id']
            isOneToOne: false
            referencedRelation: 'strategic_assignments'
            referencedColumns: ['id']
          },
        ]
      }
      pending_debts: {
        Row: {
          cod_pess_fat: string
          dt_vencto_ref_mais_antiga: string | null
          dt_vencto_ref_mais_recente: string | null
          endereco: string | null
          is_active: boolean | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          proprietario_celular: string | null
          proprietario_cpf_cnpj: string | null
          proprietario_nome: string | null
          qt_fats: number | null
          qtd_os_total_cancel_devolv: number | null
          refs: string | null
          responsavel_celular: string | null
          responsavel_cpf_cnpj: string | null
          responsavel_nome: string | null
          setor: string | null
          situ_docto: string | null
          situacao_ligacao: string | null
          ta_nome_de_quem: string | null
          telefones_pesquisa: string | null
          tem_negociacao_vencida: boolean | null
          uc: string
          uc_repete: string | null
          ultima_data_criacao_os: string | null
          ultimo_disparo: string | null
          valor_a_vencer: number | null
          valor_retidas_em_aberto: number | null
          valor_total: number | null
          valor_vencido: number | null
          valor_vencido_neg_com_ativa: number | null
        }
        Insert: {
          cod_pess_fat: string
          dt_vencto_ref_mais_antiga?: string | null
          dt_vencto_ref_mais_recente?: string | null
          endereco?: string | null
          is_active?: boolean | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          proprietario_celular?: string | null
          proprietario_cpf_cnpj?: string | null
          proprietario_nome?: string | null
          qt_fats?: number | null
          qtd_os_total_cancel_devolv?: number | null
          refs?: string | null
          responsavel_celular?: string | null
          responsavel_cpf_cnpj?: string | null
          responsavel_nome?: string | null
          setor?: string | null
          situ_docto?: string | null
          situacao_ligacao?: string | null
          ta_nome_de_quem?: string | null
          telefones_pesquisa?: string | null
          tem_negociacao_vencida?: boolean | null
          uc: string
          uc_repete?: string | null
          ultima_data_criacao_os?: string | null
          ultimo_disparo?: string | null
          valor_a_vencer?: number | null
          valor_retidas_em_aberto?: number | null
          valor_total?: number | null
          valor_vencido?: number | null
          valor_vencido_neg_com_ativa?: number | null
        }
        Update: {
          cod_pess_fat?: string
          dt_vencto_ref_mais_antiga?: string | null
          dt_vencto_ref_mais_recente?: string | null
          endereco?: string | null
          is_active?: boolean | null
          pessoa_fatura_celular?: string | null
          pessoa_fatura_cpf_cnpj?: string | null
          pessoa_fatura_nome?: string | null
          proprietario_celular?: string | null
          proprietario_cpf_cnpj?: string | null
          proprietario_nome?: string | null
          qt_fats?: number | null
          qtd_os_total_cancel_devolv?: number | null
          refs?: string | null
          responsavel_celular?: string | null
          responsavel_cpf_cnpj?: string | null
          responsavel_nome?: string | null
          setor?: string | null
          situ_docto?: string | null
          situacao_ligacao?: string | null
          ta_nome_de_quem?: string | null
          telefones_pesquisa?: string | null
          tem_negociacao_vencida?: boolean | null
          uc?: string
          uc_repete?: string | null
          ultima_data_criacao_os?: string | null
          ultimo_disparo?: string | null
          valor_a_vencer?: number | null
          valor_retidas_em_aberto?: number | null
          valor_total?: number | null
          valor_vencido?: number | null
          valor_vencido_neg_com_ativa?: number | null
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
          total_corte_a_vencer: number | null
          total_corte_cases: number | null
          total_corte_retidas: number | null
          total_corte_retidas_cases: number | null
          total_corte_value: number | null
          total_corte_vencido: number | null
          total_estrat_a_vencer: number | null
          total_estrat_cases: number | null
          total_estrat_retidas: number | null
          total_estrat_retidas_cases: number | null
          total_estrat_value: number | null
          total_estrat_vencido: number | null
          total_jurid_a_vencer: number | null
          total_jurid_cases: number | null
          total_jurid_retidas: number | null
          total_jurid_retidas_cases: number | null
          total_jurid_value: number | null
          total_jurid_vencido: number | null
          total_lotes_a_vencer: number | null
          total_lotes_cases: number
          total_lotes_value: number
          total_lotes_vencido: number | null
          total_recorte_a_vencer: number | null
          total_recorte_cases: number | null
          total_recorte_retidas: number | null
          total_recorte_retidas_cases: number | null
          total_recorte_value: number | null
          total_recorte_vencido: number | null
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
          total_corte_a_vencer?: number | null
          total_corte_cases?: number | null
          total_corte_retidas?: number | null
          total_corte_retidas_cases?: number | null
          total_corte_value?: number | null
          total_corte_vencido?: number | null
          total_estrat_a_vencer?: number | null
          total_estrat_cases?: number | null
          total_estrat_retidas?: number | null
          total_estrat_retidas_cases?: number | null
          total_estrat_value?: number | null
          total_estrat_vencido?: number | null
          total_jurid_a_vencer?: number | null
          total_jurid_cases?: number | null
          total_jurid_retidas?: number | null
          total_jurid_retidas_cases?: number | null
          total_jurid_value?: number | null
          total_jurid_vencido?: number | null
          total_lotes_a_vencer?: number | null
          total_lotes_cases?: number
          total_lotes_value?: number
          total_lotes_vencido?: number | null
          total_recorte_a_vencer?: number | null
          total_recorte_cases?: number | null
          total_recorte_retidas?: number | null
          total_recorte_retidas_cases?: number | null
          total_recorte_value?: number | null
          total_recorte_vencido?: number | null
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
          total_corte_a_vencer?: number | null
          total_corte_cases?: number | null
          total_corte_retidas?: number | null
          total_corte_retidas_cases?: number | null
          total_corte_value?: number | null
          total_corte_vencido?: number | null
          total_estrat_a_vencer?: number | null
          total_estrat_cases?: number | null
          total_estrat_retidas?: number | null
          total_estrat_retidas_cases?: number | null
          total_estrat_value?: number | null
          total_estrat_vencido?: number | null
          total_jurid_a_vencer?: number | null
          total_jurid_cases?: number | null
          total_jurid_retidas?: number | null
          total_jurid_retidas_cases?: number | null
          total_jurid_value?: number | null
          total_jurid_vencido?: number | null
          total_lotes_a_vencer?: number | null
          total_lotes_cases?: number
          total_lotes_value?: number
          total_lotes_vencido?: number | null
          total_recorte_a_vencer?: number | null
          total_recorte_cases?: number | null
          total_recorte_retidas?: number | null
          total_recorte_retidas_cases?: number | null
          total_recorte_value?: number | null
          total_recorte_vencido?: number | null
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
          analyzed_at: string | null
          analyzed_by: string | null
          created_at: string
          id: string
          link: string | null
          order_index: number
          text: string
          theory: string | null
        }
        Insert: {
          analyzed_at?: string | null
          analyzed_by?: string | null
          created_at?: string
          id?: string
          link?: string | null
          order_index?: number
          text: string
          theory?: string | null
        }
        Update: {
          analyzed_at?: string | null
          analyzed_by?: string | null
          created_at?: string
          id?: string
          link?: string | null
          order_index?: number
          text?: string
          theory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'quotes_analyzed_by_fkey'
            columns: ['analyzed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reading_working_days_metrics: {
        Row: {
          created_at: string
          data_leitura_real: string
          data_referencia: string
          id: string
          uc: string
          updated_at: string
          working_day_index: number
        }
        Insert: {
          created_at?: string
          data_leitura_real: string
          data_referencia: string
          id?: string
          uc: string
          updated_at?: string
          working_day_index: number
        }
        Update: {
          created_at?: string
          data_leitura_real?: string
          data_referencia?: string
          id?: string
          uc?: string
          updated_at?: string
          working_day_index?: number
        }
        Relationships: []
      }
      researched_phones: {
        Row: {
          cod_pess_fat: string
          created_at: string
          id: string
          phones: Json
          uc: string
          updated_at: string
        }
        Insert: {
          cod_pess_fat: string
          created_at?: string
          id?: string
          phones?: Json
          uc: string
          updated_at?: string
        }
        Update: {
          cod_pess_fat?: string
          created_at?: string
          id?: string
          phones?: Json
          uc?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'researched_phones_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'pending_debts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
          {
            foreignKeyName: 'researched_phones_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'vw_pending_debts_with_contacts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
          {
            foreignKeyName: 'researched_phones_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'vw_queue_debts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
          {
            foreignKeyName: 'researched_phones_uc_cod_pess_fat_fkey'
            columns: ['uc', 'cod_pess_fat']
            isOneToOne: false
            referencedRelation: 'vw_terms_queue_debts'
            referencedColumns: ['uc', 'cod_pess_fat']
          },
        ]
      }
      serasa_blacklist: {
        Row: {
          cpf_cnpj: string
          created_at: string
          id: string
          nome: string | null
        }
        Insert: {
          cpf_cnpj: string
          created_at?: string
          id?: string
          nome?: string | null
        }
        Update: {
          cpf_cnpj?: string
          created_at?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      serasa_negativations: {
        Row: {
          baixado_aqui: boolean | null
          cpf_cnpj: string
          created_at: string
          data_baixa_aqui: string | null
          data_envio: string | null
          id: string
          nome: string
          num_contrato: string
          possui_debitos: boolean | null
          situacao: string
          ultima_verificacao: string | null
          valor: number
        }
        Insert: {
          baixado_aqui?: boolean | null
          cpf_cnpj: string
          created_at?: string
          data_baixa_aqui?: string | null
          data_envio?: string | null
          id?: string
          nome: string
          num_contrato: string
          possui_debitos?: boolean | null
          situacao: string
          ultima_verificacao?: string | null
          valor: number
        }
        Update: {
          baixado_aqui?: boolean | null
          cpf_cnpj?: string
          created_at?: string
          data_baixa_aqui?: string | null
          data_envio?: string | null
          id?: string
          nome?: string
          num_contrato?: string
          possui_debitos?: boolean | null
          situacao?: string
          ultima_verificacao?: string | null
          valor?: number
        }
        Relationships: []
      }
      serasa_workflow: {
        Row: {
          cod_pess_fat: string
          cpf_cnpj: string
          created_at: string
          id: string
          nome: string
          status: string
          uc: string
          updated_at: string
          valor_vencido: number
        }
        Insert: {
          cod_pess_fat: string
          cpf_cnpj: string
          created_at?: string
          id?: string
          nome: string
          status?: string
          uc: string
          updated_at?: string
          valor_vencido: number
        }
        Update: {
          cod_pess_fat?: string
          cpf_cnpj?: string
          created_at?: string
          id?: string
          nome?: string
          status?: string
          uc?: string
          updated_at?: string
          valor_vencido?: number
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
          qt_fats?: number | null
          refs?: string | null
          tipo_baixa?: string | null
          uc?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      strategic_assignments: {
        Row: {
          assigned_by: string | null
          cod_pess_fat: string
          completed_at: string | null
          created_at: string
          id: string
          images: Json | null
          operator_id: string | null
          parecer: string | null
          parecer_consumo: string | null
          parecer_imovel: string | null
          parecer_inloco: string | null
          parecer_negociacoes: string | null
          parecer_perfil_pagador: string | null
          pontos: number | null
          previous_queue: string | null
          previous_status: string | null
          queue_type: string
          snapshot_nome_cliente: string | null
          snapshot_qt_fats: number | null
          snapshot_refs: string | null
          snapshot_valor_total: number | null
          snapshot_valor_vencido: number | null
          started_at: string | null
          status: string
          telefones_localizados: string | null
          uc: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          cod_pess_fat: string
          completed_at?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          operator_id?: string | null
          parecer?: string | null
          parecer_consumo?: string | null
          parecer_imovel?: string | null
          parecer_inloco?: string | null
          parecer_negociacoes?: string | null
          parecer_perfil_pagador?: string | null
          pontos?: number | null
          previous_queue?: string | null
          previous_status?: string | null
          queue_type?: string
          snapshot_nome_cliente?: string | null
          snapshot_qt_fats?: number | null
          snapshot_refs?: string | null
          snapshot_valor_total?: number | null
          snapshot_valor_vencido?: number | null
          started_at?: string | null
          status?: string
          telefones_localizados?: string | null
          uc: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          cod_pess_fat?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          operator_id?: string | null
          parecer?: string | null
          parecer_consumo?: string | null
          parecer_imovel?: string | null
          parecer_inloco?: string | null
          parecer_negociacoes?: string | null
          parecer_perfil_pagador?: string | null
          pontos?: number | null
          previous_queue?: string | null
          previous_status?: string | null
          queue_type?: string
          snapshot_nome_cliente?: string | null
          snapshot_qt_fats?: number | null
          snapshot_refs?: string | null
          snapshot_valor_total?: number | null
          snapshot_valor_vencido?: number | null
          started_at?: string | null
          status?: string
          telefones_localizados?: string | null
          uc?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'strategic_assignments_assigned_by_fkey'
            columns: ['assigned_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'strategic_assignments_operator_id_fkey'
            columns: ['operator_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      strategic_assignments_backup: {
        Row: {
          backed_up_at: string | null
          cod_pess_fat: string | null
          id: string
          images: Json | null
          uc: string | null
        }
        Insert: {
          backed_up_at?: string | null
          cod_pess_fat?: string | null
          id: string
          images?: Json | null
          uc?: string | null
        }
        Update: {
          backed_up_at?: string | null
          cod_pess_fat?: string | null
          id?: string
          images?: Json | null
          uc?: string | null
        }
        Relationships: []
      }
      system_documentation: {
        Row: {
          content: string
          created_at: string
          id: string
          route: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          route: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          route?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_pending_debts_with_contacts: {
        Row: {
          cod_pess_fat: string | null
          contact_count: number | null
          dt_vencto_ref_mais_recente: string | null
          endereco: string | null
          latest_contact_date: string | null
          operator_ids: Json | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          proprietario_celular: string | null
          proprietario_cpf_cnpj: string | null
          proprietario_nome: string | null
          qt_fats: number | null
          qtd_os_total_cancel_devolv: number | null
          refs: string | null
          responsavel_celular: string | null
          responsavel_cpf_cnpj: string | null
          responsavel_nome: string | null
          setor: string | null
          situ_docto: string | null
          situacao_ligacao: string | null
          ta_nome_de_quem: string | null
          tem_negociacao_vencida: boolean | null
          uc: string | null
          uc_repete: string | null
          ultima_data_criacao_os: string | null
          valor_a_vencer: number | null
          valor_retidas_em_aberto: number | null
          valor_total: number | null
          valor_vencido: number | null
          valor_vencido_neg_com_ativa: number | null
        }
        Relationships: []
      }
      vw_queue_debts: {
        Row: {
          cod_pess_fat: string | null
          contact_count: number | null
          dt_vencto_ref_mais_recente: string | null
          endereco: string | null
          is_cut: boolean | null
          is_ferrule: boolean | null
          is_legal: boolean | null
          is_recut: boolean | null
          is_strategic: boolean | null
          latest_contact_date: string | null
          operator_ids: Json | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          proprietario_celular: string | null
          proprietario_cpf_cnpj: string | null
          proprietario_nome: string | null
          qt_fats: number | null
          qtd_os_total_cancel_devolv: number | null
          refs: string | null
          responsavel_celular: string | null
          responsavel_cpf_cnpj: string | null
          responsavel_nome: string | null
          setor: string | null
          situ_docto: string | null
          situacao_ligacao: string | null
          ta_nome_de_quem: string | null
          tem_negociacao_vencida: boolean | null
          uc: string | null
          uc_repete: string | null
          ultima_data_criacao_os: string | null
          valor_a_vencer: number | null
          valor_retidas_em_aberto: number | null
          valor_total: number | null
          valor_vencido: number | null
          valor_vencido_neg_com_ativa: number | null
        }
        Relationships: []
      }
      vw_terms_queue_debts: {
        Row: {
          cod_pess_fat: string | null
          contact_count: number | null
          dt_vencto_ref_mais_recente: string | null
          endereco: string | null
          has_termo: boolean | null
          is_cut: boolean | null
          is_ferrule: boolean | null
          is_legal: boolean | null
          is_recut: boolean | null
          is_strategic: boolean | null
          latest_contact_date: string | null
          operator_ids: Json | null
          pessoa_fatura_celular: string | null
          pessoa_fatura_cpf_cnpj: string | null
          pessoa_fatura_nome: string | null
          proprietario_celular: string | null
          proprietario_cpf_cnpj: string | null
          proprietario_nome: string | null
          qt_fats: number | null
          qtd_os_total_cancel_devolv: number | null
          refs: string | null
          responsavel_celular: string | null
          responsavel_cpf_cnpj: string | null
          responsavel_nome: string | null
          setor: string | null
          situ_docto: string | null
          situacao_ligacao: string | null
          ta_nome_de_quem: string | null
          tem_negociacao_vencida: boolean | null
          termo_date: string | null
          uc: string | null
          uc_repete: string | null
          ultima_data_criacao_os: string | null
          valor_a_vencer: number | null
          valor_retidas_em_aberto: number | null
          valor_total: number | null
          valor_vencido: number | null
          valor_vencido_neg_com_ativa: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_reader_status_range: {
        Args: {
          p_end_date: string
          p_reader_name: string
          p_start_date: string
          p_status: string
        }
        Returns: undefined
      }
      bulk_update_ultimo_disparo: {
        Args: { payload: Json }
        Returns: undefined
      }
      check_needs_recalculation: { Args: { p_month: string }; Returns: boolean }
      cleanup_old_settlements: { Args: never; Returns: undefined }
      delete_daily_readings_by_reference: {
        Args: { p_data_ref: string }
        Returns: Json
      }
      delete_invalid_debts_batch: { Args: { p_records: Json }; Returns: Json }
      execute_post_import_routines: { Args: never; Returns: undefined }
      get_all_readers: { Args: never; Returns: Json }
      get_assignable_debts: {
        Args: {
          p_limit?: number
          p_lotes?: string
          p_max_value?: number
          p_min_value?: number
          p_offset?: number
          p_periods?: string[]
          p_retidas?: string
          p_search_address?: string
          p_search_text?: string
          p_situacao_ligacao?: string
        }
        Returns: {
          cod_pess_fat: string
          latest_contact_date: string
          pessoa_fatura_nome: string
          qt_fats: number
          qtd_os_total_cancel_devolv: number
          refs: string
          tem_negociacao_vencida: boolean
          uc: string
          ultima_data_criacao_os: string
          valor_total: number
          valor_vencido: number
        }[]
      }
      get_billing_routes_stats: { Args: never; Returns: Json }
      get_cadastral_debts: {
        Args: {
          p_filter_type: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_desc?: boolean
          p_search?: string
        }
        Returns: {
          cod_pess_fat: string
          pessoa_fatura_celular: string
          pessoa_fatura_cpf_cnpj: string
          pessoa_fatura_nome: string
          qt_fats: number
          total_count: number
          uc: string
          valor_total: number
          valor_vencido: number
        }[]
      }
      get_daily_readings_by_day: { Args: { p_month: string }; Returns: Json }
      get_daily_readings_evolution: { Args: never; Returns: Json }
      get_daily_readings_references: {
        Args: never
        Returns: {
          data_ref: string
          referencia: string
        }[]
      }
      get_dashboard_evolution: { Args: { tz?: string }; Returns: Json }
      get_devedores_a_negativar: {
        Args: {
          p_blacklist_filter?: string
          p_limit?: number
          p_offset?: number
          p_order_by?: string
          p_order_desc?: boolean
          p_periods?: string[]
          p_search?: string
          p_situ_docto?: string[]
        }
        Returns: {
          cod_pess_fat: string
          cpf_cnpj: string
          nome: string
          qt_fats: number
          total_count: number
          uc: string
          valor_vencido: number
        }[]
      }
      get_distinct_refs: {
        Args: never
        Returns: {
          ref: string
        }[]
      }
      get_invalid_debts_for_audit: {
        Args: never
        Returns: {
          cod_pess_fat: string
          duplicate_status: string
          is_active: boolean
          issue_type: string
          pessoa_fatura_nome: string
          refs: string
          uc: string
        }[]
      }
      get_negotiations_summary: { Args: never; Returns: Json }
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
      get_overview_dashboard: { Args: never; Returns: Json }
      get_portfolio_stats: { Args: never; Returns: Json }
      get_readers_by_day: { Args: { p_month: string }; Returns: Json }
      get_reading_rhythm_comparison: {
        Args: { p_current_month: string; p_references: string[] }
        Returns: Json
      }
      get_reading_rhythm_day_details: {
        Args: {
          p_current_month: string
          p_date_label: string
          p_references: string[]
        }
        Returns: Json
      }
      get_reading_rhythm_ruler: {
        Args: { p_current_month: string; p_references?: string[] }
        Returns: Json
      }
      get_reading_rhythm_status: { Args: { p_month?: string }; Returns: Json }
      get_regularized_assignments: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          cod_pess_fat: string
          created_at: string
          id: string
          images: Json
          snapshot_nome_cliente: string
          status: string
          total_count: number
          uc: string
        }[]
      }
      get_researched_phones: {
        Args: never
        Returns: {
          cod_pess_fat: string
          created_at: string
          id: string
          pessoa_fatura_nome: string
          phones: Json
          uc: string
          ultimo_disparo: string
          valor_total: number
        }[]
      }
      get_researched_phones_paginated: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          cod_pess_fat: string
          created_at: string
          id: string
          pessoa_fatura_cpf_cnpj: string
          pessoa_fatura_nome: string
          phones: Json
          total_count: number
          uc: string
          ultimo_disparo: string
          valor_total: number
        }[]
      }
      get_serasa_cross_reference: {
        Args: {
          p_baixado_aqui?: boolean
          p_cpf_cnpj?: string
          p_end_date?: string
          p_limit?: number
          p_max_value?: number
          p_min_value?: number
          p_offset?: number
          p_possui_debitos?: boolean
          p_start_date?: string
        }
        Returns: {
          baixado_aqui: boolean
          cpf_cnpj: string
          created_at: string
          data_baixa_aqui: string
          data_envio: string
          id: string
          is_blacklisted: boolean
          nome: string
          num_contrato: string
          possui_debitos: boolean
          situacao: string
          ultima_verificacao: string
          valor: number
        }[]
      }
      get_strategic_dashboard_data: { Args: never; Returns: Json }
      process_conversions: { Args: never; Returns: undefined }
      recalculate_working_days_metrics: {
        Args: { p_month: string }
        Returns: undefined
      }
      record_portfolio_snapshot: { Args: never; Returns: undefined }
      refresh_daily_readings_summary: {
        Args: { p_month: string }
        Returns: undefined
      }
      remove_duplicate_settlements: { Args: never; Returns: Json }
      revert_billing_dispatches: { Args: { p_date: string }; Returns: Json }
      truncate_pending_debts: { Args: never; Returns: undefined }
      uc_numeric:
        | {
            Args: { rec: Database['public']['Tables']['pending_debts']['Row'] }
            Returns: number
          }
        | {
            Args: {
              vw: Database['public']['Views']['vw_pending_debts_with_contacts']['Row']
            }
            Returns: {
              error: true
            } & 'Could not choose the best candidate function between: public.uc_numeric(vw => vw_pending_debts_with_contacts), public.uc_numeric(vw => vw_queue_debts), public.uc_numeric(vw => vw_terms_queue_debts). Try renaming the parameters or the function itself in the database so function overloading can be resolved'
          }
        | {
            Args: { vw: Database['public']['Views']['vw_queue_debts']['Row'] }
            Returns: {
              error: true
            } & 'Could not choose the best candidate function between: public.uc_numeric(vw => vw_pending_debts_with_contacts), public.uc_numeric(vw => vw_queue_debts), public.uc_numeric(vw => vw_terms_queue_debts). Try renaming the parameters or the function itself in the database so function overloading can be resolved'
          }
        | {
            Args: {
              vw: Database['public']['Views']['vw_terms_queue_debts']['Row']
            }
            Returns: {
              error: true
            } & 'Could not choose the best candidate function between: public.uc_numeric(vw => vw_pending_debts_with_contacts), public.uc_numeric(vw => vw_queue_debts), public.uc_numeric(vw => vw_terms_queue_debts). Try renaming the parameters or the function itself in the database so function overloading can be resolved'
          }
      update_serasa_debts_status: { Args: never; Returns: undefined }
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
// Table: access_logs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   created_at: timestamp with time zone (not null, default: now())
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
// Table: calendar_settings
//   id: uuid (not null, default: gen_random_uuid())
//   date: date (not null)
//   is_working_day: boolean (not null, default: true)
//   notes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   vencimento_padrao: integer (nullable)
//   ignored_readers: _text (nullable, default: '{}'::text[])
//   added_readers: _text (nullable, default: '{}'::text[])
//   reader_statuses: jsonb (nullable, default: '{}'::jsonb)
//   weather_condition: text (nullable, default: 'normal'::text)
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
//   queue_type: text (nullable)
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
// Table: daily_readings
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   leitura_id: text (nullable)
//   data_criacao: timestamp with time zone (nullable)
//   usuario_id: text (nullable)
//   uc_id: text (nullable)
//   situacao_ligacao: text (nullable)
//   descricao_ligacao: text (nullable)
//   data_referencia: timestamp with time zone (nullable)
//   leitura_anterior: numeric (nullable)
//   data_leitura_anterior: timestamp with time zone (nullable)
//   leitura_real: numeric (nullable)
//   data_leitura_real: timestamp with time zone (nullable)
//   consumo_real: numeric (nullable)
//   leitura_calculada: numeric (nullable)
//   data_leitura_calculada: timestamp with time zone (nullable)
//   consumo_calculado: numeric (nullable)
//   media_consumo: numeric (nullable)
//   critica: text (nullable)
//   ocorrencia_id: text (nullable)
//   documento_id: text (nullable)
//   situacao: text (nullable)
//   localizacao_ligacao: text (nullable)
//   lote_medicao_id: text (nullable)
//   data_apresentacao_documento: timestamp with time zone (nullable)
//   original_id: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   ocorrencia_abreviada: text (nullable)
// Table: daily_readings_summary
//   day: date (not null)
//   total_readings: integer (not null, default: 0)
//   reader_stats: jsonb (not null, default: '{}'::jsonb)
//   updated_at: timestamp with time zone (not null, default: now())
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
//   assigned_by: uuid (nullable)
// Table: gis_users
//   id: uuid (nullable, default: gen_random_uuid())
//   usuario_id: text (not null)
//   login: text (nullable)
//   is_visivel: boolean (nullable)
//   is_ativo: boolean (nullable)
//   nome: text (nullable)
//   celular: text (nullable)
//   email: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   is_leiturista: boolean (nullable, default: false)
// Table: import_history
//   id: uuid (not null, default: gen_random_uuid())
//   created_at: timestamp with time zone (not null, default: now())
//   table_name: text (not null)
//   total_records: integer (not null, default: 0)
//   inserted_records: integer (not null, default: 0)
//   ignored_records: integer (not null, default: 0)
//   latest_record_date: timestamp with time zone (nullable)
// Table: import_jobs
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   import_type: text (not null)
//   file_name: text (not null)
//   file_path: text (not null)
//   status: text (not null, default: 'pending'::text)
//   total_records: integer (nullable, default: 0)
//   processed_records: integer (nullable, default: 0)
//   error_details: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   started_at: timestamp with time zone (nullable)
//   completed_at: timestamp with time zone (nullable)
// Table: legal_queue
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   cod_pess_fat: text (not null)
//   strategic_assignment_id: uuid (nullable)
//   status: text (not null, default: 'a_encaminhar'::text)
//   operator_id: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (nullable)
//   snapshot_valor_vencido: numeric (nullable)
//   snapshot_qt_fats: integer (nullable)
//   snapshot_nome_cliente: text (nullable)
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
//   is_active: boolean (nullable, default: true)
//   dt_vencto_ref_mais_recente: date (nullable)
//   ultimo_disparo: timestamp with time zone (nullable)
//   dt_vencto_ref_mais_antiga: date (nullable)
//   situacao_ligacao: text (nullable)
//   telefones_pesquisa: text (nullable)
//   tem_negociacao_vencida: boolean (nullable, default: false)
//   valor_vencido_neg_com_ativa: numeric (nullable, default: 0)
//   qtd_os_total_cancel_devolv: integer (nullable)
//   ultima_data_criacao_os: date (nullable)
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
//   total_lotes_vencido: numeric (nullable, default: 0)
//   total_lotes_a_vencer: numeric (nullable, default: 0)
//   total_estrat_cases: integer (nullable, default: 0)
//   total_estrat_value: numeric (nullable, default: 0)
//   total_estrat_vencido: numeric (nullable, default: 0)
//   total_estrat_a_vencer: numeric (nullable, default: 0)
//   total_estrat_retidas: integer (nullable, default: 0)
//   total_estrat_retidas_cases: integer (nullable, default: 0)
//   total_jurid_cases: integer (nullable, default: 0)
//   total_jurid_value: numeric (nullable, default: 0)
//   total_jurid_vencido: numeric (nullable, default: 0)
//   total_jurid_a_vencer: numeric (nullable, default: 0)
//   total_jurid_retidas: integer (nullable, default: 0)
//   total_jurid_retidas_cases: integer (nullable, default: 0)
//   total_corte_cases: integer (nullable, default: 0)
//   total_corte_value: numeric (nullable, default: 0)
//   total_corte_vencido: numeric (nullable, default: 0)
//   total_corte_a_vencer: numeric (nullable, default: 0)
//   total_corte_retidas: numeric (nullable, default: 0)
//   total_corte_retidas_cases: integer (nullable, default: 0)
//   total_recorte_cases: integer (nullable, default: 0)
//   total_recorte_value: numeric (nullable, default: 0)
//   total_recorte_vencido: numeric (nullable, default: 0)
//   total_recorte_a_vencer: numeric (nullable, default: 0)
//   total_recorte_retidas: numeric (nullable, default: 0)
//   total_recorte_retidas_cases: integer (nullable, default: 0)
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
//   analyzed_by: uuid (nullable)
//   analyzed_at: date (nullable)
// Table: reading_working_days_metrics
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   data_referencia: date (not null)
//   data_leitura_real: date (not null)
//   working_day_index: integer (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: researched_phones
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   cod_pess_fat: text (not null)
//   phones: jsonb (not null, default: '[]'::jsonb)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: serasa_blacklist
//   id: uuid (not null, default: gen_random_uuid())
//   cpf_cnpj: text (not null)
//   nome: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: serasa_negativations
//   id: uuid (not null, default: gen_random_uuid())
//   cpf_cnpj: text (not null)
//   nome: text (not null)
//   num_contrato: text (not null)
//   valor: numeric (not null)
//   data_envio: date (nullable)
//   situacao: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   ultima_verificacao: timestamp with time zone (nullable)
//   possui_debitos: boolean (nullable)
//   baixado_aqui: boolean (nullable, default: false)
//   data_baixa_aqui: timestamp with time zone (nullable)
// Table: serasa_workflow
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   cod_pess_fat: text (not null)
//   cpf_cnpj: text (not null)
//   nome: text (not null)
//   valor_vencido: numeric (not null)
//   status: text (not null, default: 'sendo_negativado'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: settlements
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (nullable)
//   qt_fats: integer (nullable)
//   tipo_baixa: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (nullable)
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
// Table: strategic_assignments
//   id: uuid (not null, default: gen_random_uuid())
//   uc: text (not null)
//   cod_pess_fat: text (not null)
//   operator_id: uuid (nullable)
//   assigned_by: uuid (nullable)
//   status: text (not null, default: 'pending'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   started_at: timestamp with time zone (nullable)
//   completed_at: timestamp with time zone (nullable)
//   snapshot_valor_vencido: numeric (nullable)
//   snapshot_qt_fats: integer (nullable)
//   snapshot_refs: text (nullable)
//   snapshot_valor_total: numeric (nullable)
//   snapshot_nome_cliente: text (nullable)
//   parecer: text (nullable)
//   pontos: integer (nullable, default: 0)
//   parecer_consumo: text (nullable)
//   telefones_localizados: text (nullable)
//   images: jsonb (nullable, default: '[]'::jsonb)
//   parecer_imovel: text (nullable)
//   queue_type: text (not null, default: 'strategic'::text)
//   previous_queue: text (nullable)
//   previous_status: text (nullable)
//   updated_at: timestamp with time zone (nullable, default: now())
//   parecer_inloco: text (nullable)
//   parecer_perfil_pagador: text (nullable)
//   parecer_negociacoes: text (nullable)
// Table: strategic_assignments_backup
//   id: uuid (not null)
//   uc: text (nullable)
//   cod_pess_fat: text (nullable)
//   images: jsonb (nullable)
//   backed_up_at: timestamp with time zone (nullable, default: now())
// Table: system_documentation
//   id: uuid (not null, default: gen_random_uuid())
//   route: text (not null)
//   title: text (not null)
//   content: text (not null)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: vw_pending_debts_with_contacts
//   uc: text (nullable)
//   setor: text (nullable)
//   endereco: text (nullable)
//   uc_repete: text (nullable)
//   ta_nome_de_quem: text (nullable)
//   qt_fats: integer (nullable)
//   situ_docto: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (nullable)
//   pessoa_fatura_nome: text (nullable)
//   pessoa_fatura_cpf_cnpj: text (nullable)
//   pessoa_fatura_celular: text (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_cpf_cnpj: text (nullable)
//   proprietario_celular: text (nullable)
//   responsavel_nome: text (nullable)
//   responsavel_cpf_cnpj: text (nullable)
//   responsavel_celular: text (nullable)
//   valor_vencido: numeric (nullable)
//   valor_a_vencer: numeric (nullable)
//   valor_retidas_em_aberto: numeric (nullable)
//   valor_vencido_neg_com_ativa: numeric (nullable)
//   dt_vencto_ref_mais_recente: date (nullable)
//   situacao_ligacao: text (nullable)
//   tem_negociacao_vencida: boolean (nullable)
//   qtd_os_total_cancel_devolv: integer (nullable)
//   ultima_data_criacao_os: date (nullable)
//   latest_contact_date: timestamp with time zone (nullable)
//   operator_ids: jsonb (nullable)
//   contact_count: bigint (nullable)
// Table: vw_queue_debts
//   uc: text (nullable)
//   setor: text (nullable)
//   endereco: text (nullable)
//   uc_repete: text (nullable)
//   ta_nome_de_quem: text (nullable)
//   qt_fats: integer (nullable)
//   situ_docto: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (nullable)
//   pessoa_fatura_nome: text (nullable)
//   pessoa_fatura_cpf_cnpj: text (nullable)
//   pessoa_fatura_celular: text (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_cpf_cnpj: text (nullable)
//   proprietario_celular: text (nullable)
//   responsavel_nome: text (nullable)
//   responsavel_cpf_cnpj: text (nullable)
//   responsavel_celular: text (nullable)
//   valor_vencido: numeric (nullable)
//   valor_a_vencer: numeric (nullable)
//   valor_retidas_em_aberto: numeric (nullable)
//   valor_vencido_neg_com_ativa: numeric (nullable)
//   dt_vencto_ref_mais_recente: date (nullable)
//   situacao_ligacao: text (nullable)
//   tem_negociacao_vencida: boolean (nullable)
//   qtd_os_total_cancel_devolv: integer (nullable)
//   ultima_data_criacao_os: date (nullable)
//   latest_contact_date: timestamp with time zone (nullable)
//   operator_ids: jsonb (nullable)
//   contact_count: bigint (nullable)
//   is_strategic: boolean (nullable)
//   is_legal: boolean (nullable)
//   is_cut: boolean (nullable)
//   is_recut: boolean (nullable)
//   is_ferrule: boolean (nullable)
// Table: vw_terms_queue_debts
//   uc: text (nullable)
//   setor: text (nullable)
//   endereco: text (nullable)
//   uc_repete: text (nullable)
//   ta_nome_de_quem: text (nullable)
//   qt_fats: integer (nullable)
//   situ_docto: text (nullable)
//   valor_total: numeric (nullable)
//   refs: text (nullable)
//   cod_pess_fat: text (nullable)
//   pessoa_fatura_nome: text (nullable)
//   pessoa_fatura_cpf_cnpj: text (nullable)
//   pessoa_fatura_celular: text (nullable)
//   proprietario_nome: text (nullable)
//   proprietario_cpf_cnpj: text (nullable)
//   proprietario_celular: text (nullable)
//   responsavel_nome: text (nullable)
//   responsavel_cpf_cnpj: text (nullable)
//   responsavel_celular: text (nullable)
//   valor_vencido: numeric (nullable)
//   valor_a_vencer: numeric (nullable)
//   valor_retidas_em_aberto: numeric (nullable)
//   valor_vencido_neg_com_ativa: numeric (nullable)
//   dt_vencto_ref_mais_recente: date (nullable)
//   situacao_ligacao: text (nullable)
//   tem_negociacao_vencida: boolean (nullable)
//   qtd_os_total_cancel_devolv: integer (nullable)
//   ultima_data_criacao_os: date (nullable)
//   latest_contact_date: timestamp with time zone (nullable)
//   operator_ids: jsonb (nullable)
//   contact_count: bigint (nullable)
//   is_strategic: boolean (nullable)
//   is_legal: boolean (nullable)
//   is_cut: boolean (nullable)
//   is_recut: boolean (nullable)
//   is_ferrule: boolean (nullable)
//   has_termo: boolean (nullable)
//   termo_date: timestamp with time zone (nullable)

// --- CONSTRAINTS ---
// Table: access_logs
//   PRIMARY KEY access_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY access_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
// Table: app_settings
//   PRIMARY KEY app_settings_pkey: PRIMARY KEY (key)
// Table: cadastral_updates
//   PRIMARY KEY cadastral_updates_pkey: PRIMARY KEY (id)
//   FOREIGN KEY cadastral_updates_requester_id_fkey: FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY cadastral_updates_resolver_id_fkey: FOREIGN KEY (resolver_id) REFERENCES profiles(id) ON DELETE SET NULL
// Table: calendar_settings
//   UNIQUE calendar_settings_date_key: UNIQUE (date)
//   PRIMARY KEY calendar_settings_pkey: PRIMARY KEY (id)
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
//   FOREIGN KEY contact_results_settlement_id_fkey: FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE SET NULL
// Table: daily_readings
//   PRIMARY KEY daily_readings_pkey: PRIMARY KEY (id)
// Table: daily_readings_summary
//   PRIMARY KEY daily_readings_summary_pkey: PRIMARY KEY (day)
// Table: follow_up_tasks
//   FOREIGN KEY follow_up_tasks_assigned_by_fkey: FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY follow_up_tasks_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES auth.users(id) ON DELETE SET NULL
//   PRIMARY KEY follow_up_tasks_pkey: PRIMARY KEY (id)
// Table: gis_users
//   PRIMARY KEY gis_users_pkey: PRIMARY KEY (usuario_id)
// Table: import_history
//   PRIMARY KEY import_history_pkey: PRIMARY KEY (id)
// Table: import_jobs
//   PRIMARY KEY import_jobs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY import_jobs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
// Table: legal_queue
//   FOREIGN KEY legal_queue_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY legal_queue_pkey: PRIMARY KEY (id)
//   FOREIGN KEY legal_queue_strategic_assignment_id_fkey: FOREIGN KEY (strategic_assignment_id) REFERENCES strategic_assignments(id) ON DELETE SET NULL
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
//   FOREIGN KEY quotes_analyzed_by_fkey: FOREIGN KEY (analyzed_by) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY quotes_pkey: PRIMARY KEY (id)
// Table: reading_working_days_metrics
//   PRIMARY KEY reading_working_days_metrics_pkey: PRIMARY KEY (id)
//   UNIQUE reading_working_days_metrics_uc_data_referencia_key: UNIQUE (uc, data_referencia)
// Table: researched_phones
//   PRIMARY KEY researched_phones_pkey: PRIMARY KEY (id)
//   FOREIGN KEY researched_phones_uc_cod_pess_fat_fkey: FOREIGN KEY (uc, cod_pess_fat) REFERENCES pending_debts(uc, cod_pess_fat) ON DELETE CASCADE
// Table: serasa_blacklist
//   UNIQUE serasa_blacklist_cpf_cnpj_key: UNIQUE (cpf_cnpj)
//   PRIMARY KEY serasa_blacklist_pkey: PRIMARY KEY (id)
// Table: serasa_negativations
//   UNIQUE serasa_negativations_cpf_cnpj_num_contrato_key: UNIQUE (cpf_cnpj, num_contrato)
//   PRIMARY KEY serasa_negativations_pkey: PRIMARY KEY (id)
// Table: serasa_workflow
//   PRIMARY KEY serasa_workflow_pkey: PRIMARY KEY (id)
//   UNIQUE serasa_workflow_uc_cod_pess_fat_key: UNIQUE (uc, cod_pess_fat)
// Table: settlements
//   PRIMARY KEY settlements_pkey: PRIMARY KEY (id)
// Table: strategic_assignments
//   FOREIGN KEY strategic_assignments_assigned_by_fkey: FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL
//   FOREIGN KEY strategic_assignments_operator_id_fkey: FOREIGN KEY (operator_id) REFERENCES profiles(id) ON DELETE SET NULL
//   PRIMARY KEY strategic_assignments_pkey: PRIMARY KEY (id)
// Table: strategic_assignments_backup
//   PRIMARY KEY strategic_assignments_backup_pkey: PRIMARY KEY (id)
// Table: system_documentation
//   PRIMARY KEY system_documentation_pkey: PRIMARY KEY (id)
//   UNIQUE system_documentation_route_key: UNIQUE (route)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: access_logs
//   Policy "authenticated_insert_access_logs" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "authenticated_select_access_logs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: app_settings
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: cadastral_updates
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: calendar_settings
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
// Table: daily_readings
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: daily_readings_summary
//   Policy "authenticated_all_summary" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "authenticated_select_summary" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: follow_up_tasks
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: gis_users
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: import_history
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: import_jobs
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: legal_queue
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
// Table: reading_working_days_metrics
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: researched_phones
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: serasa_blacklist
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: serasa_negativations
//   Policy "authenticated_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((COALESCE(profiles.role, 'consultas'::text) <> 'consultas'::text) OR (profiles.is_admin = true)))))
//   Policy "authenticated_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((COALESCE(profiles.role, 'consultas'::text) <> 'consultas'::text) OR (profiles.is_admin = true)))))
//   Policy "authenticated_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "authenticated_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((COALESCE(profiles.role, 'consultas'::text) <> 'consultas'::text) OR (profiles.is_admin = true)))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((COALESCE(profiles.role, 'consultas'::text) <> 'consultas'::text) OR (profiles.is_admin = true)))))
// Table: serasa_workflow
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: settlements
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: strategic_assignments
//   Policy "authenticated_all" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: system_documentation
//   Policy "admin_delete_system_documentation" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::text) OR (profiles.is_admin = true)))))
//   Policy "admin_insert_system_documentation" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::text) OR (profiles.is_admin = true)))))
//   Policy "admin_update_system_documentation" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::text) OR (profiles.is_admin = true)))))
//     WITH CHECK: (EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND ((profiles.role = 'admin'::text) OR (profiles.is_admin = true)))))
//   Policy "authenticated_select_system_documentation" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - strategic_assignments_backup

// --- DATABASE FUNCTIONS ---
// FUNCTION apply_reader_status_range(text, text, date, date)
//   CREATE OR REPLACE FUNCTION public.apply_reader_status_range(p_reader_name text, p_status text, p_start_date date, p_end_date date)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_date date;
//   BEGIN
//     FOR v_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date LOOP
//       INSERT INTO public.calendar_settings (date, is_working_day, reader_statuses, updated_at)
//       VALUES (v_date, true, jsonb_build_object(p_reader_name, p_status), NOW())
//       ON CONFLICT (date) DO UPDATE
//       SET reader_statuses = COALESCE(calendar_settings.reader_statuses, '{}'::jsonb) || jsonb_build_object(p_reader_name, p_status),
//           updated_at = NOW();
//     END LOOP;
//   END;
//   $function$
//
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
// FUNCTION bulk_update_ultimo_disparo(jsonb)
//   CREATE OR REPLACE FUNCTION public.bulk_update_ultimo_disparo(payload jsonb)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     row record;
//   BEGIN
//     FOR row IN SELECT * FROM jsonb_to_recordset(payload) AS x(uc text, cod_pess_fat text, ultimo_disparo timestamptz) LOOP
//       UPDATE public.pending_debts
//       SET ultimo_disparo = row.ultimo_disparo
//       WHERE uc = row.uc AND cod_pess_fat = row.cod_pess_fat;
//     END LOOP;
//   END;
//   $function$
//
// FUNCTION check_needs_recalculation(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.check_needs_recalculation(p_month timestamp with time zone)
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_start_date DATE;
//     v_end_date DATE;
//     v_start_ts TIMESTAMP WITH TIME ZONE;
//     v_end_ts TIMESTAMP WITH TIME ZONE;
//     v_last_calc TIMESTAMPTZ;
//     v_last_setting TIMESTAMPTZ;
//     v_last_reading TIMESTAMPTZ;
//     v_calc_count INT;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
//     v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
//
//     v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
//     v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
//
//     -- Verifica o último cálculo feito para as leituras que ocorreram neste mês
//     SELECT COUNT(*), MAX(updated_at)
//     INTO v_calc_count, v_last_calc
//     FROM public.reading_working_days_metrics
//     WHERE data_leitura_real >= v_start_date AND data_leitura_real <= v_end_date;
//
//     -- Se não há nenhum cálculo para o mês
//     IF v_calc_count = 0 THEN
//       -- verifica se tem leituras
//       IF EXISTS (
//         SELECT 1 FROM public.daily_readings
//         WHERE data_leitura_real >= v_start_ts
//           AND data_leitura_real < v_end_ts
//       ) THEN
//         RETURN true;
//       ELSE
//         RETURN false; -- sem leituras, não tem o que recalcular
//       END IF;
//     END IF;
//
//     -- Verifica a última alteração nas configurações do calendário neste mês
//     SELECT MAX(updated_at)
//     INTO v_last_setting
//     FROM public.calendar_settings
//     WHERE date >= v_start_date AND date <= v_end_date;
//
//     -- Se a última alteração no calendário for mais recente que o último cálculo, precisa recalcular
//     IF v_last_setting IS NOT NULL AND v_last_setting > v_last_calc THEN
//       RETURN true;
//     END IF;
//
//     -- Verifica a última inserção/atualização de leituras neste mês
//     SELECT MAX(created_at)
//     INTO v_last_reading
//     FROM public.daily_readings
//     WHERE data_leitura_real >= v_start_ts AND data_leitura_real < v_end_ts;
//
//     IF v_last_reading IS NOT NULL AND v_last_reading > v_last_calc THEN
//       RETURN true;
//     END IF;
//
//     RETURN false;
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
// FUNCTION delete_daily_readings_by_reference(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.delete_daily_readings_by_reference(p_data_ref timestamp with time zone)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     deleted_count INT := 0;
//   BEGIN
//     WITH to_delete AS (
//       SELECT id FROM public.daily_readings
//       WHERE date_trunc('month', data_referencia AT TIME ZONE 'UTC') = date_trunc('month', p_data_ref AT TIME ZONE 'UTC')
//     )
//     DELETE FROM public.daily_readings
//     WHERE id IN (SELECT id FROM to_delete);
//
//     GET DIAGNOSTICS deleted_count = ROW_COUNT;
//     RETURN json_build_object('deleted_count', deleted_count);
//   END;
//   $function$
//
// FUNCTION delete_invalid_debts_batch(jsonb)
//   CREATE OR REPLACE FUNCTION public.delete_invalid_debts_batch(p_records jsonb)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     deleted_count INT := 0;
//   BEGIN
//     WITH to_delete AS (
//       SELECT x.uc, x.cod_pess_fat
//       FROM jsonb_to_recordset(p_records) AS x(uc text, cod_pess_fat text)
//     )
//     DELETE FROM public.pending_debts pd
//     USING to_delete
//     WHERE pd.uc = to_delete.uc AND pd.cod_pess_fat = to_delete.cod_pess_fat;
//
//     GET DIAGNOSTICS deleted_count = ROW_COUNT;
//     RETURN json_build_object('deleted_count', deleted_count);
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
//
//     -- 3º: Atualização das métricas de dias úteis (mês atual e anterior para garantir histórico atualizado)
//     PERFORM public.recalculate_working_days_metrics(NOW());
//     PERFORM public.recalculate_working_days_metrics(NOW() - INTERVAL '1 month');
//
//     -- 4º: Atualização da tabela de resumo diário
//     PERFORM public.refresh_daily_readings_summary(NOW());
//     PERFORM public.refresh_daily_readings_summary(NOW() - INTERVAL '1 month');
//   END;
//   $function$
//
// FUNCTION get_all_readers()
//   CREATE OR REPLACE FUNCTION public.get_all_readers()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     SELECT COALESCE(json_agg(
//       json_build_object(
//         'usuario_id', u.usuario_id,
//         'nome', COALESCE(u.nome, u.usuario_id)
//       )
//     ), '[]'::json) INTO result
//     FROM public.gis_users u
//     ORDER BY COALESCE(u.nome, u.usuario_id);
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_assignable_debts(numeric, numeric, text[], text, text, text, text, text, integer, integer)
//   CREATE OR REPLACE FUNCTION public.get_assignable_debts(p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_periods text[] DEFAULT NULL::text[], p_search_text text DEFAULT NULL::text, p_search_address text DEFAULT NULL::text, p_lotes text DEFAULT 'com_ligacoes'::text, p_retidas text DEFAULT 'sem_retidas'::text, p_situacao_ligacao text DEFAULT 'todos'::text, p_limit integer DEFAULT 500, p_offset integer DEFAULT 0)
//    RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, valor_total numeric, valor_vencido numeric, qt_fats integer, refs text, latest_contact_date timestamp with time zone, tem_negociacao_vencida boolean, qtd_os_total_cancel_devolv integer, ultima_data_criacao_os date)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT
//       pd.uc,
//       pd.cod_pess_fat,
//       pd.pessoa_fatura_nome,
//       pd.valor_total,
//       pd.valor_vencido,
//       pd.qt_fats,
//       pd.refs,
//       vw.latest_contact_date,
//       pd.tem_negociacao_vencida,
//       pd.qtd_os_total_cancel_devolv,
//       pd.ultima_data_criacao_os
//     FROM public.pending_debts pd
//     LEFT JOIN public.vw_pending_debts_with_contacts vw ON vw.uc = pd.uc AND vw.cod_pess_fat = pd.cod_pess_fat
//     WHERE pd.is_active = true
//       AND (p_min_value IS NULL OR pd.valor_vencido >= p_min_value)
//       AND (p_max_value IS NULL OR pd.valor_vencido <= p_max_value)
//       AND (
//         p_periods IS NULL
//         OR array_length(p_periods, 1) IS NULL
//         OR EXISTS (
//           SELECT 1 FROM unnest(p_periods) per
//           WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
//         )
//       )
//       AND (
//         p_search_text IS NULL
//         OR p_search_text = ''
//         OR pd.uc ILIKE '%' || p_search_text || '%'
//         OR pd.pessoa_fatura_nome ILIKE '%' || p_search_text || '%'
//         OR pd.pessoa_fatura_cpf_cnpj ILIKE '%' || p_search_text || '%'
//       )
//       AND (
//         p_search_address IS NULL
//         OR p_search_address = ''
//         OR pd.endereco ILIKE '%' || p_search_address || '%'
//       )
//       AND (
//         p_lotes = 'ambos'
//         OR (p_lotes = 'com_ligacoes' AND COALESCE(pd.setor, '') != '4036')
//         OR (p_lotes = 'so_lotes' AND COALESCE(pd.setor, '') = '4036')
//       )
//       AND (
//         p_retidas = 'ambos'
//         OR (p_retidas = 'com_retidas' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0)
//         OR (p_retidas = 'sem_retidas' AND COALESCE(pd.valor_retidas_em_aberto, 0) = 0)
//       )
//       AND (
//         p_situacao_ligacao = 'todos'
//         OR (p_situacao_ligacao = 'susp_deb' AND pd.situacao_ligacao = 'SUSP_DEB')
//         OR (p_situacao_ligacao = 'ativo' AND pd.situacao_ligacao = 'ATIVO')
//       )
//       AND NOT EXISTS (
//         SELECT 1 FROM public.strategic_assignments sa
//         WHERE sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat
//         AND (
//           (sa.queue_type = 'strategic' AND sa.status IN ('pending', 'started')) OR
//           (sa.queue_type = 'legal' AND sa.status IN ('a_encaminhar', 'encaminhado')) OR
//           (sa.queue_type = 'cut' AND sa.status IN ('para_abrir_os', 'os_corte_aberta')) OR
//           (sa.queue_type = 'recut' AND sa.status IN ('para_abrir_os', 'os_recorte_aberta')) OR
//           (sa.queue_type = 'ferrule' AND sa.status IN ('para_abrir_os', 'os_ferrule_aberta')) OR
//           (sa.queue_type = 'non_effective_cut' AND sa.status IN ('s1_telefones', 's2_pesquisa', 's3_sem_dados', 's4_manual'))
//         )
//       )
//     ORDER BY pd.valor_vencido DESC NULLS LAST
//     LIMIT p_limit OFFSET p_offset;
//   END;
//   $function$
//
// FUNCTION get_billing_routes_stats()
//   CREATE OR REPLACE FUNCTION public.get_billing_routes_stats()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     WITH route_stats AS (
//       SELECT
//         NULLIF(split_part(localizacao_ligacao, '.', 3), '') as route,
//         NULLIF(split_part(localizacao_ligacao, '.', 2), '') as cycle,
//         count(*) as expected_ucs,
//         count(*) FILTER (WHERE data_leitura_real IS NOT NULL) as read_ucs,
//         MAX(data_leitura_calculada) as max_deadline
//       FROM public.daily_readings
//       WHERE localizacao_ligacao IS NOT NULL
//       GROUP BY split_part(localizacao_ligacao, '.', 3), split_part(localizacao_ligacao, '.', 2)
//     ),
//     enriched AS (
//       SELECT
//         route,
//         cycle,
//         expected_ucs,
//         read_ucs,
//         CASE WHEN expected_ucs > 0 THEN ROUND((read_ucs::numeric / expected_ucs::numeric) * 100, 0)::int ELSE 0 END as percentage,
//         COALESCE(EXTRACT(DAY FROM (max_deadline - CURRENT_DATE))::int, 0) as remaining_days
//       FROM route_stats
//       WHERE route IS NOT NULL AND cycle IS NOT NULL
//     ),
//     final_routes AS (
//       SELECT
//         gen_random_uuid() as id,
//         'R-' || route as route,
//         'Ciclo ' || cycle as cycle,
//         expected_ucs as "expectedUcs",
//         read_ucs as "readUcs",
//         percentage,
//         remaining_days as "remainingDays",
//         CASE
//           WHEN percentage = 0 AND remaining_days >= 0 THEN 'Não Iniciada'
//           WHEN percentage = 100 THEN 'Concluída'
//           WHEN remaining_days < 0 AND percentage < 100 THEN 'Atrasada'
//           WHEN remaining_days <= 2 AND percentage < 100 THEN 'Prazo Curto'
//           ELSE 'Em Andamento'
//         END as criticality
//       FROM enriched
//       ORDER BY remaining_days ASC, percentage ASC
//     )
//     SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result FROM final_routes r;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_cadastral_debts(text, text, text, boolean, integer, integer)
//   CREATE OR REPLACE FUNCTION public.get_cadastral_debts(p_filter_type text, p_search text DEFAULT NULL::text, p_order_by text DEFAULT 'valor_vencido'::text, p_order_desc boolean DEFAULT true, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
//    RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, pessoa_fatura_cpf_cnpj text, pessoa_fatura_celular text, valor_total numeric, valor_vencido numeric, qt_fats integer, total_count bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_sql text;
//     v_where text := 'is_active = true';
//   BEGIN
//     IF p_filter_type = 'no_phone' THEN
//       v_where := v_where || ' AND (COALESCE(pessoa_fatura_celular, '''') = '''' AND COALESCE(proprietario_celular, '''') = '''' AND COALESCE(responsavel_celular, '''') = '''')';
//     ELSIF p_filter_type = 'invalid_doc' THEN
//       v_where := v_where || ' AND (pessoa_fatura_cpf_cnpj IS NULL OR pessoa_fatura_cpf_cnpj = '''' OR LENGTH(REGEXP_REPLACE(pessoa_fatura_cpf_cnpj, ''[^0-9]'', '''', ''g'')) NOT IN (11, 14))';
//     END IF;
//
//     IF p_search IS NOT NULL AND p_search <> '' THEN
//       v_where := v_where || ' AND (uc ILIKE ''%'' || p_search || ''%'' OR pessoa_fatura_nome ILIKE ''%'' || p_search || ''%'' OR pessoa_fatura_cpf_cnpj ILIKE ''%'' || p_search || ''%'')';
//     END IF;
//
//     v_sql := 'WITH filtered AS (
//                 SELECT uc, cod_pess_fat, pessoa_fatura_nome, pessoa_fatura_cpf_cnpj, pessoa_fatura_celular, valor_total, valor_vencido, qt_fats
//                 FROM public.pending_debts
//                 WHERE ' || v_where || '
//               )
//               SELECT *, (SELECT count(*) FROM filtered) AS total_count
//               FROM filtered
//               ORDER BY ' || quote_ident(p_order_by) || CASE WHEN p_order_desc THEN ' DESC NULLS LAST' ELSE ' ASC NULLS LAST' END || '
//               LIMIT ' || p_limit || ' OFFSET ' || p_offset;
//
//     RETURN QUERY EXECUTE v_sql;
//   END;
//   $function$
//
// FUNCTION get_daily_readings_by_day(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_daily_readings_by_day(p_month timestamp with time zone)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//     v_start_ts timestamp with time zone;
//     v_end_ts timestamp with time zone;
//     v_start_date date;
//     v_end_date date;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
//     v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;
//
//     v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
//     v_end_ts := (v_end_date + interval '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
//
//     WITH calendar AS (
//       SELECT d::date as cal_date
//       FROM generate_series(v_start_date, LEAST(v_end_date, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
//       WHERE NOT EXISTS (
//         SELECT 1 FROM public.calendar_settings cs
//         WHERE cs.date = d::date AND cs.is_working_day = false
//       )
//     ),
//     daily_stats AS (
//       SELECT
//         (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date as read_date,
//         COUNT(dr.id) as total_read
//       FROM public.daily_readings dr
//       WHERE dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
//       GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date
//     ),
//     combined AS (
//       SELECT
//         to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
//         COALESCE(ds.total_read, 0) as total_read
//       FROM calendar c
//       LEFT JOIN daily_stats ds ON ds.read_date = c.cal_date
//       ORDER BY c.cal_date ASC
//     )
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM combined t;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_daily_readings_evolution()
//   CREATE OR REPLACE FUNCTION public.get_daily_readings_evolution()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     WITH monthly_stats AS (
//       SELECT
//         to_char(data_referencia AT TIME ZONE 'UTC', 'MM/YYYY') as month_label,
//         date_trunc('month', data_referencia AT TIME ZONE 'UTC') as ref_date,
//         COUNT(*) as total_expected,
//         COUNT(data_leitura_real) as total_read
//       FROM public.daily_readings
//       WHERE data_referencia IS NOT NULL
//       GROUP BY to_char(data_referencia AT TIME ZONE 'UTC', 'MM/YYYY'), date_trunc('month', data_referencia AT TIME ZONE 'UTC')
//       ORDER BY ref_date ASC
//     )
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM monthly_stats t;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_daily_readings_references()
//   CREATE OR REPLACE FUNCTION public.get_daily_readings_references()
//    RETURNS TABLE(referencia text, data_ref text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT DISTINCT
//       to_char(data_referencia, 'MM/YYYY') as referencia,
//       to_char(data_referencia, 'YYYY-MM-DD') as data_ref
//     FROM public.reading_working_days_metrics
//     WHERE data_referencia IS NOT NULL
//     ORDER BY data_ref DESC;
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
//     curr_updates bigint;
//     prev_updates bigint;
//     pending_updates bigint;
//     today_date date := date(now() AT TIME ZONE tz);
//   BEGIN
//     SELECT
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true) as total_cases,
//       COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_a_vencer,
//       COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0) as total_retidas,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true) as total_retidas_cases,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true) as total_lotes_cases,
//       COALESCE(sum(pd.valor_total) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0) as total_lotes_a_vencer,
//
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic') as total_estrat_cases,
//       COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_a_vencer,
//       COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0) as total_estrat_retidas,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'strategic') as total_estrat_retidas_cases,
//
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal') as total_jurid_cases,
//       COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_a_vencer,
//       COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0) as total_jurid_retidas,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'legal') as total_jurid_retidas_cases,
//
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut') as total_corte_cases,
//       COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_a_vencer,
//       COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0) as total_corte_retidas,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'cut') as total_corte_retidas_cases,
//
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut') as total_recorte_cases,
//       COALESCE(sum(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_value,
//       COALESCE(sum(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_vencido,
//       COALESCE(sum(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_a_vencer,
//       COALESCE(sum(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0) as total_recorte_retidas,
//       count(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'recut') as total_recorte_retidas_cases
//
//     INTO curr_portfolio
//     FROM public.pending_debts pd
//     LEFT JOIN LATERAL (
//       SELECT queue_type
//       FROM public.strategic_assignments
//       WHERE uc = pd.uc AND cod_pess_fat = pd.cod_pess_fat
//         AND (
//           (queue_type = 'strategic' AND status IN ('pending', 'started')) OR
//           (queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) OR
//           (queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) OR
//           (queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta'))
//         )
//       LIMIT 1
//     ) sa ON true;
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
//     SELECT count(*) INTO curr_updates FROM public.cadastral_updates WHERE status = 'completed';
//     SELECT count(*) INTO pending_updates FROM public.cadastral_updates WHERE status = 'pending';
//
//     SELECT count(*) INTO prev_contacts
//     FROM public.contact_history
//     WHERE date(created_at AT TIME ZONE tz) < today_date;
//
//     SELECT count(*) INTO prev_followups
//     FROM public.follow_up_tasks
//     WHERE date(created_at AT TIME ZONE tz) < today_date;
//
//     SELECT count(*) INTO prev_updates
//     FROM public.cadastral_updates
//     WHERE status = 'completed' AND date(resolved_at AT TIME ZONE tz) < today_date;
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
//            'total_lotes_value', curr_portfolio.total_lotes_value,
//            'total_lotes_vencido', curr_portfolio.total_lotes_vencido,
//            'total_lotes_a_vencer', curr_portfolio.total_lotes_a_vencer,
//            'total_estrat_cases', curr_portfolio.total_estrat_cases,
//            'total_estrat_value', curr_portfolio.total_estrat_value,
//            'total_estrat_vencido', curr_portfolio.total_estrat_vencido,
//            'total_estrat_a_vencer', curr_portfolio.total_estrat_a_vencer,
//            'total_estrat_retidas', curr_portfolio.total_estrat_retidas,
//            'total_estrat_retidas_cases', curr_portfolio.total_estrat_retidas_cases,
//            'total_jurid_cases', curr_portfolio.total_jurid_cases,
//            'total_jurid_value', curr_portfolio.total_jurid_value,
//            'total_jurid_vencido', curr_portfolio.total_jurid_vencido,
//            'total_jurid_a_vencer', curr_portfolio.total_jurid_a_vencer,
//            'total_jurid_retidas', curr_portfolio.total_jurid_retidas,
//            'total_jurid_retidas_cases', curr_portfolio.total_jurid_retidas_cases,
//            'total_corte_cases', curr_portfolio.total_corte_cases,
//            'total_corte_value', curr_portfolio.total_corte_value,
//            'total_corte_vencido', curr_portfolio.total_corte_vencido,
//            'total_corte_a_vencer', curr_portfolio.total_corte_a_vencer,
//            'total_corte_retidas', curr_portfolio.total_corte_retidas,
//            'total_corte_retidas_cases', curr_portfolio.total_corte_retidas_cases,
//            'total_recorte_cases', curr_portfolio.total_recorte_cases,
//            'total_recorte_value', curr_portfolio.total_recorte_value,
//            'total_recorte_vencido', curr_portfolio.total_recorte_vencido,
//            'total_recorte_a_vencer', curr_portfolio.total_recorte_a_vencer,
//            'total_recorte_retidas', curr_portfolio.total_recorte_retidas,
//            'total_recorte_retidas_cases', curr_portfolio.total_recorte_retidas_cases
//          ),
//          'previous', json_build_object(
//            'total_cases', COALESCE(prev_portfolio.total_cases, curr_portfolio.total_cases),
//            'total_value', COALESCE(prev_portfolio.total_value, curr_portfolio.total_value),
//            'total_vencido', COALESCE(prev_portfolio.total_vencido, curr_portfolio.total_vencido),
//            'total_a_vencer', COALESCE(prev_portfolio.total_a_vencer, curr_portfolio.total_a_vencer),
//            'total_retidas', COALESCE(prev_portfolio.total_retidas, curr_portfolio.total_retidas),
//            'total_retidas_cases', COALESCE(prev_portfolio.total_retidas_cases, curr_portfolio.total_retidas_cases),
//            'total_lotes_cases', COALESCE(prev_portfolio.total_lotes_cases, curr_portfolio.total_lotes_cases),
//            'total_lotes_value', COALESCE(prev_portfolio.total_lotes_value, curr_portfolio.total_lotes_value),
//            'total_lotes_vencido', COALESCE(prev_portfolio.total_lotes_vencido, curr_portfolio.total_lotes_vencido),
//            'total_lotes_a_vencer', COALESCE(prev_portfolio.total_lotes_a_vencer, curr_portfolio.total_lotes_a_vencer),
//            'total_estrat_cases', COALESCE(prev_portfolio.total_estrat_cases, curr_portfolio.total_estrat_cases),
//            'total_estrat_value', COALESCE(prev_portfolio.total_estrat_value, curr_portfolio.total_estrat_value),
//            'total_estrat_vencido', COALESCE(prev_portfolio.total_estrat_vencido, curr_portfolio.total_estrat_vencido),
//            'total_estrat_a_vencer', COALESCE(prev_portfolio.total_estrat_a_vencer, curr_portfolio.total_estrat_a_vencer),
//            'total_estrat_retidas', COALESCE(prev_portfolio.total_estrat_retidas, curr_portfolio.total_estrat_retidas),
//            'total_estrat_retidas_cases', COALESCE(prev_portfolio.total_estrat_retidas_cases, curr_portfolio.total_estrat_retidas_cases),
//            'total_jurid_cases', COALESCE(prev_portfolio.total_jurid_cases, curr_portfolio.total_jurid_cases),
//            'total_jurid_value', COALESCE(prev_portfolio.total_jurid_value, curr_portfolio.total_jurid_value),
//            'total_jurid_vencido', COALESCE(prev_portfolio.total_jurid_vencido, curr_portfolio.total_jurid_vencido),
//            'total_jurid_a_vencer', COALESCE(prev_portfolio.total_jurid_a_vencer, curr_portfolio.total_jurid_a_vencer),
//            'total_jurid_retidas', COALESCE(prev_portfolio.total_jurid_retidas, curr_portfolio.total_jurid_retidas),
//            'total_jurid_retidas_cases', COALESCE(prev_portfolio.total_jurid_retidas_cases, curr_portfolio.total_jurid_retidas_cases),
//            'total_corte_cases', COALESCE(prev_portfolio.total_corte_cases, curr_portfolio.total_corte_cases),
//            'total_corte_value', COALESCE(prev_portfolio.total_corte_value, curr_portfolio.total_corte_value),
//            'total_corte_vencido', COALESCE(prev_portfolio.total_corte_vencido, curr_portfolio.total_corte_vencido),
//            'total_corte_a_vencer', COALESCE(prev_portfolio.total_corte_a_vencer, curr_portfolio.total_corte_a_vencer),
//            'total_corte_retidas', COALESCE(prev_portfolio.total_corte_retidas, curr_portfolio.total_corte_retidas),
//            'total_corte_retidas_cases', COALESCE(prev_portfolio.total_corte_retidas_cases, curr_portfolio.total_corte_retidas_cases),
//            'total_recorte_cases', COALESCE(prev_portfolio.total_recorte_cases, curr_portfolio.total_recorte_cases),
//            'total_recorte_value', COALESCE(prev_portfolio.total_recorte_value, curr_portfolio.total_recorte_value),
//            'total_recorte_vencido', COALESCE(prev_portfolio.total_recorte_vencido, curr_portfolio.total_recorte_vencido),
//            'total_recorte_a_vencer', COALESCE(prev_portfolio.total_recorte_a_vencer, curr_portfolio.total_recorte_a_vencer),
//            'total_recorte_retidas', COALESCE(prev_portfolio.total_recorte_retidas, curr_portfolio.total_recorte_retidas),
//            'total_recorte_retidas_cases', COALESCE(prev_portfolio.total_recorte_retidas_cases, curr_portfolio.total_recorte_retidas_cases)
//          )
//       ),
//       'productivity', json_build_object(
//          'current', json_build_object(
//            'contacts', curr_contacts,
//            'followups', curr_followups,
//            'updates', curr_updates,
//            'pending_updates', pending_updates
//          ),
//          'previous', json_build_object(
//            'contacts', prev_contacts,
//            'followups', prev_followups,
//            'updates', prev_updates,
//            'pending_updates', 0
//          )
//       )
//     ) INTO result;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_devedores_a_negativar(text, integer, integer, text[], text, boolean, text[], text)
//   CREATE OR REPLACE FUNCTION public.get_devedores_a_negativar(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_situ_docto text[] DEFAULT ARRAY['pend'::text], p_order_by text DEFAULT 'valor_vencido'::text, p_order_desc boolean DEFAULT true, p_periods text[] DEFAULT NULL::text[], p_blacklist_filter text DEFAULT 'sem'::text)
//    RETURNS TABLE(uc text, cod_pess_fat text, cpf_cnpj text, nome text, valor_vencido numeric, qt_fats integer, total_count bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     WITH blacklisted AS (
//       SELECT regexp_replace(b.cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf
//       FROM public.serasa_blacklist b
//     ),
//     base_debts AS (
//       SELECT
//         pd.uc, pd.cod_pess_fat,
//         REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf_cnpj,
//         pd.pessoa_fatura_nome as nome, pd.valor_vencido, pd.qt_fats, pd.situ_docto, pd.refs
//       FROM public.pending_debts pd
//       WHERE pd.is_active = true
//         AND pd.valor_vencido > 0
//         AND (
//           p_search IS NULL OR p_search = ''
//           OR pd.uc ILIKE '%' || p_search || '%'
//           OR pd.pessoa_fatura_nome ILIKE '%' || p_search || '%'
//           OR pd.pessoa_fatura_cpf_cnpj ILIKE '%' || p_search || '%'
//         )
//         AND (
//           p_situ_docto IS NULL OR array_length(p_situ_docto, 1) IS NULL OR pd.situ_docto = ANY(p_situ_docto)
//         )
//         AND (
//           p_periods IS NULL
//           OR array_length(p_periods, 1) IS NULL
//           OR EXISTS (
//             SELECT 1 FROM unnest(p_periods) per
//             WHERE pd.refs ~ ('(?:^|\s)''?' || per || '(?:\s|$)')
//           )
//         )
//     ),
//     filtered AS (
//       SELECT b.*
//       FROM base_debts b
//       WHERE LENGTH(b.clean_cpf_cnpj) IN (11, 14)
//         AND NOT EXISTS (
//           SELECT 1 FROM public.serasa_workflow sw
//           WHERE sw.uc = b.uc AND sw.cod_pess_fat = b.cod_pess_fat
//         )
//         AND NOT EXISTS (
//           SELECT 1 FROM public.serasa_negativations sn
//           WHERE REGEXP_REPLACE(sn.cpf_cnpj, '[^0-9]', '', 'g') = b.clean_cpf_cnpj
//         )
//         AND (
//           p_blacklist_filter = 'ambos' OR
//           (p_blacklist_filter = 'sem' AND NOT EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = b.clean_cpf_cnpj)) OR
//           (p_blacklist_filter = 'so' AND EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = b.clean_cpf_cnpj))
//         )
//     )
//     SELECT
//       f.uc, f.cod_pess_fat, f.clean_cpf_cnpj as cpf_cnpj, f.nome, f.valor_vencido, f.qt_fats,
//       COUNT(*) OVER() AS total_count
//     FROM filtered f
//     ORDER BY
//       CASE WHEN p_order_by = 'uc' AND p_order_desc THEN f.uc END DESC NULLS LAST,
//       CASE WHEN p_order_by = 'uc' AND NOT p_order_desc THEN f.uc END ASC NULLS LAST,
//       CASE WHEN p_order_by = 'nome' AND p_order_desc THEN f.nome END DESC NULLS LAST,
//       CASE WHEN p_order_by = 'nome' AND NOT p_order_desc THEN f.nome END ASC NULLS LAST,
//       CASE WHEN p_order_by = 'cpf_cnpj' AND p_order_desc THEN f.clean_cpf_cnpj END DESC NULLS LAST,
//       CASE WHEN p_order_by = 'cpf_cnpj' AND NOT p_order_desc THEN f.clean_cpf_cnpj END ASC NULLS LAST,
//       CASE WHEN p_order_by = 'qt_fats' AND p_order_desc THEN f.qt_fats END DESC NULLS LAST,
//       CASE WHEN p_order_by = 'qt_fats' AND NOT p_order_desc THEN f.qt_fats END ASC NULLS LAST,
//       CASE WHEN p_order_by = 'valor_vencido' AND p_order_desc THEN f.valor_vencido END DESC NULLS LAST,
//       CASE WHEN p_order_by = 'valor_vencido' AND NOT p_order_desc THEN f.valor_vencido END ASC NULLS LAST,
//       f.valor_vencido DESC
//     LIMIT p_limit OFFSET p_offset;
//   END;
//   $function$
//
// FUNCTION get_distinct_refs()
//   CREATE OR REPLACE FUNCTION public.get_distinct_refs()
//    RETURNS TABLE(ref text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     WITH all_refs AS (
//       SELECT unnest(regexp_split_to_array(trim(refs), '\s+')) as r
//       FROM public.pending_debts
//       WHERE refs IS NOT NULL AND refs != ''
//     ),
//     cleaned_refs AS (
//       SELECT DISTINCT
//         CASE WHEN r LIKE '''%' THEN substring(r from 2) ELSE r END as clean_ref
//       FROM all_refs
//       WHERE r != ''
//     )
//     SELECT clean_ref
//     FROM cleaned_refs
//     ORDER BY
//       CASE WHEN clean_ref = 'NEG' THEN 1 ELSE 0 END,
//       clean_ref DESC;
//   END;
//   $function$
//
// FUNCTION get_invalid_debts_for_audit()
//   CREATE OR REPLACE FUNCTION public.get_invalid_debts_for_audit()
//    RETURNS TABLE(uc text, cod_pess_fat text, pessoa_fatura_nome text, refs text, is_active boolean, issue_type text, duplicate_status text)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     WITH all_debts AS (
//       SELECT
//         d.uc,
//         d.cod_pess_fat,
//         d.pessoa_fatura_nome,
//         d.refs,
//         COALESCE(d.is_active, true) as is_active,
//         (
//           d.refs IS NOT NULL
//           AND trim(d.refs) != ''
//           AND NOT EXISTS (
//             SELECT 1 FROM unnest(regexp_split_to_array(trim(d.refs), '\s+')) AS t
//             WHERE t !~ '^''?(NEG|[0-9]{2}/[0-9]{2})'
//           )
//           AND d.refs NOT LIKE '%0.00%'
//         ) AS is_valid
//       FROM public.pending_debts d
//     )
//     SELECT
//       a.uc,
//       a.cod_pess_fat,
//       a.pessoa_fatura_nome,
//       a.refs,
//       a.is_active,
//       CASE
//         WHEN a.refs LIKE '%0.00%' THEN 'Valor Zerado no REFS'::text
//         WHEN a.is_active = false THEN 'Inativo com Ref Inválida'::text
//         ELSE 'Ativo com Ref Inválida'::text
//       END as issue_type,
//       COALESCE((
//         SELECT CASE
//                  WHEN bool_or(b.is_active = true) THEN 'active'::text
//                  ELSE 'inactive'::text
//                END
//         FROM all_debts b
//         WHERE b.uc = a.uc
//           AND b.is_valid = true
//       ), 'none'::text) as duplicate_status
//     FROM all_debts a
//     WHERE a.is_valid = false
//     ORDER BY a.uc, a.is_active DESC;
//   END;
//   $function$
//
// FUNCTION get_negotiations_summary()
//   CREATE OR REPLACE FUNCTION public.get_negotiations_summary()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     SELECT json_build_object(
//       'total_vencido', COALESCE(SUM(valor_vencido_neg_com_ativa) FILTER (WHERE is_active = true), 0),
//       'total_cases_vencidos', COUNT(*) FILTER (WHERE is_active = true AND valor_vencido_neg_com_ativa > 0),
//       'total_cases_neg', COUNT(*) FILTER (WHERE is_active = true AND refs ILIKE '%NEG%'),
//       'total_cases', COUNT(*) FILTER (WHERE is_active = true AND refs ILIKE '%NEG%')
//     ) INTO result
//     FROM public.pending_debts;
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
// FUNCTION get_overview_dashboard()
//   CREATE OR REPLACE FUNCTION public.get_overview_dashboard()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//   BEGIN
//     WITH active_assignments AS (
//       SELECT uc, cod_pess_fat, queue_type
//       FROM public.strategic_assignments
//       WHERE
//         (queue_type = 'strategic' AND status IN ('pending', 'started')) OR
//         (queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) OR
//         (queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) OR
//         (queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta'))
//     ),
//     base_data AS (
//       SELECT
//         pd.valor_total,
//         pd.valor_vencido,
//         pd.valor_a_vencer,
//         pd.valor_retidas_em_aberto,
//         pd.setor,
//         sa.queue_type as q_type
//       FROM public.pending_debts pd
//       LEFT JOIN active_assignments sa ON sa.uc = pd.uc AND sa.cod_pess_fat = pd.cod_pess_fat
//       WHERE pd.is_active = true
//     )
//     SELECT json_build_object(
//       'total', json_build_object(
//         'valor_vencido', SUM(valor_vencido),
//         'valor_a_vencer', SUM(valor_a_vencer),
//         'valor_total', SUM(valor_total),
//         'valor_retidas', SUM(valor_retidas_em_aberto)
//       ),
//       'lotes', json_build_object(
//         'valor_vencido', SUM(valor_vencido) FILTER (WHERE COALESCE(setor, '') = '4036'),
//         'valor_a_vencer', SUM(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') = '4036'),
//         'valor_total', SUM(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036'),
//         'valor_retidas', SUM(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') = '4036')
//       ),
//       'estrategica', json_build_object(
//         'valor_vencido', SUM(valor_vencido) FILTER (WHERE q_type = 'strategic' AND COALESCE(setor, '') != '4036'),
//         'valor_a_vencer', SUM(valor_a_vencer) FILTER (WHERE q_type = 'strategic' AND COALESCE(setor, '') != '4036'),
//         'valor_total', SUM(valor_total) FILTER (WHERE q_type = 'strategic' AND COALESCE(setor, '') != '4036'),
//         'valor_retidas', SUM(valor_retidas_em_aberto) FILTER (WHERE q_type = 'strategic' AND COALESCE(setor, '') != '4036')
//       ),
//       'juridico', json_build_object(
//         'valor_vencido', SUM(valor_vencido) FILTER (WHERE q_type = 'legal' AND COALESCE(setor, '') != '4036'),
//         'valor_a_vencer', SUM(valor_a_vencer) FILTER (WHERE q_type = 'legal' AND COALESCE(setor, '') != '4036'),
//         'valor_total', SUM(valor_total) FILTER (WHERE q_type = 'legal' AND COALESCE(setor, '') != '4036'),
//         'valor_retidas', SUM(valor_retidas_em_aberto) FILTER (WHERE q_type = 'legal' AND COALESCE(setor, '') != '4036')
//       ),
//       'corte', json_build_object(
//         'valor_vencido', SUM(valor_vencido) FILTER (WHERE q_type = 'cut' AND COALESCE(setor, '') != '4036'),
//         'valor_a_vencer', SUM(valor_a_vencer) FILTER (WHERE q_type = 'cut' AND COALESCE(setor, '') != '4036'),
//         'valor_total', SUM(valor_total) FILTER (WHERE q_type = 'cut' AND COALESCE(setor, '') != '4036'),
//         'valor_retidas', SUM(valor_retidas_em_aberto) FILTER (WHERE q_type = 'cut' AND COALESCE(setor, '') != '4036')
//       ),
//       'recorte', json_build_object(
//         'valor_vencido', SUM(valor_vencido) FILTER (WHERE q_type = 'recut' AND COALESCE(setor, '') != '4036'),
//         'valor_a_vencer', SUM(valor_a_vencer) FILTER (WHERE q_type = 'recut' AND COALESCE(setor, '') != '4036'),
//         'valor_total', SUM(valor_total) FILTER (WHERE q_type = 'recut' AND COALESCE(setor, '') != '4036'),
//         'valor_retidas', SUM(valor_retidas_em_aberto) FILTER (WHERE q_type = 'recut' AND COALESCE(setor, '') != '4036')
//       )
//     ) INTO result FROM base_data;
//
//     RETURN result;
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
//       'total_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND is_active = true),
//       'total_value', COALESCE(sum(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(setor, '') != '4036' AND is_active = true), 0),
//       'total_vencido', COALESCE(sum(valor_vencido) FILTER (WHERE COALESCE(setor, '') != '4036' AND is_active = true), 0),
//       'total_a_vencer', COALESCE(sum(valor_a_vencer) FILTER (WHERE COALESCE(setor, '') != '4036' AND is_active = true), 0),
//       'total_retidas', COALESCE(sum(valor_retidas_em_aberto) FILTER (WHERE COALESCE(setor, '') != '4036' AND is_active = true), 0),
//       'total_retidas_cases', count(*) FILTER (WHERE COALESCE(setor, '') != '4036' AND COALESCE(valor_retidas_em_aberto, 0) > 0 AND is_active = true),
//       'total_lotes_cases', count(*) FILTER (WHERE COALESCE(setor, '') = '4036' AND is_active = true),
//       'total_lotes_value', COALESCE(sum(valor_total) FILTER (WHERE COALESCE(setor, '') = '4036' AND is_active = true), 0)
//     ) INTO result
//     FROM public.pending_debts;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_readers_by_day(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_readers_by_day(p_month timestamp with time zone)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//     v_start_ts timestamp with time zone;
//     v_end_ts timestamp with time zone;
//     v_start_date date;
//     v_end_date date;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::date;
//     v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;
//
//     v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
//     v_end_ts := (v_end_date + interval '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
//
//     WITH calendar AS (
//       SELECT d::date as cal_date
//       FROM generate_series(v_start_date, LEAST(v_end_date, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
//       WHERE NOT EXISTS (
//         SELECT 1 FROM public.calendar_settings cs
//         WHERE cs.date = d::date AND cs.is_working_day = false
//       )
//     ),
//     daily_readers AS (
//       SELECT
//         (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date as cal_date,
//         dr.usuario_id,
//         COUNT(dr.id) as total_read
//       FROM public.daily_readings dr
//       WHERE dr.usuario_id IS NOT NULL AND dr.usuario_id != ''
//         AND dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
//       GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::date, dr.usuario_id
//     ),
//     aggregated AS (
//       SELECT
//         to_char(c.cal_date, 'YYYY-MM-DD') as date_label,
//         COALESCE(
//           json_agg(json_build_object('usuario_id', dr.usuario_id, 'total_read', dr.total_read)) FILTER (WHERE dr.usuario_id IS NOT NULL),
//           '[]'::json
//         ) as readers
//       FROM calendar c
//       LEFT JOIN daily_readers dr ON dr.cal_date = c.cal_date
//       GROUP BY c.cal_date
//       ORDER BY c.cal_date ASC
//     )
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM aggregated t;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_reading_rhythm_comparison(timestamp with time zone, date[])
//   CREATE OR REPLACE FUNCTION public.get_reading_rhythm_comparison(p_current_month timestamp with time zone, p_references date[])
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET statement_timeout TO '120s'
//   AS $function$
//   DECLARE
//     result json;
//     v_start date;
//     v_end date;
//   BEGIN
//     v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
//     v_end := (v_start + interval '1 month' - interval '1 day')::date;
//
//     WITH calendar AS (
//       SELECT d::date as cal_date,
//              COALESCE((SELECT weather_condition FROM public.calendar_settings cs2 WHERE cs2.date = d::date), 'normal') as weather_condition
//       FROM generate_series(v_start, LEAST(v_end, (NOW() AT TIME ZONE 'America/Sao_Paulo')::date), '1 day'::interval) d
//       WHERE NOT EXISTS (
//         SELECT 1 FROM public.calendar_settings cs
//         WHERE cs.date = d::date AND cs.is_working_day = false
//       )
//     ),
//     current_month_metrics AS (
//       SELECT
//         m.uc,
//         m.data_leitura_real as cal_date,
//         m.working_day_index
//       FROM public.reading_working_days_metrics m
//       WHERE m.data_referencia = v_start
//     ),
//     reference_metrics AS (
//       SELECT
//         m.uc,
//         ROUND(AVG(m.working_day_index)) as avg_ref_index
//       FROM public.reading_working_days_metrics m
//       WHERE m.data_referencia = ANY(p_references)
//       GROUP BY m.uc
//     ),
//     comparison AS (
//       SELECT
//         c.cal_date,
//         CASE
//           WHEN r.avg_ref_index IS NULL THEN 'gray'
//           WHEN c.working_day_index < r.avg_ref_index THEN 'green'
//           WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
//           WHEN c.working_day_index > r.avg_ref_index THEN 'red'
//         END as status
//       FROM current_month_metrics c
//       LEFT JOIN reference_metrics r ON r.uc = c.uc
//     ),
//     daily_counts AS (
//       SELECT
//         to_char(cal.cal_date, 'YYYY-MM-DD') as date_label,
//         cal.weather_condition,
//         COUNT(comp.*) FILTER (WHERE comp.status = 'green') as green_count,
//         COUNT(comp.*) FILTER (WHERE comp.status = 'yellow') as yellow_count,
//         COUNT(comp.*) FILTER (WHERE comp.status = 'red') as red_count,
//         COUNT(comp.*) FILTER (WHERE comp.status = 'gray') as gray_count
//       FROM calendar cal
//       LEFT JOIN comparison comp ON comp.cal_date = cal.cal_date
//       GROUP BY cal.cal_date, cal.weather_condition
//       ORDER BY cal.cal_date ASC
//     )
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result FROM daily_counts t;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_reading_rhythm_day_details(timestamp with time zone, text, date[])
//   CREATE OR REPLACE FUNCTION public.get_reading_rhythm_day_details(p_current_month timestamp with time zone, p_date_label text, p_references date[])
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET statement_timeout TO '120s'
//   AS $function$
//   DECLARE
//     v_start date;
//     v_month_minus_1 date;
//     v_month_minus_2 date;
//     v_month_minus_3 date;
//     v_month_minus_4 date;
//     v_month_minus_5 date;
//     v_month_minus_6 date;
//     result json;
//   BEGIN
//     v_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
//     v_month_minus_1 := (v_start - interval '1 month')::date;
//     v_month_minus_2 := (v_start - interval '2 months')::date;
//     v_month_minus_3 := (v_start - interval '3 months')::date;
//     v_month_minus_4 := (v_start - interval '4 months')::date;
//     v_month_minus_5 := (v_start - interval '5 months')::date;
//     v_month_minus_6 := (v_start - interval '6 months')::date;
//
//     WITH current_day_metrics AS (
//       SELECT
//         m.uc,
//         m.data_leitura_real,
//         m.working_day_index
//       FROM public.reading_working_days_metrics m
//       WHERE m.data_referencia = v_start
//         AND m.data_leitura_real = p_date_label::date
//     ),
//     reference_metrics AS (
//       SELECT
//         m.uc,
//         ROUND(AVG(m.working_day_index)) as avg_ref_index
//       FROM current_day_metrics c
//       JOIN public.reading_working_days_metrics m ON m.uc = c.uc
//       WHERE m.data_referencia = ANY(p_references)
//       GROUP BY m.uc
//     ),
//     history_metrics AS (
//       SELECT
//         m.uc,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_1) as m1,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_2) as m2,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_3) as m3,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_4) as m4,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_5) as m5,
//         MAX(m.working_day_index) FILTER (WHERE m.data_referencia = v_month_minus_6) as m6
//       FROM current_day_metrics c
//       JOIN public.reading_working_days_metrics m ON m.uc = c.uc
//       WHERE m.data_referencia IN (v_month_minus_1, v_month_minus_2, v_month_minus_3, v_month_minus_4, v_month_minus_5, v_month_minus_6)
//       GROUP BY m.uc
//     ),
//     comparison AS (
//       SELECT
//         c.uc,
//         c.data_leitura_real,
//         c.working_day_index,
//         r.avg_ref_index,
//         h.m1, h.m2, h.m3, h.m4, h.m5, h.m6,
//         CASE
//           WHEN r.avg_ref_index IS NULL THEN 'gray'
//           WHEN c.working_day_index < r.avg_ref_index THEN 'green'
//           WHEN c.working_day_index = r.avg_ref_index THEN 'yellow'
//           WHEN c.working_day_index > r.avg_ref_index THEN 'red'
//         END as status,
//         CASE
//           WHEN r.avg_ref_index IS NULL THEN 1
//           WHEN c.working_day_index > r.avg_ref_index THEN 2
//           WHEN c.working_day_index = r.avg_ref_index THEN 3
//           WHEN c.working_day_index < r.avg_ref_index THEN 4
//         END as order_weight
//       FROM current_day_metrics c
//       LEFT JOIN reference_metrics r ON r.uc = c.uc
//       LEFT JOIN history_metrics h ON h.uc = c.uc
//     )
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result
//     FROM (
//       SELECT * FROM comparison
//       ORDER BY order_weight ASC, uc ASC
//     ) t;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_reading_rhythm_ruler(timestamp with time zone, text[])
//   CREATE OR REPLACE FUNCTION public.get_reading_rhythm_ruler(p_current_month timestamp with time zone, p_references text[] DEFAULT '{}'::text[])
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_max_working_days_global INT;
//     v_current_month_start DATE;
//     v_current_working_day INT;
//     result json;
//     v_refs DATE[];
//   BEGIN
//     v_current_month_start := date_trunc('month', p_current_month AT TIME ZONE 'America/Sao_Paulo')::date;
//
//     IF p_references IS NOT NULL THEN
//       SELECT array_agg(d::date) INTO v_refs FROM unnest(p_references) d;
//     ELSE
//       v_refs := '{}'::date[];
//     END IF;
//
//     -- Calculate the global max working days from history
//     SELECT MAX(working_day_index) INTO v_max_working_days_global
//     FROM public.reading_working_days_metrics;
//
//     -- Fallback to current month if no data
//     IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
//       SELECT COUNT(*) INTO v_max_working_days_global
//       FROM public.calendar_settings
//       WHERE date >= v_current_month_start
//         AND date < (v_current_month_start + interval '1 month')::date
//         AND is_working_day = true;
//
//       IF v_max_working_days_global IS NULL OR v_max_working_days_global = 0 THEN
//         v_max_working_days_global := 23;
//       END IF;
//     END IF;
//
//     IF date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')::date = v_current_month_start THEN
//       SELECT COUNT(*) INTO v_current_working_day
//       FROM public.calendar_settings
//       WHERE date >= v_current_month_start
//         AND date <= (now() AT TIME ZONE 'America/Sao_Paulo')::date
//         AND is_working_day = true;
//     ELSE
//       v_current_working_day := NULL;
//     END IF;
//
//     WITH days AS (
//       SELECT generate_series(1, v_max_working_days_global) as idx
//     ),
//     all_months AS (
//       SELECT v_current_month_start as month_date, true as is_current
//       UNION ALL
//       SELECT unnest(v_refs) as month_date, false as is_current
//     ),
//     monthly_daily AS (
//       SELECT
//         data_referencia,
//         working_day_index,
//         COUNT(uc) as cnt
//       FROM public.reading_working_days_metrics
//       WHERE data_referencia IN (SELECT month_date FROM all_months)
//       GROUP BY data_referencia, working_day_index
//     ),
//     monthly_acc AS (
//       SELECT
//         am.month_date,
//         am.is_current,
//         d.idx,
//         COALESCE(md.cnt, 0) as daily_cnt,
//         SUM(COALESCE(md.cnt, 0)) OVER (PARTITION BY am.month_date ORDER BY d.idx) as curr_acc
//       FROM all_months am
//       CROSS JOIN days d
//       LEFT JOIN monthly_daily md ON md.data_referencia = am.month_date AND md.working_day_index = d.idx
//     ),
//     ref_avg AS (
//       SELECT
//         idx,
//         AVG(curr_acc) as ref_acc
//       FROM monthly_acc
//       WHERE is_current = false
//       GROUP BY idx
//     ),
//     monthly_json AS (
//       SELECT
//         m.month_date,
//         m.is_current,
//         to_char(m.month_date, 'MM/YYYY') as month_label,
//         json_agg(
//           json_build_object(
//             'index', m.idx,
//             'daily', m.daily_cnt,
//             'accumulated', m.curr_acc,
//             'ref_acc', r.ref_acc
//           ) ORDER BY m.idx
//         ) as blocks
//       FROM monthly_acc m
//       LEFT JOIN ref_avg r ON r.idx = m.idx AND m.is_current = true
//       GROUP BY m.month_date, m.is_current
//     )
//     SELECT json_build_object(
//       'max_working_days', v_max_working_days_global,
//       'current_working_day', v_current_working_day,
//       'rulers', (
//         SELECT COALESCE(json_agg(
//           json_build_object(
//             'month', month_label,
//             'is_current', is_current,
//             'month_date', month_date,
//             'blocks', blocks
//           ) ORDER BY is_current DESC, month_date DESC
//         ), '[]'::json)
//         FROM monthly_json
//       )
//     ) INTO result;
//
//     RETURN result;
//   END;
//   $function$
//
// FUNCTION get_reading_rhythm_status(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.get_reading_rhythm_status(p_month timestamp with time zone DEFAULT now())
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_start_date DATE;
//     v_current_working_day_index INT;
//     result json;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
//
//     WITH calendar AS (
//       SELECT
//         d::DATE as cal_date,
//         COALESCE(cs.is_working_day, true) as is_working
//       FROM generate_series(v_start_date, LEAST((NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE, (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE), '1 day'::interval) d
//       LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
//     )
//     SELECT SUM(CASE WHEN is_working THEN 1 ELSE 0 END) INTO v_current_working_day_index
//     FROM calendar;
//
//     IF v_current_working_day_index IS NULL THEN
//       v_current_working_day_index := 0;
//     END IF;
//
//     WITH historical_avg AS (
//       SELECT
//         uc,
//         AVG(working_day_index) as avg_index
//       FROM public.reading_working_days_metrics
//       WHERE data_referencia < v_start_date
//         AND data_referencia >= (v_start_date - INTERVAL '3 months')::DATE
//       GROUP BY uc
//     ),
//     current_month_expected AS (
//       SELECT
//         dr.uc,
//         dr.data_leitura_real,
//         h.avg_index,
//         v_current_working_day_index as current_index
//       FROM public.daily_readings dr
//       JOIN historical_avg h ON h.uc = dr.uc
//       WHERE date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE = v_start_date
//     ),
//     status_calc AS (
//       SELECT
//         uc,
//         CASE
//           WHEN data_leitura_real IS NOT NULL THEN 'Lido'
//           WHEN current_index > CEIL(avg_index) THEN 'Atrasado'
//           WHEN current_index < FLOOR(avg_index) THEN 'Adiantado'
//           ELSE 'Em Dia'
//         END as status
//       FROM current_month_expected
//     )
//     SELECT json_build_object(
//       'atrasado', COUNT(*) FILTER (WHERE status = 'Atrasado'),
//       'em_dia', COUNT(*) FILTER (WHERE status = 'Em Dia'),
//       'adiantado', COUNT(*) FILTER (WHERE status = 'Adiantado'),
//       'lido', COUNT(*) FILTER (WHERE status = 'Lido'),
//       'current_working_day', v_current_working_day_index
//     ) INTO result
//     FROM status_calc;
//
//     RETURN COALESCE(result, '{"atrasado":0,"em_dia":0,"adiantado":0,"lido":0,"current_working_day":0}'::json);
//   END;
//   $function$
//
// FUNCTION get_regularized_assignments(integer, integer)
//   CREATE OR REPLACE FUNCTION public.get_regularized_assignments(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
//    RETURNS TABLE(id uuid, uc text, cod_pess_fat text, snapshot_nome_cliente text, created_at timestamp with time zone, status text, images jsonb, total_count bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     WITH filtered AS (
//       SELECT
//         sa.id,
//         sa.uc,
//         sa.cod_pess_fat,
//         sa.snapshot_nome_cliente,
//         sa.created_at,
//         sa.status,
//         sa.images
//       FROM public.strategic_assignments sa
//       WHERE sa.images IS NOT NULL
//         AND jsonb_typeof(sa.images) = 'array'
//         AND jsonb_array_length(sa.images) > 0
//         AND NOT EXISTS (
//           SELECT 1
//           FROM public.pending_debts pd
//           WHERE pd.uc = sa.uc
//             AND pd.cod_pess_fat = sa.cod_pess_fat
//             AND pd.is_active = true
//         )
//     )
//     SELECT
//       f.id,
//       f.uc,
//       f.cod_pess_fat,
//       f.snapshot_nome_cliente,
//       f.created_at,
//       f.status,
//       f.images,
//       (SELECT count(*) FROM filtered)::bigint AS total_count
//     FROM filtered f
//     ORDER BY f.created_at DESC
//     LIMIT p_limit OFFSET p_offset;
//   END;
//   $function$
//
// FUNCTION get_researched_phones()
//   CREATE OR REPLACE FUNCTION public.get_researched_phones()
//    RETURNS TABLE(id uuid, uc text, cod_pess_fat text, phones jsonb, created_at timestamp with time zone, pessoa_fatura_nome text, valor_total numeric, ultimo_disparo timestamp with time zone)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     SELECT
//       rp.id,
//       rp.uc,
//       rp.cod_pess_fat,
//       rp.phones,
//       rp.created_at,
//       pd.pessoa_fatura_nome,
//       pd.valor_total,
//       pd.ultimo_disparo
//     FROM public.researched_phones rp
//     JOIN public.pending_debts pd ON pd.uc = rp.uc AND pd.cod_pess_fat = rp.cod_pess_fat
//     ORDER BY rp.updated_at DESC
//     LIMIT 100;
//   END;
//   $function$
//
// FUNCTION get_researched_phones_paginated(integer, integer)
//   CREATE OR REPLACE FUNCTION public.get_researched_phones_paginated(p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
//    RETURNS TABLE(id uuid, uc text, cod_pess_fat text, phones jsonb, created_at timestamp with time zone, pessoa_fatura_nome text, pessoa_fatura_cpf_cnpj text, valor_total numeric, ultimo_disparo timestamp with time zone, total_count bigint)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//     BEGIN
//       RETURN QUERY
//       WITH filtered AS (
//         SELECT
//           rp.id,
//           rp.uc,
//           rp.cod_pess_fat,
//           rp.phones,
//           rp.created_at,
//           pd.pessoa_fatura_nome,
//           pd.pessoa_fatura_cpf_cnpj,
//           pd.valor_total,
//           pd.ultimo_disparo,
//           rp.updated_at
//         FROM public.researched_phones rp
//         JOIN public.pending_debts pd ON pd.uc = rp.uc AND pd.cod_pess_fat = rp.cod_pess_fat
//       )
//       SELECT
//         f.id, f.uc, f.cod_pess_fat, f.phones, f.created_at, f.pessoa_fatura_nome, f.pessoa_fatura_cpf_cnpj, f.valor_total, f.ultimo_disparo,
//         (SELECT count(*) FROM filtered)::bigint AS total_count
//       FROM filtered f
//       ORDER BY f.updated_at DESC
//       LIMIT p_limit OFFSET p_offset;
//     END;
//     $function$
//
// FUNCTION get_serasa_cross_reference(text, boolean, date, date, numeric, numeric, integer, integer, boolean)
//   CREATE OR REPLACE FUNCTION public.get_serasa_cross_reference(p_cpf_cnpj text DEFAULT NULL::text, p_possui_debitos boolean DEFAULT NULL::boolean, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_min_value numeric DEFAULT NULL::numeric, p_max_value numeric DEFAULT NULL::numeric, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_baixado_aqui boolean DEFAULT false)
//    RETURNS TABLE(id uuid, cpf_cnpj text, nome text, num_contrato text, valor numeric, data_envio date, situacao text, created_at timestamp with time zone, possui_debitos boolean, ultima_verificacao timestamp with time zone, baixado_aqui boolean, data_baixa_aqui timestamp with time zone, is_blacklisted boolean)
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN QUERY
//     WITH blacklisted AS (
//       SELECT regexp_replace(b.cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf
//       FROM public.serasa_blacklist b
//     )
//     SELECT
//       s.id, s.cpf_cnpj, s.nome, s.num_contrato, s.valor, s.data_envio,
//       s.situacao, s.created_at, s.possui_debitos, s.ultima_verificacao,
//       s.baixado_aqui, s.data_baixa_aqui,
//       EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = regexp_replace(s.cpf_cnpj, '[^0-9]', '', 'g')) as is_blacklisted
//     FROM public.serasa_negativations s
//     WHERE (p_cpf_cnpj IS NULL OR p_cpf_cnpj = '' OR s.cpf_cnpj ILIKE '%' || p_cpf_cnpj || '%' OR s.nome ILIKE '%' || p_cpf_cnpj || '%')
//       AND (p_possui_debitos IS NULL OR s.possui_debitos = p_possui_debitos)
//       AND (p_start_date IS NULL OR s.data_envio >= p_start_date)
//       AND (p_end_date IS NULL OR s.data_envio <= p_end_date)
//       AND (p_min_value IS NULL OR s.valor >= p_min_value)
//       AND (p_max_value IS NULL OR s.valor <= p_max_value)
//       AND (s.baixado_aqui = p_baixado_aqui)
//     ORDER BY
//       EXISTS (SELECT 1 FROM blacklisted bl WHERE bl.clean_cpf = regexp_replace(s.cpf_cnpj, '[^0-9]', '', 'g')) DESC,
//       CASE WHEN s.possui_debitos = false THEN 0 ELSE 1 END,
//       s.created_at DESC
//     LIMIT p_limit
//     OFFSET p_offset;
//   END;
//   $function$
//
// FUNCTION get_strategic_dashboard_data()
//   CREATE OR REPLACE FUNCTION public.get_strategic_dashboard_data()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     result json;
//     d1_history json;
//     d2_operator_channel json;
//     d4_performance json;
//     d6_profiles json;
//     contact_results json;
//     follow_up_stats json;
//   BEGIN
//     -- D1: Valor da Inadimplência Acumulada
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
//     FROM (
//       SELECT snapshot_date as date, total_value as value, total_vencido as vencido, total_cases as cases
//       FROM public.portfolio_history
//       WHERE snapshot_date >= '2026-04-01'
//       ORDER BY snapshot_date ASC
//     ) t;
//
//     IF json_array_length(d1_history) = 0 THEN
//       SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d1_history
//       FROM (
//         SELECT current_date as date, SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) as value, SUM(valor_vencido) as vencido, COUNT(*) as cases
//         FROM public.pending_debts
//         WHERE COALESCE(setor, '') != '4036' AND is_active = true
//       ) t;
//     END IF;
//
//     -- D2: Atuação por Operador e Canal
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d2_operator_channel
//     FROM (
//       SELECT
//         COALESCE(p.first_name, p.name, 'SISTEMA') as operator,
//         ch.contact_type as channel,
//         COUNT(*) as count
//       FROM public.contact_history ch
//       LEFT JOIN public.profiles p ON p.id = ch.operator_id
//       WHERE ch.contact_type IS NOT NULL
//       GROUP BY COALESCE(p.first_name, p.name, 'SISTEMA'), ch.contact_type
//     ) t;
//
//     -- D4: Desempenho do Setor
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d4_performance
//     FROM (
//       SELECT
//         COALESCE(p.first_name, p.name, 'SISTEMA') as operator,
//         COUNT(ch.id) as contacts,
//         COUNT(cr.id) as recoveries,
//         COALESCE(SUM(cr.valor_recuperado), 0) as recovered_value
//       FROM public.contact_history ch
//       LEFT JOIN public.profiles p ON p.id = ch.operator_id
//       LEFT JOIN public.contact_results cr ON cr.contact_id = ch.id
//       GROUP BY COALESCE(p.first_name, p.name, 'SISTEMA')
//       ORDER BY COALESCE(SUM(cr.valor_recuperado), 0) DESC
//       LIMIT 10
//     ) t;
//
//     -- D6: Análise de Perfis (CPF vs CNPJ) - Apenas ativos
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO d6_profiles
//     FROM (
//       SELECT
//         CASE
//           WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) <= 11 THEN 'Residencial (PF)'
//           WHEN LENGTH(REGEXP_REPLACE(COALESCE(pessoa_fatura_cpf_cnpj, ''), '[^0-9]', '', 'g')) > 11 THEN 'Comercial (PJ)'
//           ELSE 'Não Identificado'
//         END as profile_type,
//         COUNT(*) as volume,
//         SUM(COALESCE(valor_total, 0) - COALESCE(valor_retidas_em_aberto, 0)) as value
//       FROM public.pending_debts
//       WHERE COALESCE(setor, '') != '4036' AND is_active = true
//       GROUP BY 1
//     ) t;
//
//     -- Contact Results
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO contact_results
//     FROM (
//       SELECT
//         COALESCE(status, 'Sem Status') as status,
//         COUNT(*) as count
//       FROM public.contact_history
//       WHERE status IS NOT NULL
//       GROUP BY status
//       ORDER BY count DESC
//     ) t;
//
//     -- Follow up stats
//     SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO follow_up_stats
//     FROM (
//       SELECT
//         CASE
//           WHEN completed = true THEN 'Concluído'
//           WHEN due_date < CURRENT_DATE THEN 'Atrasado'
//           WHEN due_date = CURRENT_DATE THEN 'Hoje'
//           ELSE 'No Prazo/Futuro'
//         END as status,
//         COUNT(*) as count
//       FROM public.follow_up_tasks
//       GROUP BY 1
//       ORDER BY count DESC
//     ) t;
//
//     SELECT json_build_object(
//       'd1_history', d1_history,
//       'd2_operator_channel', d2_operator_channel,
//       'd4_performance', d4_performance,
//       'd6_profiles', d6_profiles,
//       'contact_results', contact_results,
//       'follow_up_stats', follow_up_stats
//     ) INTO result;
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
//     fast_pts INT;
//     late_pts INT;
//   BEGIN
//     -- Parametros do sistema
//     SELECT (value->>'max_days')::int INTO max_days FROM public.app_settings WHERE key = 'conversion_params';
//     SELECT (value->>'max_score_days')::int INTO max_score_days FROM public.app_settings WHERE key = 'conversion_params';
//
//     SELECT (value->>'fast_reversion')::int INTO fast_pts FROM public.app_settings WHERE key = 'score_params';
//     SELECT (value->>'late_reversion')::int INTO late_pts FROM public.app_settings WHERE key = 'score_params';
//
//     IF max_days IS NULL THEN max_days := 120; END IF;
//     IF max_score_days IS NULL THEN max_score_days := 7; END IF;
//     IF fast_pts IS NULL THEN fast_pts := 5; END IF;
//     IF late_pts IS NULL THEN late_pts := 2; END IF;
//
//     INSERT INTO public.contact_results (
//       contact_id,
//       uc,
//       cod_pess_fat,
//       settlement_id,
//       valor_recuperado,
//       data_baixa,
//       dias_para_reversao,
//       pontos_reversao
//     )
//     SELECT
//       ch.id as contact_id,
//       s.uc,
//       COALESCE(s.cod_pess_fat, ch.cod_pess_fat) as cod_pess_fat,
//       s.id as settlement_id,
//       s.valor_total as valor_recuperado,
//       COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) as data_baixa,
//       (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) as dias_para_reversao,
//       CASE WHEN (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_score_days THEN fast_pts ELSE late_pts END as pontos_reversao
//     FROM public.settlements s
//     -- JOIN LATERAL with LIMIT 1 implements the "Lógica de Ciclos".
//     -- We link each eligible settlement only to the single most recent valid contact before the settlement date.
//     JOIN LATERAL (
//       SELECT id, created_at, cod_pess_fat, is_active
//       FROM public.contact_history ch2
//       WHERE ch2.uc = s.uc
//         AND (ch2.cod_pess_fat = s.cod_pess_fat OR s.cod_pess_fat IS NULL)
//         AND ch2.is_active = true
//         AND (ch2.created_at AT TIME ZONE 'America/Sao_Paulo')::date <= COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data)
//         AND (COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data) - (ch2.created_at AT TIME ZONE 'America/Sao_Paulo')::date) <= max_days
//       ORDER BY ch2.created_at DESC
//       LIMIT 1
//     ) ch ON true
//     WHERE s.tipo_baixa IN ('CONV.ARREC', 'DEB.AUTO')
//       -- Ensures we don't duplicate a result if the settlement was cleaned up and re-imported later.
//       AND NOT EXISTS (
//         SELECT 1 FROM public.contact_results cr
//         WHERE cr.contact_id = ch.id
//           AND cr.valor_recuperado = s.valor_total
//           AND cr.data_baixa = COALESCE(s.datacriacao::date, s.databaixa_final, s.databaixa_inicial, s.datacredito_final, s.datacredito_inicial, s.neg_data)
//       )
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
// FUNCTION recalculate_working_days_metrics(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.recalculate_working_days_metrics(p_month timestamp with time zone)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET statement_timeout TO '5min'
//   AS $function$
//   DECLARE
//     v_start_date DATE;
//     v_end_date DATE;
//     v_start_ts TIMESTAMP WITH TIME ZONE;
//     v_end_ts TIMESTAMP WITH TIME ZONE;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
//     v_end_date := (date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
//
//     v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
//     v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
//
//     -- Stamp missing days in calendar_settings as is_working_day = true
//     INSERT INTO public.calendar_settings (date, is_working_day, updated_at)
//     SELECT d::DATE, true, NOW()
//     FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
//     ON CONFLICT (date) DO NOTHING;
//
//     -- Create temp table to hold calculated values
//     CREATE TEMP TABLE IF NOT EXISTS tmp_metrics (
//       uc text,
//       data_referencia date,
//       data_leitura_real date,
//       working_day_index integer
//     ) ON COMMIT DROP;
//
//     TRUNCATE tmp_metrics;
//
//     WITH calendar AS (
//       SELECT
//         d::DATE as cal_date,
//         COALESCE(cs.is_working_day, true) as is_working
//       FROM generate_series(v_start_date, v_end_date, '1 day'::interval) d
//       LEFT JOIN public.calendar_settings cs ON cs.date = d::DATE
//     ),
//     cumulative_calendar AS (
//       SELECT
//         cal_date,
//         is_working,
//         SUM(CASE WHEN is_working THEN 1 ELSE 0 END) OVER (ORDER BY cal_date) as working_day_index
//       FROM calendar
//     ),
//     unique_readings AS (
//       SELECT DISTINCT ON (dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE)
//         dr.uc,
//         date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE as data_ref_date,
//         (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE as data_leitura_date
//       FROM public.daily_readings dr
//       WHERE dr.data_leitura_real >= v_start_ts
//         AND dr.data_leitura_real < v_end_ts
//         AND dr.data_referencia IS NOT NULL
//       ORDER BY dr.uc, date_trunc('month', dr.data_referencia AT TIME ZONE 'UTC')::DATE, dr.data_leitura_real DESC
//     )
//     INSERT INTO tmp_metrics (uc, data_referencia, data_leitura_real, working_day_index)
//     SELECT
//       ur.uc,
//       ur.data_ref_date,
//       ur.data_leitura_date,
//       cc.working_day_index
//     FROM unique_readings ur
//     JOIN cumulative_calendar cc ON cc.cal_date = ur.data_leitura_date;
//
//     -- Upsert from temp table in a single robust operation
//     INSERT INTO public.reading_working_days_metrics (uc, data_referencia, data_leitura_real, working_day_index, updated_at)
//     SELECT uc, data_referencia, data_leitura_real, working_day_index, NOW()
//     FROM tmp_metrics
//     ON CONFLICT (uc, data_referencia) DO UPDATE SET
//       data_leitura_real = EXCLUDED.data_leitura_real,
//       working_day_index = EXCLUDED.working_day_index,
//       updated_at = EXCLUDED.updated_at;
//
//     DROP TABLE IF EXISTS tmp_metrics;
//
//     -- Refreshes the daily_readings_summary for the calculated month
//     PERFORM public.refresh_daily_readings_summary(p_month);
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
//           total_lotes_cases, total_lotes_value, total_lotes_vencido, total_lotes_a_vencer,
//           total_estrat_cases, total_estrat_value, total_estrat_vencido, total_estrat_a_vencer, total_estrat_retidas, total_estrat_retidas_cases,
//           total_jurid_cases, total_jurid_value, total_jurid_vencido, total_jurid_a_vencer, total_jurid_retidas, total_jurid_retidas_cases,
//           total_corte_cases, total_corte_value, total_corte_vencido, total_corte_a_vencer, total_corte_retidas, total_corte_retidas_cases,
//           total_recorte_cases, total_recorte_value, total_recorte_vencido, total_recorte_a_vencer, total_recorte_retidas, total_recorte_retidas_cases
//       )
//       SELECT
//           CURRENT_DATE,
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true),
//           COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
//           COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true), 0),
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true),
//
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true),
//           COALESCE(SUM(pd.valor_total) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') = '4036' AND pd.is_active = true), 0),
//
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'),
//           COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
//           COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'strategic'), 0),
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'strategic'),
//
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'),
//           COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
//           COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'legal'), 0),
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'legal'),
//
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'),
//           COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
//           COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'cut'), 0),
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'cut'),
//
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'),
//           COALESCE(SUM(COALESCE(pd.valor_total, 0) - COALESCE(pd.valor_retidas_em_aberto, 0)) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
//           COALESCE(SUM(pd.valor_vencido) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
//           COALESCE(SUM(pd.valor_a_vencer) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
//           COALESCE(SUM(pd.valor_retidas_em_aberto) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND pd.is_active = true AND sa.queue_type = 'recut'), 0),
//           COUNT(*) FILTER (WHERE COALESCE(pd.setor, '') != '4036' AND COALESCE(pd.valor_retidas_em_aberto, 0) > 0 AND pd.is_active = true AND sa.queue_type = 'recut')
//
//       FROM public.pending_debts pd
//       LEFT JOIN LATERAL (
//         SELECT queue_type
//         FROM public.strategic_assignments
//         WHERE uc = pd.uc AND cod_pess_fat = pd.cod_pess_fat
//           AND (
//             (queue_type = 'strategic' AND status IN ('pending', 'started')) OR
//             (queue_type = 'legal' AND status IN ('a_encaminhar', 'encaminhado')) OR
//             (queue_type = 'cut' AND status IN ('para_abrir_os', 'os_corte_aberta')) OR
//             (queue_type = 'recut' AND status IN ('para_abrir_os', 'os_recorte_aberta'))
//           )
//         LIMIT 1
//       ) sa ON true
//       ON CONFLICT (snapshot_date) DO UPDATE
//       SET total_cases = EXCLUDED.total_cases,
//           total_value = EXCLUDED.total_value,
//           total_vencido = EXCLUDED.total_vencido,
//           total_a_vencer = EXCLUDED.total_a_vencer,
//           total_retidas = EXCLUDED.total_retidas,
//           total_retidas_cases = EXCLUDED.total_retidas_cases,
//           total_lotes_cases = EXCLUDED.total_lotes_cases,
//           total_lotes_value = EXCLUDED.total_lotes_value,
//           total_lotes_vencido = EXCLUDED.total_lotes_vencido,
//           total_lotes_a_vencer = EXCLUDED.total_lotes_a_vencer,
//           total_estrat_cases = EXCLUDED.total_estrat_cases,
//           total_estrat_value = EXCLUDED.total_estrat_value,
//           total_estrat_vencido = EXCLUDED.total_estrat_vencido,
//           total_estrat_a_vencer = EXCLUDED.total_estrat_a_vencer,
//           total_estrat_retidas = EXCLUDED.total_estrat_retidas,
//           total_estrat_retidas_cases = EXCLUDED.total_estrat_retidas_cases,
//           total_jurid_cases = EXCLUDED.total_jurid_cases,
//           total_jurid_value = EXCLUDED.total_jurid_value,
//           total_jurid_vencido = EXCLUDED.total_jurid_vencido,
//           total_jurid_a_vencer = EXCLUDED.total_jurid_a_vencer,
//           total_jurid_retidas = EXCLUDED.total_jurid_retidas,
//           total_jurid_retidas_cases = EXCLUDED.total_jurid_retidas_cases,
//           total_corte_cases = EXCLUDED.total_corte_cases,
//           total_corte_value = EXCLUDED.total_corte_value,
//           total_corte_vencido = EXCLUDED.total_corte_vencido,
//           total_corte_a_vencer = EXCLUDED.total_corte_a_vencer,
//           total_corte_retidas = EXCLUDED.total_corte_retidas,
//           total_corte_retidas_cases = EXCLUDED.total_corte_retidas_cases,
//           total_recorte_cases = EXCLUDED.total_recorte_cases,
//           total_recorte_value = EXCLUDED.total_recorte_value,
//           total_recorte_vencido = EXCLUDED.total_recorte_vencido,
//           total_recorte_a_vencer = EXCLUDED.total_recorte_a_vencer,
//           total_recorte_retidas = EXCLUDED.total_recorte_retidas,
//           total_recorte_retidas_cases = EXCLUDED.total_recorte_retidas_cases;
//   END;
//   $function$
//
// FUNCTION refresh_daily_readings_summary(timestamp with time zone)
//   CREATE OR REPLACE FUNCTION public.refresh_daily_readings_summary(p_month timestamp with time zone)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_start_date DATE;
//     v_end_date DATE;
//     v_start_ts TIMESTAMPTZ;
//     v_end_ts TIMESTAMPTZ;
//   BEGIN
//     v_start_date := date_trunc('month', p_month AT TIME ZONE 'America/Sao_Paulo')::DATE;
//     v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
//     v_start_ts := v_start_date::timestamp AT TIME ZONE 'America/Sao_Paulo';
//     v_end_ts := (v_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Sao_Paulo';
//
//     -- Delete existing records for the month to allow clean aggregation
//     DELETE FROM public.daily_readings_summary
//     WHERE day >= v_start_date AND day <= v_end_date;
//
//     -- Insert aggregated data
//     WITH daily_data AS (
//       SELECT
//         (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE AS day_date,
//         COUNT(*) as total_readings,
//         dr.usuario_id
//       FROM public.daily_readings dr
//       WHERE dr.data_leitura_real >= v_start_ts AND dr.data_leitura_real < v_end_ts
//       GROUP BY (dr.data_leitura_real AT TIME ZONE 'America/Sao_Paulo')::DATE, dr.usuario_id
//     ),
//     aggregated AS (
//       SELECT
//         day_date as day,
//         SUM(total_readings)::INT as total_readings,
//         jsonb_object_agg(COALESCE(usuario_id, 'UNKNOWN'), total_readings) as reader_stats
//       FROM daily_data
//       GROUP BY day_date
//     )
//     INSERT INTO public.daily_readings_summary (day, total_readings, reader_stats, updated_at)
//     SELECT day, total_readings, reader_stats, NOW()
//     FROM aggregated;
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
//             COALESCE(s.cod_pess_fat, ''),
//             s.valor_total,
//             COALESCE(date_trunc('second', s.datacriacao::timestamp)::text, s.databaixa_final::text, s.databaixa_inicial::text, s.datacredito_final::text, s.datacredito_inicial::text, s.neg_data::text),
//             COALESCE(s.refs, '')
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
// FUNCTION revert_billing_dispatches(date)
//   CREATE OR REPLACE FUNCTION public.revert_billing_dispatches(p_date date)
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     affected_count INT := 0;
//   BEGIN
//     UPDATE public.pending_debts
//     SET ultimo_disparo = NULL
//     WHERE DATE(ultimo_disparo AT TIME ZONE 'America/Sao_Paulo') = p_date;
//
//     GET DIAGNOSTICS affected_count = ROW_COUNT;
//
//     RETURN json_build_object('affected_count', affected_count);
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
// FUNCTION trg_update_is_leiturista()
//   CREATE OR REPLACE FUNCTION public.trg_update_is_leiturista()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//       IF NEW.usuario_id IS NOT NULL AND NEW.usuario_id != '' THEN
//           UPDATE public.gis_users
//           SET is_leiturista = true
//           WHERE usuario_id = NEW.usuario_id AND (is_leiturista IS FALSE OR is_leiturista IS NULL);
//       END IF;
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trg_update_serasa_workflow_on_negativation()
//   CREATE OR REPLACE FUNCTION public.trg_update_serasa_workflow_on_negativation()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     IF NEW.situacao != 'Baixado' THEN
//       UPDATE public.serasa_workflow
//       SET
//         status = 'negativado',
//         updated_at = NOW()
//       WHERE status = 'sendo_negativado'
//         AND (cpf_cnpj = NEW.cpf_cnpj OR cpf_cnpj = REGEXP_REPLACE(NEW.cpf_cnpj, '[^0-9]', '', 'g'));
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trg_validate_assignment()
//   CREATE OR REPLACE FUNCTION public.trg_validate_assignment()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     -- Validate if the UC and cod_pess_fat exist and are active in pending_debts
//     IF NOT EXISTS (
//       SELECT 1 FROM public.pending_debts pd
//       WHERE pd.uc = NEW.uc
//         AND pd.cod_pess_fat = NEW.cod_pess_fat
//         AND pd.is_active = true
//     ) THEN
//       -- Silently drop the insert if validation fails (useful for bulk imports)
//       RETURN NULL;
//     END IF;
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
//    SET statement_timeout TO '10min'
//   AS $function$
//   BEGIN
//     -- Ao invés de usar TRUNCATE, realiza uma exclusão controlada marcando como inativos,
//     -- para que o histórico operacional se mantenha mas não apareça nos dashboards financeiros.
//     -- Utiliza uma única instrução UPDATE para evitar o overhead de loops limitados e snapshot expansion
//     -- O statement_timeout é aumentado localmente nesta função para evitar cancelamentos de timeout durante o processo
//     UPDATE public.pending_debts
//     SET is_active = false
//     WHERE is_active = true OR is_active IS NULL;
//   END;
//   $function$
//
// FUNCTION uc_numeric(pending_debts)
//   CREATE OR REPLACE FUNCTION public.uc_numeric(rec pending_debts)
//    RETURNS numeric
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//     SELECT NULLIF(regexp_replace(rec.uc, '\D', '', 'g'), '')::NUMERIC;
//   $function$
//
// FUNCTION uc_numeric(vw_pending_debts_with_contacts)
//   CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_pending_debts_with_contacts)
//    RETURNS numeric
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//     SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
//   $function$
//
// FUNCTION uc_numeric(vw_terms_queue_debts)
//   CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_terms_queue_debts)
//    RETURNS numeric
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//     SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
//   $function$
//
// FUNCTION uc_numeric(vw_queue_debts)
//   CREATE OR REPLACE FUNCTION public.uc_numeric(vw vw_queue_debts)
//    RETURNS numeric
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//     SELECT NULLIF(regexp_replace(vw.uc, '\D', '', 'g'), '')::numeric;
//   $function$
//
// FUNCTION update_serasa_debts_status()
//   CREATE OR REPLACE FUNCTION public.update_serasa_debts_status()
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     last_import_date TIMESTAMP WITH TIME ZONE;
//     batch_size INT := 250;
//     affected INT;
//   BEGIN
//     -- Get the last pending_debts import date
//     SELECT MAX(created_at) INTO last_import_date
//     FROM public.import_history
//     WHERE table_name LIKE 'Pendências (Substituição Total)%';
//
//     -- Use loop for batch processing to avoid statement timeout
//     LOOP
//       WITH to_update AS (
//         SELECT id, cpf_cnpj, REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g') as clean_cpf_cnpj
//         FROM public.serasa_negativations
//         WHERE ultima_verificacao IS NULL OR ultima_verificacao < COALESCE(last_import_date, '1900-01-01'::timestamptz)
//         LIMIT batch_size
//       )
//       UPDATE public.serasa_negativations s
//       SET
//         possui_debitos = EXISTS (
//           SELECT 1 FROM public.pending_debts pd
//           WHERE pd.is_active = true
//           AND (
//             REGEXP_REPLACE(pd.pessoa_fatura_cpf_cnpj, '[^0-9]', '', 'g') IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             REGEXP_REPLACE(pd.proprietario_cpf_cnpj, '[^0-9]', '', 'g') IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             REGEXP_REPLACE(pd.responsavel_cpf_cnpj, '[^0-9]', '', 'g') IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             REGEXP_REPLACE(pd.cod_pess_fat, '[^0-9]', '', 'g') IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             pd.pessoa_fatura_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             pd.proprietario_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             pd.responsavel_cpf_cnpj IN (u.cpf_cnpj, u.clean_cpf_cnpj) OR
//             pd.cod_pess_fat IN (u.cpf_cnpj, u.clean_cpf_cnpj)
//           )
//         ),
//         ultima_verificacao = NOW()
//       FROM to_update u
//       WHERE s.id = u.id;
//
//       GET DIAGNOSTICS affected = ROW_COUNT;
//       EXIT WHEN affected = 0;
//
//       -- Small pause to let other transactions run
//       PERFORM pg_sleep(0.01);
//     END LOOP;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: contact_history
//   trg_audit_contact_history: CREATE TRIGGER trg_audit_contact_history AFTER UPDATE ON public.contact_history FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION audit_contact_history_changes()
// Table: daily_readings
//   on_daily_reading_insert: CREATE TRIGGER on_daily_reading_insert AFTER INSERT OR UPDATE OF usuario_id ON public.daily_readings FOR EACH ROW EXECUTE FUNCTION trg_update_is_leiturista()
// Table: import_history
//   trg_limit_import_history: CREATE TRIGGER trg_limit_import_history AFTER INSERT ON public.import_history FOR EACH ROW EXECUTE FUNCTION keep_latest_20_import_history()
// Table: profiles
//   on_profile_role_update: CREATE TRIGGER on_profile_role_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION protect_profile_roles()
//   set_profiles_updated_at: CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at()
// Table: serasa_negativations
//   on_serasa_negativation_added: CREATE TRIGGER on_serasa_negativation_added AFTER INSERT OR UPDATE ON public.serasa_negativations FOR EACH ROW EXECUTE FUNCTION trg_update_serasa_workflow_on_negativation()
// Table: strategic_assignments
//   set_strategic_assignments_updated_at: CREATE TRIGGER set_strategic_assignments_updated_at BEFORE UPDATE ON public.strategic_assignments FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at()
//   validate_assignment_insert: CREATE TRIGGER validate_assignment_insert BEFORE INSERT ON public.strategic_assignments FOR EACH ROW EXECUTE FUNCTION trg_validate_assignment()

// --- INDEXES ---
// Table: access_logs
//   CREATE INDEX access_logs_created_at_idx ON public.access_logs USING btree (created_at)
//   CREATE INDEX access_logs_user_id_idx ON public.access_logs USING btree (user_id)
// Table: cadastral_updates
//   CREATE INDEX cadastral_updates_created_at_idx ON public.cadastral_updates USING btree (created_at)
//   CREATE INDEX cadastral_updates_status_idx ON public.cadastral_updates USING btree (status)
// Table: calendar_settings
//   CREATE UNIQUE INDEX calendar_settings_date_key ON public.calendar_settings USING btree (date)
// Table: contact_history
//   CREATE INDEX contact_history_created_at_idx ON public.contact_history USING btree (created_at)
//   CREATE INDEX contact_history_operator_id_idx ON public.contact_history USING btree (operator_id)
//   CREATE INDEX contact_history_uc_cod_pess_fat_idx ON public.contact_history USING btree (uc, cod_pess_fat)
// Table: contact_results
//   CREATE UNIQUE INDEX contact_results_contact_id_settlement_id_key ON public.contact_results USING btree (contact_id, settlement_id)
// Table: daily_readings
//   CREATE INDEX daily_readings_data_leitura_real_idx ON public.daily_readings USING btree (data_leitura_real)
//   CREATE INDEX daily_readings_data_referencia_idx ON public.daily_readings USING btree (data_referencia)
//   CREATE UNIQUE INDEX daily_readings_original_id_idx ON public.daily_readings USING btree (original_id)
//   CREATE INDEX daily_readings_ref_leitura_real_idx ON public.daily_readings USING btree (data_leitura_real, data_referencia)
//   CREATE INDEX daily_readings_uc_idx ON public.daily_readings USING btree (uc)
//   CREATE INDEX idx_daily_readings_data_leitura_real ON public.daily_readings USING btree (data_leitura_real)
//   CREATE INDEX idx_daily_readings_data_referencia ON public.daily_readings USING btree (data_referencia)
//   CREATE INDEX idx_daily_readings_leitura_ref ON public.daily_readings USING btree (data_leitura_real, data_referencia)
//   CREATE INDEX idx_daily_readings_usuario_id ON public.daily_readings USING btree (usuario_id)
// Table: follow_up_tasks
//   CREATE INDEX follow_up_tasks_assigned_by_idx ON public.follow_up_tasks USING btree (assigned_by)
//   CREATE INDEX follow_up_tasks_created_at_idx ON public.follow_up_tasks USING btree (created_at)
//   CREATE INDEX follow_up_tasks_operator_id_idx ON public.follow_up_tasks USING btree (operator_id)
// Table: pending_debts
//   CREATE INDEX pending_debts_active_vencido_idx ON public.pending_debts USING btree (is_active, valor_vencido DESC)
//   CREATE INDEX pending_debts_clean_cod_pess_idx ON public.pending_debts USING btree (regexp_replace(cod_pess_fat, '[^0-9]'::text, ''::text, 'g'::text))
//   CREATE INDEX pending_debts_clean_cpf_idx ON public.pending_debts USING btree (regexp_replace(pessoa_fatura_cpf_cnpj, '[^0-9]'::text, ''::text, 'g'::text))
//   CREATE INDEX pending_debts_clean_prop_cpf_idx ON public.pending_debts USING btree (regexp_replace(proprietario_cpf_cnpj, '[^0-9]'::text, ''::text, 'g'::text))
//   CREATE INDEX pending_debts_clean_resp_cpf_idx ON public.pending_debts USING btree (regexp_replace(responsavel_cpf_cnpj, '[^0-9]'::text, ''::text, 'g'::text))
//   CREATE INDEX pending_debts_cod_pess_fat_idx ON public.pending_debts USING btree (cod_pess_fat)
//   CREATE INDEX pending_debts_pessoa_fatura_cpf_cnpj_idx ON public.pending_debts USING btree (pessoa_fatura_cpf_cnpj)
//   CREATE INDEX pending_debts_proprietario_cpf_cnpj_idx ON public.pending_debts USING btree (proprietario_cpf_cnpj)
//   CREATE INDEX pending_debts_responsavel_cpf_cnpj_idx ON public.pending_debts USING btree (responsavel_cpf_cnpj)
//   CREATE INDEX pending_debts_valor_total_idx ON public.pending_debts USING btree (valor_total DESC)
// Table: portfolio_history
//   CREATE UNIQUE INDEX portfolio_history_snapshot_date_key ON public.portfolio_history USING btree (snapshot_date)
// Table: profiles
//   CREATE INDEX profiles_color_idx ON public.profiles USING btree (color)
// Table: reading_working_days_metrics
//   CREATE INDEX reading_working_days_metrics_data_leitura_real_idx ON public.reading_working_days_metrics USING btree (data_leitura_real)
//   CREATE INDEX reading_working_days_metrics_data_ref_idx ON public.reading_working_days_metrics USING btree (data_referencia)
//   CREATE INDEX reading_working_days_metrics_data_ref_uc_idx ON public.reading_working_days_metrics USING btree (data_referencia, uc, working_day_index)
//   CREATE UNIQUE INDEX reading_working_days_metrics_uc_data_referencia_key ON public.reading_working_days_metrics USING btree (uc, data_referencia)
// Table: researched_phones
//   CREATE UNIQUE INDEX researched_phones_uc_cod_pess_fat_key ON public.researched_phones USING btree (uc, cod_pess_fat)
// Table: serasa_blacklist
//   CREATE UNIQUE INDEX serasa_blacklist_cpf_cnpj_key ON public.serasa_blacklist USING btree (cpf_cnpj)
// Table: serasa_negativations
//   CREATE INDEX serasa_negativations_clean_cpf_idx ON public.serasa_negativations USING btree (regexp_replace(cpf_cnpj, '[^0-9]'::text, ''::text, 'g'::text))
//   CREATE UNIQUE INDEX serasa_negativations_cpf_cnpj_num_contrato_key ON public.serasa_negativations USING btree (cpf_cnpj, num_contrato)
//   CREATE INDEX serasa_negativations_ultima_verificacao_idx ON public.serasa_negativations USING btree (ultima_verificacao)
// Table: serasa_workflow
//   CREATE UNIQUE INDEX serasa_workflow_uc_cod_pess_fat_key ON public.serasa_workflow USING btree (uc, cod_pess_fat)
// Table: strategic_assignments
//   CREATE INDEX strategic_assignments_operator_idx ON public.strategic_assignments USING btree (operator_id)
//   CREATE INDEX strategic_assignments_uc_cod_pess_fat_idx ON public.strategic_assignments USING btree (uc, cod_pess_fat)
// Table: system_documentation
//   CREATE UNIQUE INDEX system_documentation_route_key ON public.system_documentation USING btree (route)
