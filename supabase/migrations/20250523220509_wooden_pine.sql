/*
  # Correção da migração anterior

  1. Tabelas
    - Cria todas as tabelas necessárias se não existirem
    - Adiciona índices para melhorar performance
    - Habilita RLS para todas as tabelas
  
  2. Políticas
    - Verifica existência antes de criar políticas
    - Evita duplicação de políticas
*/

-- Desativar verificações de chaves estrangeiras durante a migração
SET session_replication_role = 'replica';

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  is_super BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  plano TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  limiteusuarios INTEGER,
  limitearmazenamento INTEGER,
  opcoescustomizadas JSONB,
  tema TEXT,
  recursoshabilitados JSONB,
  idiomas TEXT[],
  ativo BOOLEAN DEFAULT TRUE,
  slug TEXT UNIQUE,
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now()
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  is_headquarters BOOLEAN DEFAULT FALSE NOT NULL,
  parent_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  logo TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, cnpj)
);

-- Tabela de organizações
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE NOT NULL,
  link TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de mensagens AI
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID
);

-- Tabela de associação entre usuários e empresas
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, user_id)
);

-- Tabela de associação entre usuários e tenants
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, user_id)
);

-- Tabela de associação entre usuários e organizações
CREATE TABLE IF NOT EXISTS public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Tabela de planos SaaS
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0 NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
  user_limit INTEGER DEFAULT 1 NOT NULL,
  storage_limit INTEGER DEFAULT 1024 NOT NULL,
  is_recommended BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de módulos SaaS
CREATE TABLE IF NOT EXISTS public.saas_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_core BOOLEAN DEFAULT FALSE,
  price NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de associação entre planos e módulos
CREATE TABLE IF NOT EXISTS public.plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES saas_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES saas_modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, module_id)
);

-- Tabela de módulos de tenant
CREATE TABLE IF NOT EXISTS public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES saas_modules(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  activation_date TIMESTAMPTZ DEFAULT now(),
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, module_id)
);

-- Tabela de assinaturas de tenant
CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES saas_plans(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'active' NOT NULL,
  start_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  renewal_date TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
  amount NUMERIC(10,2) DEFAULT 0 NOT NULL,
  payment_method TEXT,
  is_auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de credenciais do sistema
CREATE TABLE IF NOT EXISTS public.system_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(provider, name)
);

-- Tabela de credenciais de tenant
CREATE TABLE IF NOT EXISTS public.tenant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  auth_type TEXT NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  override_system BOOLEAN DEFAULT FALSE NOT NULL,
  system_credential_id UUID REFERENCES system_credentials(id),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(tenant_id, provider, name)
);

-- Tabela de logs de testes de credenciais
CREATE TABLE IF NOT EXISTS public.credential_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL,
  credential_type TEXT NOT NULL,
  test_result BOOLEAN NOT NULL,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  executed_by UUID REFERENCES users(id),
  response_time INTEGER,
  details JSONB
);

-- Tabela de provedores de credenciais
CREATE TABLE IF NOT EXISTS public.credential_providers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  auth_types TEXT[] NOT NULL,
  fields JSONB NOT NULL,
  help_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de configurações de armazenamento
CREATE TABLE IF NOT EXISTS public.storage_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  config_type TEXT DEFAULT 'system' NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  credential_id UUID,
  settings JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  space_used BIGINT DEFAULT 0,
  space_limit BIGINT,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(provider, name, config_type, tenant_id)
);

-- Tabela de provedores de armazenamento
CREATE TABLE IF NOT EXISTS public.storage_providers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  credential_providers TEXT[] NOT NULL,
  settings_schema JSONB NOT NULL,
  features TEXT[] NOT NULL,
  help_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de módulos do sistema
