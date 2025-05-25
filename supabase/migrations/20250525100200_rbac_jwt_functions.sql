-- Migration para criar funções JWT para RBAC

-- Função para gerar claims RBAC para JWT
CREATE OR REPLACE FUNCTION public.generate_rbac_claims(uid uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH user_permissions AS (
    -- Obter todas as permissões do usuário através de seus papéis
    SELECT DISTINCT p.code AS permission
    FROM auth.users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = uid
  ),
  user_roles AS (
    -- Obter todos os papéis do usuário
    SELECT DISTINCT r.name AS role
    FROM auth.users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.id = uid
  )
  SELECT 
    jsonb_build_object(
      'role', COALESCE((SELECT array_agg(role) FROM user_roles), ARRAY[]::text[]),
      'permissions', COALESCE((SELECT array_agg(permission) FROM user_permissions), ARRAY[]::text[])
    )
$$;

-- Função para combinar claims JWT com claims RBAC
CREATE OR REPLACE FUNCTION public.jwt_with_rbac()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    public.get_jwt_claims() || 
    CASE
      WHEN public.get_jwt_claims() ->> 'role' = 'authenticated' THEN
        public.generate_rbac_claims(auth.uid())
      ELSE '{}'::jsonb
    END
$$;
