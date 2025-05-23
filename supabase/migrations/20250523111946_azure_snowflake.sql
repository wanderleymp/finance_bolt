/*
  # Esquema inicial para o Finance AI

  1. Novas Tabelas
    - `users` - Usuários do sistema
    - `tenants` - Tenants (clientes) do sistema
    - `companies` - Empresas de cada tenant
    - `transactions` - Transações financeiras
    - `tasks` - Tarefas e atividades
    - `notifications` - Notificações do sistema
    - `ai_messages` - Mensagens do assistente IA
    - `tenant_users` - Relação entre tenants e usuários
    - `company_users` - Relação entre empresas e usuários

  2. Segurança
    - Habilitação de RLS em todas as tabelas
    - Políticas para autenticação e acesso aos dados
*/

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (vinculada à auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tenants (clientes)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'basic',
  logo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_favorite BOOLEAN,
  last_access TIMESTAMPTZ
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  is_headquarters BOOLEAN NOT NULL DEFAULT false,
  parent_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  logo TEXT,
  is_favorite BOOLEAN DEFAULT false,
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, cnpj)
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_method TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  link TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de mensagens do assistente IA
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID
);

-- Tabela de relacionamento entre tenants e usuários
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Tabela de relacionamento entre empresas e usuários
CREATE TABLE IF NOT EXISTS company_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para tenants
CREATE POLICY "Users can view tenants they belong to"
  ON tenants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = tenants.id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para empresas
CREATE POLICY "Users can view companies in their tenants"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users 
      WHERE tenant_id = companies.tenant_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para transações
CREATE POLICY "Users can view transactions of companies they have access to"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users 
      WHERE company_id = transactions.company_id 
      AND user_id = auth.uid()
    )
  );

-- Políticas para tarefas
CREATE POLICY "Users can view assigned tasks or tasks they created"
  ON tasks FOR SELECT
  USING (
    auth.uid() = assigned_to OR 
    auth.uid() = created_by
  );

-- Políticas para notificações
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas para mensagens IA
CREATE POLICY "Users can view their own AI messages"
  ON ai_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Política para tenant_users
CREATE POLICY "Users can view their tenant relationships"
  ON tenant_users FOR SELECT
  USING (auth.uid() = user_id);

-- Política para company_users
CREATE POLICY "Users can view their company relationships"
  ON company_users FOR SELECT
  USING (auth.uid() = user_id);