CREATE TABLE IF NOT EXISTS public.system_modules (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  storage_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  required_features TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de mapeamento entre módulos e armazenamento
CREATE TABLE IF NOT EXISTS public.module_storage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT NOT NULL,
  storage_config_id UUID NOT NULL REFERENCES storage_configs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1 NOT NULL,
  settings JSONB,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(module_code, tenant_id, storage_config_id)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_module ON tenant_modules(module_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_configs_tenant ON storage_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_configs_provider ON storage_configs(provider);
CREATE INDEX IF NOT EXISTS idx_module_storage_tenant ON module_storage_mappings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_module_storage_module ON module_storage_mappings(module_code);
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_tenant ON tenant_credentials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_provider ON tenant_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_system_credentials_provider ON system_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_planos_nome ON planos(nome);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_storage_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'anyone_can_read_users') THEN
    CREATE POLICY "anyone_can_read_users" ON public.users
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'authenticated_users_can_insert_users') THEN
    CREATE POLICY "authenticated_users_can_insert_users" ON public.users
      FOR INSERT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON public.users
      FOR UPDATE USING (uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_can_update_own_profile') THEN
    CREATE POLICY "users_can_update_own_profile" ON public.users
      FOR UPDATE TO authenticated USING ((uid() = id) OR (uid() IN (
        SELECT users_1.id FROM users users_1
        WHERE (users_1.role = ANY (ARRAY['admin'::text, 'superadmin'::text]))
      )));
  END IF;
END
$$;

-- Políticas RLS para tenants (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'anyone_can_read_tenants') THEN
    CREATE POLICY "anyone_can_read_tenants" ON public.tenants
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'allow_tenant_creation') THEN
    CREATE POLICY "allow_tenant_creation" ON public.tenants
      FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'authenticated_users_can_select_tenants') THEN
    CREATE POLICY "authenticated_users_can_select_tenants" ON public.tenants
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'authenticated_users_can_insert_tenants') THEN
    CREATE POLICY "authenticated_users_can_insert_tenants" ON public.tenants
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'authenticated_users_can_update_tenants') THEN
    CREATE POLICY "authenticated_users_can_update_tenants" ON public.tenants
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenants' AND policyname = 'authenticated_users_can_delete_tenants') THEN
    CREATE POLICY "authenticated_users_can_delete_tenants" ON public.tenants
      FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- Políticas RLS para empresas (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Users can view companies in their tenants') THEN
    CREATE POLICY "Users can view companies in their tenants" ON public.companies
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_users.tenant_id = companies.tenant_id
        AND tenant_users.user_id = uid()
      ));
  END IF;
END
$$;

-- Políticas RLS para transações (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view transactions of companies they have access to') THEN
    CREATE POLICY "Users can view transactions of companies they have access to" ON public.transactions
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM company_users
        WHERE company_users.company_id = transactions.company_id
        AND company_users.user_id = uid()
      ));
  END IF;
END
$$;

