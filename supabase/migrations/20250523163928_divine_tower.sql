/*
  # Correção da política RLS para tabela tenants
  
  1. Modificações
    - Remove a política existente para INSERT em tenants
    - Cria nova política para INSERT em tenants com configuração adequada
    - Garante que usuários autenticados possam inserir novos tenants
    
  2. Segurança
    - Mantém RLS habilitado
    - Corrige a política para permitir INSERT por usuários autenticados
*/

-- Remove a política existente para INSERT que está com problema
DROP POLICY IF EXISTS authenticated_users_can_insert_tenants ON public.tenants;

-- Cria uma nova política para INSERT com configuração correta
CREATE POLICY authenticated_users_can_insert_tenants
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);