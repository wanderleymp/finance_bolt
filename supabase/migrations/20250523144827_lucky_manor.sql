/*
  # Corrigir políticas RLS para administradores

  1. Novas Políticas
    - Simplificar políticas de RLS para melhor performance
    - Garantir que administradores tenham acesso completo
    - Permitir acesso adequado para usuários normais

  2. Segurança
    - Implementar políticas consistentes em todas as tabelas
    - Garantir que dados privados estejam protegidos
*/

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "admin_select_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_insert_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_update_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_delete_modules" ON saas_modules;

DROP POLICY IF EXISTS "admin_select_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_insert_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_update_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_delete_plans" ON saas_plans;

DROP POLICY IF EXISTS "any_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_insert_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_update_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_delete_plan_modules" ON plan_modules;

-- Políticas simplificadas para módulos
CREATE POLICY "admin_manage_all_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "users_view_modules"
  ON saas_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas simplificadas para planos
CREATE POLICY "admin_manage_all_plans"
  ON saas_plans
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "users_view_plans"
  ON saas_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Políticas simplificadas para relacionamentos entre planos e módulos
CREATE POLICY "admin_manage_all_plan_modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "users_view_plan_modules"
  ON plan_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Garantir que a segurança em nível de linha esteja ativada
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;