-- Políticas RLS para tarefas (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view assigned tasks or tasks they created') THEN
    CREATE POLICY "Users can view assigned tasks or tasks they created" ON public.tasks
      FOR SELECT USING ((uid() = assigned_to) OR (uid() = created_by));
  END IF;
END
$$;

-- Políticas RLS para notificações (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (uid() = user_id);
  END IF;
END
$$;

-- Políticas RLS para mensagens AI (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_messages' AND policyname = 'Users can view their own AI messages') THEN
    CREATE POLICY "Users can view their own AI messages" ON public.ai_messages
      FOR SELECT USING (uid() = user_id);
  END IF;
END
$$;

-- Políticas RLS para associações de usuários e empresas (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'company_users' AND policyname = 'Users can view their company relationships') THEN
    CREATE POLICY "Users can view their company relationships" ON public.company_users
      FOR SELECT USING (uid() = user_id);
  END IF;
END
$$;

-- Políticas RLS para associações de usuários e tenants (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_users' AND policyname = 'anyone_can_read_tenant_users') THEN
    CREATE POLICY "anyone_can_read_tenant_users" ON public.tenant_users
      FOR SELECT USING (true);
  END IF;
END
$$;

-- Políticas RLS para associações de usuários e organizações (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'allow_organization_users_select') THEN
    CREATE POLICY "allow_organization_users_select" ON public.organization_users
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'allow_organization_users_insert') THEN
    CREATE POLICY "allow_organization_users_insert" ON public.organization_users
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'allow_organization_users_update') THEN
    CREATE POLICY "allow_organization_users_update" ON public.organization_users
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'allow_organization_users_delete') THEN
    CREATE POLICY "allow_organization_users_delete" ON public.organization_users
      FOR DELETE USING (true);
  END IF;
END
$$;

-- Políticas RLS para planos SaaS (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_plans' AND policyname = 'anyone_can_read_plans') THEN
    CREATE POLICY "anyone_can_read_plans" ON public.saas_plans
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_plans' AND policyname = 'anyone_can_modify_plans') THEN
    CREATE POLICY "anyone_can_modify_plans" ON public.saas_plans
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Políticas RLS para módulos SaaS (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_modules' AND policyname = 'anyone_can_read_modules') THEN
    CREATE POLICY "anyone_can_read_modules" ON public.saas_modules
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saas_modules' AND policyname = 'anyone_can_modify_modules') THEN
    CREATE POLICY "anyone_can_modify_modules" ON public.saas_modules
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Políticas RLS para associações de planos e módulos (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_modules' AND policyname = 'allow_select_plan_modules') THEN
    CREATE POLICY "allow_select_plan_modules" ON public.plan_modules
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_modules' AND policyname = 'allow_insert_plan_modules') THEN
    CREATE POLICY "allow_insert_plan_modules" ON public.plan_modules
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_modules' AND policyname = 'allow_update_plan_modules') THEN
    CREATE POLICY "allow_update_plan_modules" ON public.plan_modules
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'plan_modules' AND policyname = 'allow_delete_plan_modules') THEN
    CREATE POLICY "allow_delete_plan_modules" ON public.plan_modules
      FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- Políticas RLS para módulos de tenant (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_modules' AND policyname = 'anyone_can_read_tenant_modules') THEN
    CREATE POLICY "anyone_can_read_tenant_modules" ON public.tenant_modules
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_modules' AND policyname = 'anyone_can_modify_tenant_modules') THEN
    CREATE POLICY "anyone_can_modify_tenant_modules" ON public.tenant_modules
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END
$$;

-- Políticas RLS para assinaturas de tenant (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'anyone_can_select_tenant_subscriptions') THEN
    CREATE POLICY "anyone_can_select_tenant_subscriptions" ON public.tenant_subscriptions
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'anyone_can_insert_tenant_subscriptions') THEN
    CREATE POLICY "anyone_can_insert_tenant_subscriptions" ON public.tenant_subscriptions
      FOR INSERT TO public WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'anyone_can_update_tenant_subscriptions') THEN
    CREATE POLICY "anyone_can_update_tenant_subscriptions" ON public.tenant_subscriptions
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_subscriptions' AND policyname = 'anyone_can_delete_tenant_subscriptions') THEN
    CREATE POLICY "anyone_can_delete_tenant_subscriptions" ON public.tenant_subscriptions
      FOR DELETE TO authenticated USING (true);
  END IF;
END
$$;

-- Políticas RLS para credenciais do sistema (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_credentials' AND policyname = 'users_can_view_active_system_credentials') THEN
    CREATE POLICY "users_can_view_active_system_credentials" ON public.system_credentials
      FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_credentials' AND policyname = 'admins_can_manage_system_credentials') THEN
    CREATE POLICY "admins_can_manage_system_credentials" ON public.system_credentials
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para credenciais de tenant (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_credentials' AND policyname = 'tenant_users_can_view_tenant_credentials') THEN
    CREATE POLICY "tenant_users_can_view_tenant_credentials" ON public.tenant_credentials
      FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_users.tenant_id = tenant_credentials.tenant_id
        AND tenant_users.user_id = uid()
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_credentials' AND policyname = 'tenant_admins_can_manage_tenant_credentials') THEN
    CREATE POLICY "tenant_admins_can_manage_tenant_credentials" ON public.tenant_credentials
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_users.tenant_id = tenant_credentials.tenant_id
        AND tenant_users.user_id = uid()
        AND tenant_users.role = 'admin'
      ));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tenant_credentials' AND policyname = 'system_admins_can_manage_all_tenant_credentials') THEN
    CREATE POLICY "system_admins_can_manage_all_tenant_credentials" ON public.tenant_credentials
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para logs de testes de credenciais (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credential_test_logs' AND policyname = 'tenant_admins_can_view_tenant_test_logs') THEN
    CREATE POLICY "tenant_admins_can_view_tenant_test_logs" ON public.credential_test_logs
      FOR SELECT TO authenticated USING (
        (credential_type = 'tenant' AND EXISTS (
          SELECT 1 FROM tenant_credentials tc
          JOIN tenant_users tu ON tc.tenant_id = tu.tenant_id
          WHERE tc.id = credential_test_logs.credential_id
          AND tu.user_id = uid()
          AND tu.role = 'admin'
        ))
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credential_test_logs' AND policyname = 'admins_can_view_all_test_logs') THEN
    CREATE POLICY "admins_can_view_all_test_logs" ON public.credential_test_logs
      FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para provedores de credenciais (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credential_providers' AND policyname = 'anyone_can_read_credential_providers') THEN
    CREATE POLICY "anyone_can_read_credential_providers" ON public.credential_providers
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credential_providers' AND policyname = 'admins_can_manage_credential_providers') THEN
    CREATE POLICY "admins_can_manage_credential_providers" ON public.credential_providers
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para configurações de armazenamento (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_configs' AND policyname = 'users_can_view_their_storage_configs') THEN
    CREATE POLICY "users_can_view_their_storage_configs" ON public.storage_configs
      FOR SELECT TO authenticated USING (
        ((config_type = 'system' AND is_active = true) OR
        (config_type = 'tenant' AND EXISTS (
          SELECT 1 FROM tenant_users
          WHERE tenant_users.tenant_id = storage_configs.tenant_id
          AND tenant_users.user_id = uid()
        )))
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_configs' AND policyname = 'admins_can_manage_system_storage') THEN
    CREATE POLICY "admins_can_manage_system_storage" ON public.storage_configs
      FOR ALL TO authenticated USING (
        (config_type = 'system' AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = uid()
          AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
        ))
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_configs' AND policyname = 'tenant_admins_can_manage_tenant_storage') THEN
    CREATE POLICY "tenant_admins_can_manage_tenant_storage" ON public.storage_configs
      FOR ALL TO authenticated USING (
        (config_type = 'tenant' AND EXISTS (
          SELECT 1 FROM tenant_users
          WHERE tenant_users.tenant_id = storage_configs.tenant_id
          AND tenant_users.user_id = uid()
          AND tenant_users.role = 'admin'
        ))
      );
  END IF;
END
$$;

-- Políticas RLS para provedores de armazenamento (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_providers' AND policyname = 'anyone_can_read_storage_providers') THEN
    CREATE POLICY "anyone_can_read_storage_providers" ON public.storage_providers
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'storage_providers' AND policyname = 'admins_can_manage_storage_providers') THEN
    CREATE POLICY "admins_can_manage_storage_providers" ON public.storage_providers
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para módulos do sistema (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_modules' AND policyname = 'anyone_can_read_system_modules') THEN
    CREATE POLICY "anyone_can_read_system_modules" ON public.system_modules
      FOR SELECT TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_modules' AND policyname = 'admins_can_manage_system_modules') THEN
    CREATE POLICY "admins_can_manage_system_modules" ON public.system_modules
      FOR ALL TO authenticated USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = uid()
        AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
      ));
  END IF;
END
$$;

-- Políticas RLS para mapeamentos de módulos e armazenamento (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_storage_mappings' AND policyname = 'users_can_view_their_module_mappings') THEN
    CREATE POLICY "users_can_view_their_module_mappings" ON public.module_storage_mappings
      FOR SELECT TO authenticated USING (
        (tenant_id IS NULL OR EXISTS (
          SELECT 1 FROM tenant_users
          WHERE tenant_users.tenant_id = module_storage_mappings.tenant_id
          AND tenant_users.user_id = uid()
        ))
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_storage_mappings' AND policyname = 'admins_can_manage_system_mappings') THEN
    CREATE POLICY "admins_can_manage_system_mappings" ON public.module_storage_mappings
      FOR ALL TO authenticated USING (
        (tenant_id IS NULL AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = uid()
          AND ((users.role = ANY (ARRAY['admin', 'superadmin'])) OR (users.is_super = true))
        ))
      );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'module_storage_mappings' AND policyname = 'tenant_admins_can_manage_tenant_mappings') THEN
    CREATE POLICY "tenant_admins_can_manage_tenant_mappings" ON public.module_storage_mappings
      FOR ALL TO authenticated USING (
        (tenant_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM tenant_users
          WHERE tenant_users.tenant_id = module_storage_mappings.tenant_id
          AND tenant_users.user_id = uid()
          AND tenant_users.role = 'admin'
        ))
      );
  END IF;
END
$$;

-- Políticas RLS para organizações (verificando existência antes de criar)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'allow_organization_select') THEN
    CREATE POLICY "allow_organization_select" ON public.organizations
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'allow_organization_insert') THEN
    CREATE POLICY "allow_organization_insert" ON public.organizations
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'allow_organization_update') THEN
    CREATE POLICY "allow_organization_update" ON public.organizations
      FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizations' AND policyname = 'allow_organization_delete') THEN
    CREATE POLICY "allow_organization_delete" ON public.organizations
      FOR DELETE USING (true);
  END IF;
END
$$;

-- Reativar verificações de chaves estrangeiras
SET session_replication_role = 'origin';