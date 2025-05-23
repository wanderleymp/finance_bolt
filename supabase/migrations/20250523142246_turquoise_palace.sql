/*
  # Políticas de acesso para sistema SaaS
  
  1. Configurações de segurança em nível de linha (RLS) para módulos SaaS
  2. Configurações de permissão para diferentes papéis de usuário
  3. Regras de acesso baseadas em papéis
*/

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "admin_manage_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_active_modules" ON saas_modules;

-- Políticas para saas_modules
CREATE POLICY "admin_manage_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "view_active_modules"
  ON saas_modules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas para saas_plans
DROP POLICY IF EXISTS "Admins can manage all plans" ON saas_plans;
DROP POLICY IF EXISTS "Users can view active plans" ON saas_plans;

CREATE POLICY "admin_manage_plans"
  ON saas_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "view_active_plans"
  ON saas_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas para plan_modules
DROP POLICY IF EXISTS "Admins can manage all plan modules" ON plan_modules;
DROP POLICY IF EXISTS "Users can view their plan modules" ON plan_modules;

CREATE POLICY "admin_manage_plan_modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "view_plan_modules"
  ON plan_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_subscriptions ts
      JOIN tenant_users tu ON ts.tenant_id = tu.tenant_id
      WHERE ts.plan_id = plan_modules.plan_id
      AND tu.user_id = auth.uid()
    )
  );

-- Políticas para tenant_modules
DROP POLICY IF EXISTS "Admins can manage all tenant modules" ON tenant_modules;
DROP POLICY IF EXISTS "Users can view their tenant modules" ON tenant_modules;

CREATE POLICY "admin_manage_tenant_modules"
  ON tenant_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "tenant_admin_manage_tenant_modules"
  ON tenant_modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_modules.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "view_tenant_modules"
  ON tenant_modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_modules.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Políticas para tenant_subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON tenant_subscriptions;
DROP POLICY IF EXISTS "Users can view their tenant subscriptions" ON tenant_subscriptions;

CREATE POLICY "admin_manage_subscriptions"
  ON tenant_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "tenant_admin_manage_subscriptions"
  ON tenant_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "view_tenant_subscriptions"
  ON tenant_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_subscriptions.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Políticas para tenants
DROP POLICY IF EXISTS "Users can view tenants they belong to" ON tenants;

CREATE POLICY "admin_manage_tenants"
  ON tenants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "tenant_admin_manage_tenant"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "view_user_tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Garantir que todas as tabelas tenham RLS ativado
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;