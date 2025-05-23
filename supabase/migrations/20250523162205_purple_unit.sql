/*
  # Correção definitiva para políticas RLS da tabela plan_modules
  
  1. Alterações:
    - Remove todas as políticas existentes para evitar conflitos
    - Desabilita temporariamente o RLS para garantir acesso
    - Cria novas políticas simples e permissivas para operações CRUD
    - Reativa o RLS com as novas políticas
  
  2. Objetivo:
    - Resolver problemas de acesso na tabela plan_modules
    - Garantir que os usuários autenticados possam realizar todas as operações necessárias
*/

-- Remover todas as políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "anyone_can_read_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "anyone_can_modify_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "allow_select_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "allow_insert_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "allow_update_plan_modules" ON plan_modules;
DROP POLICY IF EXISTS "allow_delete_plan_modules" ON plan_modules;

-- Temporariamente desabilitar RLS para garantir acesso
ALTER TABLE plan_modules DISABLE ROW LEVEL SECURITY;

-- Criar políticas completamente permissivas para usuários autenticados
CREATE POLICY "allow_select_plan_modules" 
  ON plan_modules 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "allow_insert_plan_modules" 
  ON plan_modules 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "allow_update_plan_modules" 
  ON plan_modules 
  FOR UPDATE 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "allow_delete_plan_modules" 
  ON plan_modules 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Reabilitar RLS com as novas políticas
ALTER TABLE plan_modules ENABLE ROW LEVEL SECURITY;