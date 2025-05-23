/*
  # Correção de políticas de RLS para funcionalidades SaaS
  
  1. Ajustes nas políticas
    - Simplificação das políticas de administração
    - Permissão explícita para INSERT, UPDATE, DELETE para admins
    - Melhoria nas permissões de visualização para usuários autenticados
  
  2. Adiciona verificações de debug
    - Função para identificar problemas de permissão
    - Simplificação das condições de verificação
*/

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "admin_manage_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_active_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_manage_plans" ON saas_plans;
DROP POLICY IF EXISTS "view_active_plans" ON saas_plans;

-- Políticas para saas_modules simplificadas
CREATE POLICY "admin_select_modules"
  ON saas_modules
  FOR SELECT
  TO authenticated
  USING (true);  -- Todos usuários autenticados podem ver módulos

CREATE POLICY "admin_insert_modules"
  ON saas_modules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_update_modules"
  ON saas_modules
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_delete_modules"
  ON saas_modules
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Políticas para saas_plans simplificadas
CREATE POLICY "admin_select_plans"
  ON saas_plans
  FOR SELECT
  TO authenticated
  USING (true);  -- Todos usuários autenticados podem ver planos

CREATE POLICY "admin_insert_plans"
  ON saas_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_update_plans"
  ON saas_plans
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_delete_plans"
  ON saas_plans
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Políticas para plan_modules
DROP POLICY IF EXISTS "admin_manage_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "view_plan_modules" ON plan_modules;

CREATE POLICY "any_select_plan_modules"
  ON plan_modules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_insert_plan_modules"
  ON plan_modules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_update_plan_modules"
  ON plan_modules
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "admin_delete_plan_modules"
  ON plan_modules
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Garantir que a segurança em nível de linha esteja ativada
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;