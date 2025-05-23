/*
  # Atualização de políticas RLS para módulos

  Esta migração atualiza as políticas de segurança em nível de linha (RLS) para a tabela `saas_modules`
  para garantir que a autenticação funcione corretamente.

  Mudanças:
  1. Atualiza a política para permitir que administradores gerenciem módulos
  2. Simplifica a verificação de papel do usuário
  3. Garante que usuários não-admin possam visualizar módulos ativos
*/

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "admins_can_insert_modules" ON saas_modules;
DROP POLICY IF EXISTS "admins_can_manage_modules" ON saas_modules;
DROP POLICY IF EXISTS "users_can_view_active_modules" ON saas_modules;
DROP POLICY IF EXISTS "Admins can manage all modules" ON saas_modules;
DROP POLICY IF EXISTS "Users can view active modules" ON saas_modules;

-- Recriar política para permitir que administradores gerenciem todos os módulos
CREATE POLICY "admin_manage_modules"
ON saas_modules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir que qualquer usuário autenticado veja módulos ativos
CREATE POLICY "view_active_modules"
ON saas_modules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Garantir que a segurança em nível de linha esteja ativada
ALTER TABLE saas_modules ENABLE ROW LEVEL SECURITY;