/*
  # Correção de permissões para superadmins
  
  1. Atualizações
    - Garante que usuários com papel 'superadmin' tenham acesso adequado
    - Simplifica a verificação de papel admin para incluir superadmins
    - Adiciona política explícita para a verificação do papel 'superadmin'
    
  2. Segurança
    - Atualiza as políticas RLS para incluir superadmins em todas as permissões de admin
    - Garante consistência nas verificações de permissão
*/

-- Adicionar coluna is_super a tabela de usuários se não existir
DO $$
BEGIN
    IF NOT EXISTS(SELECT column_name 
                  FROM information_schema.columns 
                  WHERE table_name='users' AND column_name='is_super') THEN
        ALTER TABLE users ADD COLUMN is_super BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Criar função para verificar se o usuário é admin (incluindo superadmin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role IN ('admin', 'superadmin') OR email = 'super@financeia.com.br')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas para usar a função is_admin()
DROP POLICY IF EXISTS "admin_manage_all_modules" ON saas_modules;
CREATE POLICY "admin_manage_all_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_all_plans" ON saas_plans;
CREATE POLICY "admin_manage_all_plans"
  ON saas_plans
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_all_plan_modules" ON plan_modules;
CREATE POLICY "admin_manage_all_plan_modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_tenant_modules" ON tenant_modules;
CREATE POLICY "admin_manage_tenant_modules"
  ON tenant_modules
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_subscriptions" ON tenant_subscriptions;
CREATE POLICY "admin_manage_subscriptions"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_tenants" ON tenants;
CREATE POLICY "admin_manage_tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Atualizar o usuário superadmin para ter is_super=true
UPDATE users 
SET role = 'superadmin', is_super = TRUE
WHERE email = 'super@financeia.com.br';

-- Inserir usuário superadmin se não existir
INSERT INTO users (id, email, name, role, is_super)
SELECT 
  gen_random_uuid(),
  'super@financeia.com.br',
  'Super Admin',
  'superadmin',
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'super@financeia.com.br'
);