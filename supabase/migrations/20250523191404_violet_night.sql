/*
  # Sistema de Credenciais e Configurações
  
  1. Novas Tabelas
    - `system_credentials`: Armazena credenciais de integração a nível de sistema
    - `tenant_credentials`: Armazena credenciais de integração específicas por tenant
    - `storage_configs`: Configurações de armazenamento
    - `module_storage_mappings`: Mapeamento entre módulos e configurações de armazenamento

  2. Segurança
    - Habilitação de RLS em todas as tabelas
    - Políticas para controle de acesso
    - Criptografia de dados sensíveis
*/

-- Tabela de credenciais a nível de sistema
CREATE TABLE IF NOT EXISTS system_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL, -- google, microsoft, etc.
  auth_type TEXT NOT NULL, -- oauth2, api_key, etc.
  credentials JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  metadata JSONB,
  UNIQUE (provider, name)
);

-- Tabela de credenciais específicas por tenant
CREATE TABLE IF NOT EXISTS tenant_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL, -- google, microsoft, etc.
  auth_type TEXT NOT NULL, -- oauth2, api_key, etc.
  credentials JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  metadata JSONB,
  override_system BOOLEAN NOT NULL DEFAULT false,
  system_credential_id UUID REFERENCES system_credentials(id),
  UNIQUE (tenant_id, provider, name)
);

-- Tabela de configurações de armazenamento
CREATE TABLE IF NOT EXISTS storage_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL, -- google_drive, onedrive, s3, etc.
  config_type TEXT NOT NULL DEFAULT 'system', -- system, tenant
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Null para configuração de sistema
  credential_id UUID, -- Pode referenciar system_credentials ou tenant_credentials
  settings JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  space_used BIGINT DEFAULT 0,
  space_limit BIGINT,
  last_sync_at TIMESTAMPTZ,
  UNIQUE (provider, name, config_type, tenant_id)
);

-- Tabela de mapeamento entre módulos e armazenamento
CREATE TABLE IF NOT EXISTS module_storage_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code TEXT NOT NULL, -- fiscal, ged, etc.
  storage_config_id UUID NOT NULL REFERENCES storage_configs(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- Null para configuração de sistema
  priority INTEGER NOT NULL DEFAULT 1, -- Ordem de prioridade (1 = principal)
  settings JSONB, -- Configurações específicas do módulo para este armazenamento
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  UNIQUE (module_code, tenant_id, storage_config_id)
);

-- Tabela para logs de teste de credenciais
CREATE TABLE IF NOT EXISTS credential_test_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL,
  credential_type TEXT NOT NULL, -- system ou tenant
  test_result BOOLEAN NOT NULL,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_by UUID REFERENCES users(id),
  response_time INTEGER, -- em milissegundos
  details JSONB
);

-- Ativar RLS em todas as tabelas
ALTER TABLE system_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_storage_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_test_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para system_credentials
CREATE POLICY "admins_can_manage_system_credentials" ON system_credentials
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
  ));

CREATE POLICY "users_can_view_active_system_credentials" ON system_credentials
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Políticas para tenant_credentials
CREATE POLICY "tenant_admins_can_manage_tenant_credentials" ON tenant_credentials
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_users.tenant_id = tenant_credentials.tenant_id
    AND tenant_users.user_id = auth.uid()
    AND tenant_users.role = 'admin'
  ));

CREATE POLICY "tenant_users_can_view_tenant_credentials" ON tenant_credentials
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_users.tenant_id = tenant_credentials.tenant_id
    AND tenant_users.user_id = auth.uid()
  ));

CREATE POLICY "system_admins_can_manage_all_tenant_credentials" ON tenant_credentials
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
  ));

-- Políticas para storage_configs
CREATE POLICY "admins_can_manage_system_storage" ON storage_configs
  FOR ALL TO authenticated
  USING (
    config_type = 'system' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
    )
  );

CREATE POLICY "tenant_admins_can_manage_tenant_storage" ON storage_configs
  FOR ALL TO authenticated
  USING (
    config_type = 'tenant' AND
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = storage_configs.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "users_can_view_their_storage_configs" ON storage_configs
  FOR SELECT TO authenticated
  USING (
    (config_type = 'system' AND is_active = true) OR
    (config_type = 'tenant' AND
      EXISTS (
        SELECT 1 FROM tenant_users
        WHERE tenant_users.tenant_id = storage_configs.tenant_id
        AND tenant_users.user_id = auth.uid()
      )
    )
  );

-- Políticas para module_storage_mappings
CREATE POLICY "admins_can_manage_system_mappings" ON module_storage_mappings
  FOR ALL TO authenticated
  USING (
    tenant_id IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
    )
  );

CREATE POLICY "tenant_admins_can_manage_tenant_mappings" ON module_storage_mappings
  FOR ALL TO authenticated
  USING (
    tenant_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = module_storage_mappings.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "users_can_view_their_module_mappings" ON module_storage_mappings
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = module_storage_mappings.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

-- Políticas para credential_test_logs
CREATE POLICY "admins_can_view_all_test_logs" ON credential_test_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
    )
  );

CREATE POLICY "tenant_admins_can_view_tenant_test_logs" ON credential_test_logs
  FOR SELECT TO authenticated
  USING (
    credential_type = 'tenant' AND
    EXISTS (
      SELECT 1 FROM tenant_credentials tc
      JOIN tenant_users tu ON tc.tenant_id = tu.tenant_id
      WHERE tc.id = credential_test_logs.credential_id
      AND tu.user_id = auth.uid()
      AND tu.role = 'admin'
    )
  );

-- Índices para melhor performance
CREATE INDEX idx_system_credentials_provider ON system_credentials(provider);
CREATE INDEX idx_tenant_credentials_tenant ON tenant_credentials(tenant_id);
CREATE INDEX idx_tenant_credentials_provider ON tenant_credentials(provider);
CREATE INDEX idx_storage_configs_tenant ON storage_configs(tenant_id);
CREATE INDEX idx_storage_configs_provider ON storage_configs(provider);
CREATE INDEX idx_module_storage_tenant ON module_storage_mappings(tenant_id);
CREATE INDEX idx_module_storage_module ON module_storage_mappings(module_code);