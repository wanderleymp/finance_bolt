/*
  # Adicionar política de inserção para tabela tenants

  1. Segurança
    - Adiciona uma política específica para permitir que usuários autenticados possam inserir novos registros na tabela tenants
    - Mantém as políticas existentes de leitura e modificação
*/

-- Remover a política existente que pode estar causando conflitos
DROP POLICY IF EXISTS "authenticated_users_can_modify_tenants" ON public.tenants;

-- Criar políticas específicas para cada operação
CREATE POLICY "authenticated_users_can_select_tenants" 
ON public.tenants FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "authenticated_users_can_insert_tenants" 
ON public.tenants FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_update_tenants" 
ON public.tenants FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "authenticated_users_can_delete_tenants" 
ON public.tenants FOR DELETE 
TO authenticated 
USING (true);

-- Manter a política pública de leitura
DROP POLICY IF EXISTS "anyone_can_read_tenants" ON public.tenants;
CREATE POLICY "anyone_can_read_tenants" 
ON public.tenants FOR SELECT 
TO public 
USING (true);