export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_agent_conversations: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          last_message_at: string | null
          metadata: Json | null
          status: string
          tenant_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          status?: string
          tenant_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          status?: string
          tenant_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          message_id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          message_id: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          message_id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          function_arguments: Json | null
          function_call: Json | null
          function_name: string | null
          function_result: Json | null
          id: string
          role: string
          tokens_used: number | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          function_arguments?: Json | null
          function_call?: Json | null
          function_name?: string | null
          function_result?: Json | null
          id?: string
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          function_arguments?: Json | null
          function_call?: Json | null
          function_name?: string | null
          function_result?: Json | null
          id?: string
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          model_id: string | null
          name: string
          parameters: Json
          personality: Json | null
          system_prompt: string | null
          tools: Json[] | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          model_id?: string | null
          name: string
          parameters?: Json
          personality?: Json | null
          system_prompt?: string | null
          tools?: Json[] | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          model_id?: string | null
          name?: string
          parameters?: Json
          personality?: Json | null
          system_prompt?: string | null
          tools?: Json[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_templates_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_tools: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          function_schema: Json
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          requires_auth: boolean
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          function_schema: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          requires_auth?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          function_schema?: Json
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          requires_auth?: boolean
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_tools_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fallback_model_id: string | null
          id: string
          is_active: boolean
          is_system: boolean
          knowledge_base_ids: string[] | null
          model_id: string | null
          name: string
          parameters: Json
          personality: Json | null
          system_prompt: string | null
          tenant_id: string | null
          tools: Json[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_model_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          knowledge_base_ids?: string[] | null
          model_id?: string | null
          name: string
          parameters?: Json
          personality?: Json | null
          system_prompt?: string | null
          tenant_id?: string | null
          tools?: Json[] | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fallback_model_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          knowledge_base_ids?: string[] | null
          model_id?: string | null
          name?: string
          parameters?: Json
          personality?: Json | null
          system_prompt?: string | null
          tenant_id?: string | null
          tools?: Json[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_fallback_model_id_fkey"
            columns: ["fallback_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_document_chunks: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string
          document_id: string
          embedding_data: Json | null
          id: string
          metadata: Json | null
          tokens_used: number | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string
          document_id: string
          embedding_data?: Json | null
          id?: string
          metadata?: Json | null
          tokens_used?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string
          document_id?: string
          embedding_data?: Json | null
          id?: string
          metadata?: Json | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_bases: {
        Row: {
          chunk_overlap: number
          chunk_size: number
          created_at: string
          created_by: string | null
          description: string | null
          embedding_model_id: string | null
          id: string
          is_active: boolean
          is_system: boolean
          metadata: Json | null
          name: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          chunk_overlap?: number
          chunk_size?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_model_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json | null
          name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          chunk_overlap?: number
          chunk_size?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_model_id?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          metadata?: Json | null
          name?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_bases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_bases_embedding_model_id_fkey"
            columns: ["embedding_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_bases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_documents: {
        Row: {
          chunks_count: number | null
          content: string | null
          created_at: string
          created_by: string | null
          embedding_status: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          knowledge_base_id: string
          metadata: Json | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          chunks_count?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          embedding_status?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          knowledge_base_id: string
          metadata?: Json | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          chunks_count?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          embedding_status?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          knowledge_base_id?: string
          metadata?: Json | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_knowledge_documents_knowledge_base_id_fkey"
            columns: ["knowledge_base_id"]
            isOneToOne: false
            referencedRelation: "ai_knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string | null
          id: string
          role: string
          timestamp: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          id?: string
          role: string
          timestamp?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          id?: string
          role?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          is_favorite: boolean | null
          is_headquarters: boolean
          last_access: string | null
          logo: string | null
          nome_fantasia: string
          parent_id: string | null
          razao_social: string
          tenant_id: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          is_headquarters?: boolean
          last_access?: string | null
          logo?: string | null
          nome_fantasia: string
          parent_id?: string | null
          razao_social: string
          tenant_id: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          is_headquarters?: boolean
          last_access?: string | null
          logo?: string | null
          nome_fantasia?: string
          parent_id?: string | null
          razao_social?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_providers: {
        Row: {
          auth_types: string[]
          code: string
          created_at: string
          description: string | null
          fields: Json
          help_url: string | null
          icon: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          auth_types: string[]
          code: string
          created_at?: string
          description?: string | null
          fields: Json
          help_url?: string | null
          icon?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          auth_types?: string[]
          code?: string
          created_at?: string
          description?: string | null
          fields?: Json
          help_url?: string | null
          icon?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credential_test_logs: {
        Row: {
          credential_id: string
          credential_type: string
          details: Json | null
          error_message: string | null
          executed_at: string
          executed_by: string | null
          id: string
          response_time: number | null
          test_result: boolean
        }
        Insert: {
          credential_id: string
          credential_type: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          response_time?: number | null
          test_result: boolean
        }
        Update: {
          credential_id?: string
          credential_type?: string
          details?: Json | null
          error_message?: string | null
          executed_at?: string
          executed_by?: string | null
          id?: string
          response_time?: number | null
          test_result?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "credential_test_logs_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_budget_settings: {
        Row: {
          action_on_limit_reached: string
          alert_threshold_percent: number
          created_at: string
          daily_limit: number | null
          id: string
          is_active: boolean
          monthly_budget: number
          tenant_id: string
          token_limit_per_day: number | null
          token_limit_per_hour: number | null
          updated_at: string
        }
        Insert: {
          action_on_limit_reached?: string
          alert_threshold_percent?: number
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          monthly_budget?: number
          tenant_id: string
          token_limit_per_day?: number | null
          token_limit_per_hour?: number | null
          updated_at?: string
        }
        Update: {
          action_on_limit_reached?: string
          alert_threshold_percent?: number
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_active?: boolean
          monthly_budget?: number
          tenant_id?: string
          token_limit_per_day?: number | null
          token_limit_per_hour?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_budget_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_models: {
        Row: {
          code: string
          context_window: number
          created_at: string
          description: string | null
          id: string
          input_price_per_1k_tokens: number
          is_active: boolean
          max_tokens: number
          name: string
          output_price_per_1k_tokens: number
          performance_rating: number | null
          provider_id: string
          specialization: string[] | null
          supports_functions: boolean
          supports_streaming: boolean
          supports_vision: boolean
          updated_at: string
        }
        Insert: {
          code: string
          context_window: number
          created_at?: string
          description?: string | null
          id?: string
          input_price_per_1k_tokens: number
          is_active?: boolean
          max_tokens: number
          name: string
          output_price_per_1k_tokens: number
          performance_rating?: number | null
          provider_id: string
          specialization?: string[] | null
          supports_functions?: boolean
          supports_streaming?: boolean
          supports_vision?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          context_window?: number
          created_at?: string
          description?: string | null
          id?: string
          input_price_per_1k_tokens?: number
          is_active?: boolean
          max_tokens?: number
          name?: string
          output_price_per_1k_tokens?: number
          performance_rating?: number | null
          provider_id?: string
          specialization?: string[] | null
          supports_functions?: boolean
          supports_streaming?: boolean
          supports_vision?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "llm_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_provider_credentials: {
        Row: {
          created_at: string
          created_by: string | null
          credentials: Json
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_system: boolean
          last_test_at: string | null
          last_used_at: string | null
          name: string
          provider_id: string
          tenant_id: string | null
          test_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credentials: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          last_test_at?: string | null
          last_used_at?: string | null
          name: string
          provider_id: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credentials?: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          last_test_at?: string | null
          last_used_at?: string | null
          name?: string
          provider_id?: string
          tenant_id?: string | null
          test_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_provider_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_provider_credentials_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "llm_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_provider_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_providers: {
        Row: {
          api_endpoint: string | null
          auth_method: string
          code: string
          created_at: string
          description: string | null
          documentation_url: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          rate_limit_period: string | null
          rate_limit_requests: number | null
          rate_limit_tokens: number | null
          status: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          auth_method?: string
          code: string
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          rate_limit_period?: string | null
          rate_limit_requests?: number | null
          rate_limit_tokens?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          auth_method?: string
          code?: string
          created_at?: string
          description?: string | null
          documentation_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rate_limit_period?: string | null
          rate_limit_requests?: number | null
          rate_limit_tokens?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      llm_usage_logs: {
        Row: {
          completion_tokens: number
          created_at: string
          duration_ms: number | null
          error_message: string | null
          estimated_cost: number
          id: string
          metadata: Json | null
          model_id: string | null
          prompt_tokens: number
          provider_id: string | null
          request_id: string | null
          status: string
          tenant_id: string | null
          total_tokens: number
          user_id: string | null
        }
        Insert: {
          completion_tokens: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost: number
          id?: string
          metadata?: Json | null
          model_id?: string | null
          prompt_tokens: number
          provider_id?: string | null
          request_id?: string | null
          status: string
          tenant_id?: string | null
          total_tokens: number
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost?: number
          id?: string
          metadata?: Json | null
          model_id?: string | null
          prompt_tokens?: number
          provider_id?: string | null
          request_id?: string | null
          status?: string
          tenant_id?: string | null
          total_tokens?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "llm_usage_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_usage_logs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "llm_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      module_storage_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          module_code: string
          priority: number
          settings: Json | null
          storage_config_id: string
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module_code: string
          priority?: number
          settings?: Json | null
          storage_config_id: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module_code?: string
          priority?: number
          settings?: Json | null
          storage_config_id?: string
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_storage_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_storage_mappings_storage_config_id_fkey"
            columns: ["storage_config_id"]
            isOneToOne: false
            referencedRelation: "storage_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_storage_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_storage_mappings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          module_code: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_code?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_code?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_modules: {
        Row: {
          created_at: string | null
          id: string
          module_id: string
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id: string
          plan_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          armazenamento: number
          ativo: boolean
          atualizado_em: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          limiteusuarios: number
          nome: string
          preco: number
          recomendado: boolean
        }
        Insert: {
          armazenamento?: number
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          limiteusuarios?: number
          nome: string
          preco?: number
          recomendado?: boolean
        }
        Update: {
          armazenamento?: number
          ativo?: boolean
          atualizado_em?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          limiteusuarios?: number
          nome?: string
          preco?: number
          recomendado?: boolean
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_modules: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_core: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_core?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saas_plans: {
        Row: {
          billing_cycle: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_recommended: boolean | null
          name: string
          price: number
          storage_limit: number
          updated_at: string | null
          user_limit: number
        }
        Insert: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name: string
          price?: number
          storage_limit?: number
          updated_at?: string | null
          user_limit?: number
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_recommended?: boolean | null
          name?: string
          price?: number
          storage_limit?: number
          updated_at?: string | null
          user_limit?: number
        }
        Relationships: []
      }
      storage_configs: {
        Row: {
          config_type: string
          created_at: string
          created_by: string | null
          credential_id: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          last_sync_at: string | null
          name: string
          provider: string
          settings: Json
          space_limit: number | null
          space_used: number | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_type?: string
          created_at?: string
          created_by?: string | null
          credential_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          name: string
          provider: string
          settings: Json
          space_limit?: number | null
          space_used?: number | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_type?: string
          created_at?: string
          created_by?: string | null
          credential_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          last_sync_at?: string | null
          name?: string
          provider?: string
          settings?: Json
          space_limit?: number | null
          space_used?: number | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "storage_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_providers: {
        Row: {
          code: string
          created_at: string
          credential_providers: string[]
          description: string | null
          features: string[]
          help_url: string | null
          icon: string | null
          is_active: boolean
          name: string
          settings_schema: Json
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          credential_providers: string[]
          description?: string | null
          features: string[]
          help_url?: string | null
          icon?: string | null
          is_active?: boolean
          name: string
          settings_schema: Json
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          credential_providers?: string[]
          description?: string | null
          features?: string[]
          help_url?: string | null
          icon?: string | null
          is_active?: boolean
          name?: string
          settings_schema?: Json
          updated_at?: string
        }
        Relationships: []
      }
      system_credentials: {
        Row: {
          auth_type: string
          created_at: string
          created_by: string | null
          credentials: Json
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          metadata: Json | null
          name: string
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auth_type: string
          created_at?: string
          created_by?: string | null
          credentials: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auth_type?: string
          created_at?: string
          created_by?: string | null
          credentials?: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_credentials_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_modules: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          is_active: boolean
          name: string
          required_features: string[] | null
          storage_enabled: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          name: string
          required_features?: string[] | null
          storage_enabled?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          is_active?: boolean
          name?: string
          required_features?: string[] | null
          storage_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority: string
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_credentials: {
        Row: {
          auth_type: string
          created_at: string
          created_by: string | null
          credentials: Json
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          metadata: Json | null
          name: string
          override_system: boolean
          provider: string
          system_credential_id: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auth_type: string
          created_at?: string
          created_by?: string | null
          credentials: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          override_system?: boolean
          provider: string
          system_credential_id?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auth_type?: string
          created_at?: string
          created_by?: string | null
          credentials?: Json
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          override_system?: boolean
          provider?: string
          system_credential_id?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_credentials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_credentials_system_credential_id_fkey"
            columns: ["system_credential_id"]
            isOneToOne: false
            referencedRelation: "system_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_credentials_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_llm_settings: {
        Row: {
          created_at: string
          credential_id: string | null
          default_model_id: string | null
          default_parameters: Json
          default_provider_id: string | null
          fallback_model_id: string | null
          id: string
          is_active: boolean
          tenant_id: string
          updated_at: string
          use_system_credentials: boolean
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          default_model_id?: string | null
          default_parameters?: Json
          default_provider_id?: string | null
          fallback_model_id?: string | null
          id?: string
          is_active?: boolean
          tenant_id: string
          updated_at?: string
          use_system_credentials?: boolean
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          default_model_id?: string | null
          default_parameters?: Json
          default_provider_id?: string | null
          fallback_model_id?: string | null
          id?: string
          is_active?: boolean
          tenant_id?: string
          updated_at?: string
          use_system_credentials?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_llm_settings_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "llm_provider_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_llm_settings_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_llm_settings_default_provider_id_fkey"
            columns: ["default_provider_id"]
            isOneToOne: false
            referencedRelation: "llm_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_llm_settings_fallback_model_id_fkey"
            columns: ["fallback_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_llm_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_modules: {
        Row: {
          activation_date: string | null
          created_at: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          module_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          activation_date?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          module_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          activation_date?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string | null
          id: string
          is_auto_renew: boolean | null
          payment_method: string | null
          plan_id: string
          renewal_date: string | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          billing_cycle?: string
          created_at?: string | null
          id?: string
          is_auto_renew?: boolean | null
          payment_method?: string | null
          plan_id: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string | null
          id?: string
          is_auto_renew?: boolean | null
          payment_method?: string | null
          plan_id?: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          ativo: boolean | null
          createdAt: string | null
          id: string
          idiomas: string[] | null
          limitearmazenamento: number | null
          limiteusuarios: number | null
          nome: string
          opcoescustomizadas: Json | null
          plano: string
          recursoshabilitados: Json | null
          slug: string | null
          status: string
          tema: string | null
          updatedAt: string | null
        }
        Insert: {
          ativo?: boolean | null
          createdAt?: string | null
          id?: string
          idiomas?: string[] | null
          limitearmazenamento?: number | null
          limiteusuarios?: number | null
          nome: string
          opcoescustomizadas?: Json | null
          plano: string
          recursoshabilitados?: Json | null
          slug?: string | null
          status?: string
          tema?: string | null
          updatedAt?: string | null
        }
        Update: {
          ativo?: boolean | null
          createdAt?: string | null
          id?: string
          idiomas?: string[] | null
          limitearmazenamento?: number | null
          limiteusuarios?: number | null
          nome?: string
          opcoescustomizadas?: Json | null
          plano?: string
          recursoshabilitados?: Json | null
          slug?: string | null
          status?: string
          tema?: string | null
          updatedAt?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          attachments: string[] | null
          category: string
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          payment_method: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          attachments?: string[] | null
          category: string
          company_id: string
          created_at?: string
          date: string
          description: string
          id?: string
          payment_method?: string | null
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachments?: string[] | null
          category?: string
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          payment_method?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_super: boolean | null
          name: string | null
          password_hash: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_super?: boolean | null
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_super?: boolean | null
          name?: string | null
          password_hash?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_llm_usage_cost: {
        Args: {
          model_id: string
          prompt_tokens: number
          completion_tokens: number
        }
        Returns: number
      }
      check_llm_budget_limits: {
        Args: { tenant_id: string }
        Returns: Json
      }
      generate_rbac_claims: {
        Args: { uid: string }
        Returns: Json
      }
      get_agent_context: {
        Args: { agent_id: string }
        Returns: Json
      }
      get_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      jwt_with_rbac: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_agent_message: {
        Args: {
          p_agent_id: string
          p_user_id: string
          p_content: string
          p_conversation_id?: string
        }
        Returns: Json
      }
      semantic_search: {
        Args: { p_query: string; p_knowledge_base_id: string; p_limit?: number }
        Returns: {
          document_id: string
          document_title: string
          chunk_content: string
          similarity: number
        }[]
      }
      test_llm_provider_connection: {
        Args: { provider_id: string; credentials: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
