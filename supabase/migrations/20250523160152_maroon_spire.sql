/*
  # Remoção de todas as restrições de módulos
  
  1. Alterações
    - Remove todas as políticas RLS complexas das tabelas de módulos
    - Estabelece políticas extremamente simples:
      - Qualquer um pode ler tudo
      - Qualquer um pode modificar tudo (desde que esteja autenticado)
    - Mantém apenas a autenticação básica
*/

-- Remover TODAS as políticas existentes para as tabelas relevantes
DROP POLICY IF EXISTS "admin_full_access_modules" ON saas_modules;
DROP POLICY IF EXISTS "all_users_view_modules" ON saas_modules;
DROP POLICY IF EXISTS "anyone_can_read_modules" ON saas_modules;
DROP POLICY IF EXISTS "only_admin_can_modify_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_manage_all_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_active_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_select_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_insert_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_update_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_delete_modules" ON saas_modules;
DROP POLICY IF EXISTS "users_view_modules" ON saas_modules;
DROP POLICY IF EXISTS "admin_manage_modules" ON saas_modules;
DROP POLICY IF EXISTS "view_modules" ON saas_modules;

DROP POLICY IF EXISTS "anyone_can_read_plans" ON saas_plans;
DROP POLICY IF EXISTS "only_admin_can_modify_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_manage_all_plans" ON saas_plans;
DROP POLICY IF EXISTS "view_active_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_select_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_insert_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_update_plans" ON saas_plans;
DROP POLICY IF EXISTS "admin_delete_plans" ON saas_plans;
DROP POLICY IF EXISTS "users_view_plans" ON saas_plans;

DROP POLICY IF EXISTS "anyone_can_read_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "only_admin_can_modify_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_manage_all_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "view_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_insert_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_update_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "admin_delete_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "any_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "users_view_plan_modules" ON plan_modules;

-- Criar políticas ULTRA SIMPLES para saas_modules (com zero restrições)
CREATE POLICY "anyone_can_read_modules"
  ON saas_modules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anyone_can_modify_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar políticas ULTRA SIMPLES para saas_plans
CREATE POLICY "anyone_can_read_plans"
  ON saas_plans
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anyone_can_modify_plans"
  ON saas_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar políticas ULTRA SIMPLES para plan_modules
CREATE POLICY "anyone_can_read_plan_modules"
  ON plan_modules
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "anyone_can_modify_plan_modules"
  ON plan_modules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Garantir que RLS esteja habilitado em todas as tabelas
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;