export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Esta interface será preenchida automaticamente quando gerarmos os tipos do Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: string
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: string
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tenants: {
        Row: {
          id: string
          nome: string
          plano: string
          logo: string | null
          createdAt: string
          updatedAt: string
          ativo: boolean
          status: string
          slug: string | null
          limiteusuarios: number | null
          limitearmazenamento: number | null
          opcoescustomizadas: Json | null
          tema: string | null
          recursoshabilitados: Json | null
          idiomas: string[] | null
        }
        Insert: {
          id?: string
          nome: string
          plano?: string
          logo?: string | null
          createdAt?: string
          updatedAt?: string
          ativo?: boolean
          status?: string
          slug?: string | null
          limiteusuarios?: number | null
          limitearmazenamento?: number | null
          opcoescustomizadas?: Json | null
          tema?: string | null
          recursoshabilitados?: Json | null
          idiomas?: string[] | null
        }
        Update: {
          id?: string
          nome?: string
          plano?: string
          logo?: string | null
          createdAt?: string
          updatedAt?: string
          ativo?: boolean
          status?: string
          slug?: string | null
          limiteusuarios?: number | null
          limitearmazenamento?: number | null
          opcoescustomizadas?: Json | null
          tema?: string | null
          recursoshabilitados?: Json | null
          idiomas?: string[] | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          tenant_id: string
          cnpj: string
          razao_social: string
          nome_fantasia: string
          is_headquarters: boolean
          parent_id: string | null
          logo: string | null
          is_favorite: boolean | null
          last_access: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          cnpj: string
          razao_social: string
          nome_fantasia: string
          is_headquarters?: boolean
          parent_id?: string | null
          logo?: string | null
          is_favorite?: boolean | null
          last_access?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          cnpj?: string
          razao_social?: string
          nome_fantasia?: string
          is_headquarters?: boolean
          parent_id?: string | null
          logo?: string | null
          is_favorite?: boolean | null
          last_access?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          logo: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          contact_email: string | null
          contact_phone: string | null
          address: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string | null
          logo?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string | null
          logo?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      organization_users: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          created_at?: string
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
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          company_id: string
          type: string
          category: string
          amount: number
          date: string
          description: string
          status: string
          payment_method: string | null
          attachments: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          category: string
          amount: number
          date: string
          description: string
          status: string
          payment_method?: string | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          category?: string
          amount?: number
          date?: string
          description?: string
          status?: string
          payment_method?: string | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          due_date: string | null
          status: string
          priority: string
          assigned_to: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          due_date?: string | null
          status: string
          priority: string
          assigned_to?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          status?: string
          priority?: string
          assigned_to?: string | null
          created_by?: string
          created_at?: string
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
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          read: boolean
          created_at: string
          link: string | null
          user_id: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          read?: boolean
          created_at?: string
          link?: string | null
          user_id: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          created_at?: string
          link?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_messages: {
        Row: {
          id: string
          role: string
          content: string
          timestamp: string
          user_id: string
          conversation_id: string | null
        }
        Insert: {
          id?: string
          role: string
          content: string
          timestamp?: string
          user_id: string
          conversation_id?: string | null
        }
        Update: {
          id?: string
          role?: string
          content?: string
          timestamp?: string
          user_id?: string
          conversation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: string
          created_at?: string
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
          }
        ]
      }
      company_users: {
        Row: {
          id: string
          company_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: string
          created_at?: string
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
          }
        ]
      }
      saas_modules: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          icon: string | null
          is_core: boolean
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          icon?: string | null
          is_core?: boolean
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          icon?: string | null
          is_core?: boolean
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      saas_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          billing_cycle: string
          user_limit: number
          storage_limit: number
          is_recommended: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          billing_cycle?: string
          user_limit?: number
          storage_limit?: number
          is_recommended?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          billing_cycle?: string
          user_limit?: number
          storage_limit?: number
          is_recommended?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_modules: {
        Row: {
          id: string
          plan_id: string
          module_id: string
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          module_id: string
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          module_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_modules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_modules: {
        Row: {
          id: string
          tenant_id: string
          module_id: string
          is_active: boolean
          activation_date: string
          expiration_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          module_id: string
          is_active?: boolean
          activation_date?: string
          expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          module_id?: string
          is_active?: boolean
          activation_date?: string
          expiration_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_modules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "saas_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          status: string
          start_date: string
          renewal_date: string | null
          billing_cycle: string
          amount: number
          payment_method: string | null
          is_auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id: string
          status?: string
          start_date?: string
          renewal_date?: string | null
          billing_cycle?: string
          amount?: number
          payment_method?: string | null
          is_auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_id?: string
          status?: string
          start_date?: string
          renewal_date?: string | null
          billing_cycle?: string
          amount?: number
          payment_method?: string | null
          is_auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}