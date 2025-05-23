/*
  # Criação de tabelas para o módulo SaaS

  1. Novas Tabelas
    - `saas_modules`: Armazena os módulos do sistema
      - `id` (uuid, chave primária)
      - `name` (texto, nome do módulo)
      - `code` (texto, código único do módulo)
      - `description` (texto, descrição do módulo)
      - `icon` (texto, nome do ícone Lucide)
      - `is_core` (boolean, se é um módulo essencial)
      - `price` (numeric, preço do módulo)
      - `is_active` (boolean, se está ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `saas_plans`: Armazena os planos do sistema
      - `id` (uuid, chave primária)
      - `name` (texto, nome do plano)
      - `description` (texto, descrição do plano)
      - `price` (numeric, preço do plano)
      - `billing_cycle` (texto, ciclo de faturamento)
      - `user_limit` (integer, limite de usuários)
      - `storage_limit` (integer, limite de armazenamento em MB)
      - `is_recommended` (boolean, se é o plano recomendado)
      - `is_active` (boolean, se está ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `plan_modules`: Tabela de relacionamento entre planos e módulos
      - `id` (uuid, chave primária)
      - `plan_id` (uuid, referência ao plano)
      - `module_id` (uuid, referência ao módulo)
      - `created_at` (timestamp)

    - `tenant_modules`: Tabela de relacionamento entre tenants e módulos
      - `id` (uuid, chave primária)
      - `tenant_id` (uuid, referência ao tenant)
      - `module_id` (uuid, referência ao módulo)
      - `is_active` (boolean, se está ativo para o tenant)
      - `activation_date` (timestamp, data de ativação)
      - `expiration_date` (timestamp, data de expiração, opcional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `tenant_subscriptions`: Armazena as assinaturas de tenants
      - `id` (uuid, chave primária)
      - `tenant_id` (uuid, referência ao tenant)
      - `plan_id` (uuid, referência ao plano)
      - `status` (texto, status da assinatura)
      - `start_date` (timestamp, data de início)
      - `renewal_date` (timestamp, data de renovação)
      - `billing_cycle` (texto, ciclo de faturamento)
      - `amount` (numeric, valor da assinatura)
      - `payment_method` (texto, método de pagamento)
      - `is_auto_renew` (boolean, se renova automaticamente)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Segurança
    - Ativar RLS em todas as tabelas
    - Adicionar políticas para administradores
*/

-- Criar tabela de módulos
CREATE TABLE IF NOT EXISTS saas_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_core BOOLEAN DEFAULT FALSE,
  price NUMERIC(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de planos
CREATE TABLE IF NOT EXISTS saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  user_limit INTEGER NOT NULL DEFAULT 1,
  storage_limit INTEGER NOT NULL DEFAULT 1024, -- 1GB em MB
  is_recommended BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de relacionamento entre planos e módulos
CREATE TABLE IF NOT EXISTS plan_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES saas_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES saas_modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, module_id)
);

-- Criar tabela de relacionamento entre tenants e módulos
CREATE TABLE IF NOT EXISTS tenant_modules (
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

-- Criar tabela de assinaturas de tenants
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES saas_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  renewal_date TIMESTAMPTZ,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  is_auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aplicar RLS
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas de acesso para admins
CREATE POLICY "Admins can manage all modules" ON saas_modules 
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all plans" ON saas_plans 
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all plan modules" ON plan_modules 
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all tenant modules" ON tenant_modules 
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage all subscriptions" ON tenant_subscriptions 
  FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Permitir acesso de leitura para usuários autenticados aos módulos ativos
CREATE POLICY "Users can view active modules" ON saas_modules 
  FOR SELECT USING (is_active = true);

-- Permitir acesso de leitura para usuários autenticados aos planos ativos
CREATE POLICY "Users can view active plans" ON saas_plans 
  FOR SELECT USING (is_active = true);

-- Permitir que usuários vejam módulos de seus planos
CREATE POLICY "Users can view their plan modules" ON plan_modules 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_subscriptions ts
      JOIN tenant_users tu ON ts.tenant_id = tu.tenant_id
      WHERE ts.plan_id = plan_modules.plan_id
      AND tu.user_id = auth.uid()
    )
  );

-- Permitir que usuários vejam módulos de seus tenants
CREATE POLICY "Users can view their tenant modules" ON tenant_modules 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_modules.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Permitir que usuários vejam assinaturas de seus tenants
CREATE POLICY "Users can view their tenant subscriptions" ON tenant_subscriptions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Inserir módulos padrão (traduzidos para português)
INSERT INTO saas_modules (name, code, description, icon, is_core, price, is_active)
VALUES
  ('CRM', 'crm', 'Gerenciamento de Relacionamento com o Cliente para controlar informações e interações com clientes', 'users', TRUE, 0, TRUE),
  ('Financeiro', 'finance', 'Gerenciamento financeiro para faturamento, pagamentos e relatórios financeiros', 'dollar-sign', FALSE, 29.90, TRUE),
  ('Gerenciamento de Tarefas', 'tasks', 'Ferramentas de gerenciamento de tarefas e projetos para organizar trabalho e melhorar produtividade', 'check-square', TRUE, 0, TRUE),
  ('Gestão de Documentos', 'documents', 'Armazenamento de documentos, controle de versão e recursos de compartilhamento', 'folder', FALSE, 19.90, TRUE),
  ('Comunicação', 'communication', 'Ferramentas de comunicação interna e externa incluindo chat e e-mail', 'message-square', FALSE, 14.90, TRUE),
  ('Documentos Fiscais Eletrônicos', 'tax_docs', 'Gerenciamento de documentos fiscais eletrônicos e conformidade', 'file-text', FALSE, 39.90, TRUE),
  ('Prática Jurídica', 'legal', 'Ferramentas para gerenciamento de prática jurídica incluindo acompanhamento de processos', 'scale', FALSE, 49.90, TRUE),
  ('Administração SaaS', 'saas_admin', 'Ferramentas avançadas de administração para gerenciamento de plataforma SaaS', 'settings', FALSE, 99.90, TRUE);

-- Inserir planos padrão
INSERT INTO saas_plans (name, description, price, billing_cycle, user_limit, storage_limit, is_recommended, is_active)
VALUES
  ('Básico', 'Para pequenos negócios ou empreendedores solo', 29.90, 'monthly', 3, 5120, FALSE, TRUE),
  ('Profissional', 'Para negócios em crescimento com mais necessidades', 79.90, 'monthly', 10, 20480, TRUE, TRUE),
  ('Empresarial', 'Para grandes organizações com requisitos avançados', 199.90, 'monthly', 50, 102400, FALSE, TRUE);

-- Associar módulos aos planos
-- Plano Básico: CRM + Gerenciamento de Tarefas
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM saas_plans WHERE name = 'Básico'),
  id 
FROM saas_modules 
WHERE code IN ('crm', 'tasks');

-- Plano Profissional: CRM + Financeiro + Gerenciamento de Tarefas + Gestão de Documentos + Comunicação
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM saas_plans WHERE name = 'Profissional'),
  id 
FROM saas_modules 
WHERE code IN ('crm', 'finance', 'tasks', 'documents', 'communication');

-- Plano Empresarial: Todos os módulos
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  (SELECT id FROM saas_plans WHERE name = 'Empresarial'),
  id 
FROM saas_modules;