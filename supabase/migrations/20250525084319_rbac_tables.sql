-- Migration para criar tabelas RBAC (Role-Based Access Control)

-- 1. Tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  module_code text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Tabela de papéis (roles)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Tabela de relação entre papéis e permissões (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- 4. Tabela de relação entre usuários e papéis com contexto de tenant (many-to-many)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role_id, tenant_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS role_permissions_role_id_idx ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS role_permissions_permission_id_idx ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS user_roles_tenant_id_idx ON user_roles(tenant_id);

-- Inserir papéis do sistema
INSERT INTO roles (name, description, is_system) VALUES
  ('superadmin', 'Administrador do sistema com acesso total', true),
  ('admin', 'Administrador com acesso limitado ao tenant', true),
  ('user', 'Usuário comum com acesso básico', true)
ON CONFLICT (name) DO NOTHING;

-- Inserir permissões básicas
INSERT INTO permissions (code, name, description, module_code) VALUES
  ('users.view', 'Visualizar usuários', 'Permite visualizar usuários do sistema', 'admin'),
  ('users.create', 'Criar usuários', 'Permite criar novos usuários', 'admin'),
  ('users.update', 'Atualizar usuários', 'Permite atualizar dados de usuários', 'admin'),
  ('users.delete', 'Excluir usuários', 'Permite excluir usuários', 'admin'),
  ('roles.view', 'Visualizar papéis', 'Permite visualizar papéis do sistema', 'admin'),
  ('roles.assign', 'Atribuir papéis', 'Permite atribuir papéis a usuários', 'admin'),
  ('financial.view', 'Visualizar financeiro', 'Permite visualizar dados financeiros', 'financial'),
  ('financial.create', 'Criar registros financeiros', 'Permite criar novos registros financeiros', 'financial'),
  ('financial.update', 'Atualizar registros financeiros', 'Permite atualizar registros financeiros', 'financial'),
  ('financial.delete', 'Excluir registros financeiros', 'Permite excluir registros financeiros', 'financial'),
  ('documents.view', 'Visualizar documentos', 'Permite visualizar documentos', 'documents'),
  ('documents.create', 'Criar documentos', 'Permite criar novos documentos', 'documents'),
  ('documents.update', 'Atualizar documentos', 'Permite atualizar documentos', 'documents'),
  ('documents.delete', 'Excluir documentos', 'Permite excluir documentos', 'documents')
ON CONFLICT (code) DO NOTHING;

-- Função básica para obter os claims JWT atuais
CREATE OR REPLACE FUNCTION public.get_jwt_claims()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb
$$;
