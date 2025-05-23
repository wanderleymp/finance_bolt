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
DROP POLICY IF EXISTS "admin_can_modify_modules" ON saas_modules;

-- Criar políticas sem restrições para saas_modules
-- Política para permitir SELECT para todos (mesmo anônimos)
CREATE POLICY "anyone_can_read_modules"
  ON saas_modules
  FOR SELECT
  TO public
  USING (true);

-- Política para permitir operações de INSERT/UPDATE/DELETE para qualquer usuário autenticado
CREATE POLICY "anyone_can_modify_modules"
  ON saas_modules
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Garantir que RLS esteja habilitado
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;