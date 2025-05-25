-- Migration para adicionar políticas RLS às tabelas RBAC

-- Habilitar RLS em todas as tabelas RBAC
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela permissions
CREATE POLICY "Anyone can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only superadmins can modify permissions"
  ON permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_jwt_claims() j
      WHERE j->'role' ? 'superadmin'
    )
  );

-- Políticas para a tabela roles
CREATE POLICY "Anyone can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only superadmins can modify roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_jwt_claims() j
      WHERE j->'role' ? 'superadmin'
    )
  );

-- Políticas para a tabela role_permissions
CREATE POLICY "Anyone can read role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only superadmins can modify role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_jwt_claims() j
      WHERE j->'role' ? 'superadmin'
    )
  );

-- Políticas para a tabela user_roles
CREATE POLICY "Users can read their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can read roles in their tenant"
  ON user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_jwt_claims() j, user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.tenant_id = user_roles.tenant_id
      AND (j->'role' ? 'admin' OR j->'role' ? 'superadmin')
    )
  );

CREATE POLICY "Only superadmins can modify user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.get_jwt_claims() j
      WHERE j->'role' ? 'superadmin'
    )
  );
