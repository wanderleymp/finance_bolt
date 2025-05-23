/*
  # Correção definitiva de autenticação e permissões
  
  1. Mudanças principais:
     - Simplifica completamente todas as políticas RLS
     - Remove redundâncias e verificações complexas
     - Garante acesso universal de leitura para módulos e planos
     - Cria funções auxiliares robustas para verificação de permissões
  
  2. Segurança:
     - Mantém proteção para operações de escrita
     - Garante acesso adequado para administradores
*/

-- Limpar tabela de usuários para garantir consistência
DO $$
BEGIN
    -- Garantir que a coluna is_super existe
    IF NOT EXISTS(SELECT column_name 
                  FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='is_super') THEN
        ALTER TABLE users ADD COLUMN is_super BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Criar ou substituir função robusta para verificar administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
    user_is_super BOOLEAN;
BEGIN
    -- Verificar se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Obter informações do usuário
    SELECT role, email, is_super INTO user_role, user_email, user_is_super 
    FROM users 
    WHERE id = auth.uid();
    
    -- Verificação lógica de administrador
    RETURN (user_role IN ('admin', 'superadmin') OR 
            user_email = 'super@financeia.com.br' OR 
            user_is_super = TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o super usuário existe e tem permissões corretas
INSERT INTO users (id, email, name, role, is_super)
VALUES (
  COALESCE(
    (SELECT id FROM users WHERE email = 'super@financeia.com.br'),
    gen_random_uuid()
  ), 
  'super@financeia.com.br', 
  'Super Admin', 
  'superadmin', 
  TRUE
)
ON CONFLICT (email) 
DO UPDATE SET role = 'superadmin', is_super = TRUE;

-- Remover todas as políticas existentes para saas_modules
DROP POLICY IF EXISTS "admin_manage_all_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_active_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_select_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_insert_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_update_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_delete_modules" ON saas_modules;
DROP POLICY IF EXISTS "users_view_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_full_access_modules" ON saas_modules;
DROP POLICY IF EXISTS "all_users_view_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_manage_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_modules" ON saas_modules;

-- Criar duas políticas simples: select para todos, outras operações para admin
CREATE POLICY "anyone_can_read_modules"
  ON saas_modules
  FOR SELECT
  USING (true);

CREATE POLICY "only_admin_can_modify_modules"
  ON saas_modules
  FOR ALL
  USING (is_admin());

-- Remover todas as políticas existentes para saas_plans
DROP POLICY IF EXISTS "admin_manage_all_plans" ON saas_plans;
DROP POLICY IF EXISTS "view_active_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_select_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_insert_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_update_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_delete_plans" ON saas_plans;
DROP POLICY IF EXISTS "users_view_plans" ON saas_plans;

-- Criar duas políticas simples para saas_plans
CREATE POLICY "anyone_can_read_plans"
  ON saas_plans
  FOR SELECT
  USING (true);

CREATE POLICY "only_admin_can_modify_plans"
  ON saas_plans
  FOR ALL
  USING (is_admin());

-- Remover todas as políticas existentes para plan_modules
DROP POLICY IF EXISTS "admin_manage_all_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "view_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_insert_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_update_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_delete_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "any_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "users_view_plan_modules" ON plan_modules;

-- Criar duas políticas simples para plan_modules
CREATE POLICY "anyone_can_read_plan_modules"
  ON plan_modules
  FOR SELECT
  USING (true);

CREATE POLICY "only_admin_can_modify_plan_modules"
  ON plan_modules
  FOR ALL
  USING (is_admin());

-- Garantir que RLS esteja habilitado em todas as tabelas
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;