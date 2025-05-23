/*
  # Criação da tabela de Organizações
  
  1. Novas Tabelas
    - `organizations` - Organizações associadas a um tenant
      - `id` (uuid, chave primária)
      - `tenant_id` (uuid, referência ao tenant)
      - `name` (texto, nome da organização)
      - `description` (texto, descrição da organização)
      - `logo` (texto, URL do logo)
      - `is_active` (boolean, se está ativa)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `contact_email` (texto, email de contato)
      - `contact_phone` (texto, telefone de contato)
      - `address` (texto, endereço)
    
    - `organization_users` - Relação entre usuários e organizações
      - `id` (uuid, chave primária)
      - `organization_id` (uuid, referência à organização)
      - `user_id` (uuid, referência ao usuário)
      - `role` (texto, papel do usuário na organização)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitação de RLS nas tabelas
    - Políticas permissivas para operações CRUD
*/

-- Criar tabela de Organizações
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  logo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT
);

-- Criar tabela de relação Organização-Usuário
CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Ativar RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas para organizations
CREATE POLICY "allow_organization_select" 
ON organizations FOR SELECT 
TO public 
USING (true);

CREATE POLICY "allow_organization_insert" 
ON organizations FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "allow_organization_update" 
ON organizations FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_organization_delete" 
ON organizations FOR DELETE 
TO public 
USING (true);

-- Criar políticas permissivas para organization_users
CREATE POLICY "allow_organization_users_select" 
ON organization_users FOR SELECT 
TO public 
USING (true);

CREATE POLICY "allow_organization_users_insert" 
ON organization_users FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "allow_organization_users_update" 
ON organization_users FOR UPDATE 
TO public 
USING (true) 
WITH CHECK (true);

CREATE POLICY "allow_organization_users_delete" 
ON organization_users FOR DELETE 
TO public 
USING (true);