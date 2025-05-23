/*
  # Adicionar suporte para o papel superadmin
  
  1. Modificações na tabela de usuários
     - Adiciona informação nas políticas de RLS para aceitar usuários com role 'superadmin'
  
  2. Criação de usuário administrativo
     - Insere um usuário admin padrão se não existir
*/

-- Modificar a política de visualização para admin para incluir superadmin
DROP POLICY IF EXISTS "admin_manage_all_modules" ON saas_modules;
CREATE POLICY "admin_manage_all_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_manage_all_plans" ON saas_plans;
CREATE POLICY "admin_manage_all_plans"
  ON saas_plans
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_manage_all_plan_modules" ON plan_modules;
CREATE POLICY "admin_manage_all_plan_modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_manage_tenant_modules" ON tenant_modules;
CREATE POLICY "admin_manage_tenant_modules"
  ON tenant_modules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_manage_subscriptions" ON tenant_subscriptions;
CREATE POLICY "admin_manage_subscriptions"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "admin_manage_tenants" ON tenants;
CREATE POLICY "admin_manage_tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin')
    )
  );

-- Inserir usuário superadmin padrão se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'super@financeia.com.br') THEN
    INSERT INTO users (id, email, name, role)
    VALUES 
      (gen_random_uuid(), 'super@financeia.com.br', 'Super Admin', 'superadmin');
  END IF;
END
$$;