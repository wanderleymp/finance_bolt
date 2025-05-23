/*
  # Melhorias nas permissões de administradores e nas funções de verificação

  1. Modificações
     - Adiciona uma nova função `get_user_role` para facilitar verificações
     - Corrige políticas RLS existentes para garantir que administradores tenham acesso adequado
     - Adiciona permissões para o email 'super@financeia.com.br' em todas as políticas
  
  2. Segurança
     - Mantém os princípios de segurança existentes
     - Simplifica a lógica de permissões para reduzir erros
     - Garante que superadmins sempre tenham acesso
*/

-- Adicionar coluna is_super à tabela de usuários se não existir
DO $$
BEGIN
    IF NOT EXISTS(SELECT column_name 
                  FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='is_super') THEN
        ALTER TABLE users ADD COLUMN is_super BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Criar função auxiliar para obter o papel do usuário
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    -- Obter o papel e o email do usuário atual
    SELECT role, email INTO user_role, user_email FROM users WHERE id = auth.uid();
    
    -- Se o email for do superadmin, considerar como superadmin independente do papel
    IF user_email = 'super@financeia.com.br' THEN
        RETURN 'superadmin';
    END IF;
    
    -- Retornar o papel ou 'unknown' se não encontrado
    RETURN COALESCE(user_role, 'unknown');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := public.get_user_role();
    RETURN user_role IN ('admin', 'superadmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar políticas existentes em saas_modules
DROP POLICY IF EXISTS "admin_manage_all_modules" ON saas_modules;
DROP POLICY IF EXISTS "users_view_modules" ON saas_modules;

-- Criar políticas simples e diretas
CREATE POLICY "admin_full_access_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "all_users_view_modules"
  ON saas_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Garantir que a RLS esteja ativada
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;

-- Atualizar o usuário super@financeia.com.br para ter is_super=true
UPDATE users 
SET role = 'superadmin', is_super = TRUE
WHERE email = 'super@financeia.com.br';

-- Inserir ou atualizar usuário superadmin se necessário
INSERT INTO users (id, email, name, role, is_super)
VALUES (gen_random_uuid(), 'super@financeia.com.br', 'Super Admin', 'superadmin', TRUE)
ON CONFLICT (email) 
DO UPDATE SET role = 'superadmin', is_super = TRUE;