/*
  # Correção de políticas RLS para tabela saas_modules

  1. Correções
    - Remove a política de inserção existente que não está funcionando corretamente
    - Adiciona uma nova política de inserção mais específica para administradores
    - Verifica se a política ALL está configurada corretamente
  
  2. Segurança
    - Garante que apenas administradores possam inserir novos módulos
    - Mantém as políticas existentes para SELECT
*/

-- Remover a política de inserção existente que não está funcionando
DROP POLICY IF EXISTS "Admins can insert new modules" ON saas_modules;

-- Criar uma nova política de inserção específica para administradores
CREATE POLICY "admins_can_insert_modules" 
ON saas_modules
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Verificar e atualizar a política ALL para garantir que está correta
DROP POLICY IF EXISTS "Admins can manage all modules" ON saas_modules;

CREATE POLICY "admins_can_manage_modules"
ON saas_modules
FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Manter a política de visualização para usuários normais
DROP POLICY IF EXISTS "Users can view active modules" ON saas_modules;

CREATE POLICY "users_can_view_active_modules"
ON saas_modules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Verificar se a tabela tem RLS habilitado
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;