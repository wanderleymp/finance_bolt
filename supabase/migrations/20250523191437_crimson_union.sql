/*
  # Dados iniciais para provedores suportados
  
  1. Registros de provedores
    - Adiciona dados de referência para provedores de credenciais
    - Adiciona dados de referência para provedores de armazenamento
    
  2. Configurações
    - Metadados para ajudar na UI
    - Informações necessárias para cada tipo de autenticação
*/

-- Criar tabela para provedores de credenciais
CREATE TABLE IF NOT EXISTS credential_providers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nome do ícone Lucide a ser usado
  auth_types TEXT[] NOT NULL, -- Tipos de autenticação suportados
  fields JSONB NOT NULL, -- Campos necessários para cada tipo de autenticação
  help_url TEXT, -- URL para documentação de ajuda
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para provedores de armazenamento
CREATE TABLE IF NOT EXISTS storage_providers (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nome do ícone Lucide a ser usado
  credential_providers TEXT[] NOT NULL, -- Provedores de credenciais compatíveis
  settings_schema JSONB NOT NULL, -- Schema JSON para configurações necessárias
  features TEXT[] NOT NULL, -- Recursos suportados
  help_url TEXT, -- URL para documentação de ajuda
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir provedores de credenciais
INSERT INTO credential_providers (code, name, description, icon, auth_types, fields, help_url) VALUES
(
  'google', 
  'Google Workspace',
  'Acesso a serviços do Google como Gmail, Drive, Calendar, etc.',
  'mail',
  ARRAY['oauth2', 'service_account'],
  jsonb_build_object(
    'oauth2', jsonb_build_object(
      'client_id', jsonb_build_object('type', 'text', 'label', 'Client ID', 'required', true),
      'client_secret', jsonb_build_object('type', 'password', 'label', 'Client Secret', 'required', true),
      'redirect_uri', jsonb_build_object('type', 'text', 'label', 'Redirect URI', 'required', true),
      'scopes', jsonb_build_object('type', 'multi-select', 'label', 'Escopos', 'required', true, 'options', jsonb_build_array(
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/calendar'
      ))
    ),
    'service_account', jsonb_build_object(
      'json_key', jsonb_build_object('type', 'textarea', 'label', 'JSON da Conta de Serviço', 'required', true)
    )
  ),
  'https://developers.google.com/workspace/guides/create-credentials'
),
(
  'microsoft', 
  'Microsoft 365',
  'Acesso a serviços do Microsoft 365 como Outlook, OneDrive, etc.',
  'mail',
  ARRAY['oauth2'],
  jsonb_build_object(
    'oauth2', jsonb_build_object(
      'client_id', jsonb_build_object('type', 'text', 'label', 'Client ID', 'required', true),
      'client_secret', jsonb_build_object('type', 'password', 'label', 'Client Secret', 'required', true),
      'redirect_uri', jsonb_build_object('type', 'text', 'label', 'Redirect URI', 'required', true),
      'tenant_id', jsonb_build_object('type', 'text', 'label', 'Azure Tenant ID', 'required', true),
      'scopes', jsonb_build_object('type', 'multi-select', 'label', 'Escopos', 'required', true, 'options', jsonb_build_array(
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Files.ReadWrite.All',
        'https://graph.microsoft.com/Calendar.ReadWrite'
      ))
    )
  ),
  'https://learn.microsoft.com/pt-br/azure/active-directory/develop/quickstart-register-app'
),
(
  'smtp', 
  'SMTP',
  'Servidor SMTP para envio de emails',
  'mail',
  ARRAY['password'],
  jsonb_build_object(
    'password', jsonb_build_object(
      'host', jsonb_build_object('type', 'text', 'label', 'Servidor', 'required', true),
      'port', jsonb_build_object('type', 'number', 'label', 'Porta', 'required', true, 'default', 587),
      'username', jsonb_build_object('type', 'text', 'label', 'Usuário', 'required', true),
      'password', jsonb_build_object('type', 'password', 'label', 'Senha', 'required', true),
      'secure', jsonb_build_object('type', 'boolean', 'label', 'Usar SSL/TLS', 'required', false, 'default', true)
    )
  ),
  'https://support.google.com/mail/answer/7126229?hl=pt-BR'
),
(
  'aws', 
  'Amazon Web Services',
  'Acesso a serviços da AWS como S3, SES, etc.',
  'cloud',
  ARRAY['api_key'],
  jsonb_build_object(
    'api_key', jsonb_build_object(
      'access_key', jsonb_build_object('type', 'text', 'label', 'Access Key', 'required', true),
      'secret_key', jsonb_build_object('type', 'password', 'label', 'Secret Key', 'required', true),
      'region', jsonb_build_object('type', 'select', 'label', 'Região', 'required', true, 'options', jsonb_build_array(
        'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'sa-east-1', 'eu-west-1'
      ))
    )
  ),
  'https://docs.aws.amazon.com/pt_br/general/latest/gr/aws-sec-cred-types.html'
),
(
  'whatsapp', 
  'WhatsApp Business',
  'API do WhatsApp Business para comunicação',
  'message-circle',
  ARRAY['api_key'],
  jsonb_build_object(
    'api_key', jsonb_build_object(
      'phone_number_id', jsonb_build_object('type', 'text', 'label', 'ID do Número de Telefone', 'required', true),
      'business_account_id', jsonb_build_object('type', 'text', 'label', 'ID da Conta Business', 'required', true),
      'api_key', jsonb_build_object('type', 'password', 'label', 'Token de Acesso', 'required', true)
    )
  ),
  'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  auth_types = EXCLUDED.auth_types,
  fields = EXCLUDED.fields,
  help_url = EXCLUDED.help_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Inserir provedores de armazenamento
INSERT INTO storage_providers (code, name, description, icon, credential_providers, settings_schema, features, help_url) VALUES
(
  'google_drive', 
  'Google Drive',
  'Armazenamento em nuvem do Google',
  'hard-drive',
  ARRAY['google'],
  jsonb_build_object(
    'folder_id', jsonb_build_object('type', 'text', 'label', 'ID da Pasta', 'required', false, 'help', 'Se não informado, será usada a raiz'),
    'file_naming', jsonb_build_object('type', 'select', 'label', 'Formato de Nomes', 'required', false, 'default', 'original', 'options', jsonb_build_array(
      jsonb_build_object('value', 'original', 'label', 'Original'),
      jsonb_build_object('value', 'uuid', 'label', 'UUID'),
      jsonb_build_object('value', 'date_prefix', 'label', 'Data + Original')
    )),
    'permissions', jsonb_build_object('type', 'select', 'label', 'Permissões', 'required', false, 'default', 'private', 'options', jsonb_build_array(
      jsonb_build_object('value', 'private', 'label', 'Privado'),
      jsonb_build_object('value', 'shared_link', 'label', 'Link Compartilhável'),
      jsonb_build_object('value', 'public', 'label', 'Público')
    ))
  ),
  ARRAY['upload', 'download', 'list', 'delete', 'move', 'copy', 'share', 'search'],
  'https://developers.google.com/drive/api/guides/about-sdk'
),
(
  'onedrive', 
  'Microsoft OneDrive',
  'Armazenamento em nuvem da Microsoft',
  'hard-drive',
  ARRAY['microsoft'],
  jsonb_build_object(
    'drive_id', jsonb_build_object('type', 'text', 'label', 'ID do Drive', 'required', false, 'help', 'Se não informado, será usada a raiz'),
    'folder_path', jsonb_build_object('type', 'text', 'label', 'Caminho da Pasta', 'required', false),
    'file_naming', jsonb_build_object('type', 'select', 'label', 'Formato de Nomes', 'required', false, 'default', 'original', 'options', jsonb_build_array(
      jsonb_build_object('value', 'original', 'label', 'Original'),
      jsonb_build_object('value', 'uuid', 'label', 'UUID'),
      jsonb_build_object('value', 'date_prefix', 'label', 'Data + Original')
    )),
    'permissions', jsonb_build_object('type', 'select', 'label', 'Permissões', 'required', false, 'default', 'private', 'options', jsonb_build_array(
      jsonb_build_object('value', 'private', 'label', 'Privado'),
      jsonb_build_object('value', 'shared_link', 'label', 'Link Compartilhável'),
      jsonb_build_object('value', 'public', 'label', 'Público')
    ))
  ),
  ARRAY['upload', 'download', 'list', 'delete', 'move', 'copy', 'share', 'search'],
  'https://learn.microsoft.com/pt-br/onedrive/developer/rest-api/'
),
(
  's3', 
  'Amazon S3',
  'Armazenamento em nuvem da Amazon',
  'database',
  ARRAY['aws'],
  jsonb_build_object(
    'bucket', jsonb_build_object('type', 'text', 'label', 'Bucket', 'required', true),
    'prefix', jsonb_build_object('type', 'text', 'label', 'Prefixo', 'required', false),
    'region', jsonb_build_object('type', 'select', 'label', 'Região', 'required', true, 'options', jsonb_build_array(
      'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'sa-east-1', 'eu-west-1'
    )),
    'acl', jsonb_build_object('type', 'select', 'label', 'ACL', 'required', false, 'default', 'private', 'options', jsonb_build_array(
      jsonb_build_object('value', 'private', 'label', 'Privado'),
      jsonb_build_object('value', 'public-read', 'label', 'Leitura Pública'),
      jsonb_build_object('value', 'authenticated-read', 'label', 'Leitura Autenticada')
    ))
  ),
  ARRAY['upload', 'download', 'list', 'delete', 'move', 'copy'],
  'https://docs.aws.amazon.com/pt_br/AmazonS3/latest/userguide/Welcome.html'
),
(
  'dropbox', 
  'Dropbox',
  'Armazenamento em nuvem Dropbox',
  'database',
  ARRAY['dropbox'],
  jsonb_build_object(
    'folder_path', jsonb_build_object('type', 'text', 'label', 'Caminho da Pasta', 'required', false, 'default', '/'),
    'shared_folder', jsonb_build_object('type', 'boolean', 'label', 'Pasta Compartilhada', 'required', false, 'default', false)
  ),
  ARRAY['upload', 'download', 'list', 'delete', 'move', 'copy', 'share'],
  'https://www.dropbox.com/developers/documentation'
),
(
  'minio', 
  'MinIO',
  'Armazenamento S3 compatível self-hosted',
  'database',
  ARRAY['minio'],
  jsonb_build_object(
    'endpoint', jsonb_build_object('type', 'text', 'label', 'Endpoint', 'required', true),
    'bucket', jsonb_build_object('type', 'text', 'label', 'Bucket', 'required', true),
    'prefix', jsonb_build_object('type', 'text', 'label', 'Prefixo', 'required', false),
    'use_ssl', jsonb_build_object('type', 'boolean', 'label', 'Usar SSL', 'required', false, 'default', true)
  ),
  ARRAY['upload', 'download', 'list', 'delete', 'move', 'copy'],
  'https://min.io/docs/minio/linux/developers/go/API.html'
),
(
  'local', 
  'Armazenamento Local',
  'Armazenamento no próprio servidor',
  'hard-drive',
  ARRAY['none'],
  jsonb_build_object(
    'base_path', jsonb_build_object('type', 'text', 'label', 'Caminho Base', 'required', true),
    'max_size_mb', jsonb_build_object('type', 'number', 'label', 'Tamanho Máximo (MB)', 'required', false, 'default', 10)
  ),
  ARRAY['upload', 'download', 'list', 'delete'],
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  credential_providers = EXCLUDED.credential_providers,
  settings_schema = EXCLUDED.settings_schema,
  features = EXCLUDED.features,
  help_url = EXCLUDED.help_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Adicionar provedor Dropbox para credenciais
INSERT INTO credential_providers (code, name, description, icon, auth_types, fields, help_url) VALUES
(
  'dropbox', 
  'Dropbox',
  'Acesso a serviços do Dropbox',
  'database',
  ARRAY['oauth2'],
  jsonb_build_object(
    'oauth2', jsonb_build_object(
      'app_key', jsonb_build_object('type', 'text', 'label', 'App Key', 'required', true),
      'app_secret', jsonb_build_object('type', 'password', 'label', 'App Secret', 'required', true),
      'redirect_uri', jsonb_build_object('type', 'text', 'label', 'Redirect URI', 'required', true)
    )
  ),
  'https://www.dropbox.com/developers/apps'
),
(
  'minio', 
  'MinIO',
  'Armazenamento compatível com S3 self-hosted',
  'database',
  ARRAY['api_key'],
  jsonb_build_object(
    'api_key', jsonb_build_object(
      'endpoint', jsonb_build_object('type', 'text', 'label', 'Endpoint', 'required', true),
      'access_key', jsonb_build_object('type', 'text', 'label', 'Access Key', 'required', true),
      'secret_key', jsonb_build_object('type', 'password', 'label', 'Secret Key', 'required', true)
    )
  ),
  'https://min.io/docs/minio/linux/operations/access-management.html'
),
(
  'none', 
  'Sem Credencial',
  'Usado para provedores que não requerem credenciais',
  'check',
  ARRAY['none'],
  jsonb_build_object(
    'none', jsonb_build_object()
  ),
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  auth_types = EXCLUDED.auth_types,
  fields = EXCLUDED.fields,
  help_url = EXCLUDED.help_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Criar tabela para listar os módulos do sistema que podem usar armazenamento
CREATE TABLE IF NOT EXISTS system_modules (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Nome do ícone Lucide a ser usado
  is_active BOOLEAN NOT NULL DEFAULT true,
  storage_enabled BOOLEAN NOT NULL DEFAULT true,
  required_features TEXT[], -- features de armazenamento necessárias
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir módulos padrão
INSERT INTO system_modules (code, name, description, icon, storage_enabled, required_features) VALUES
('ged', 'Gestão de Documentos', 'Documentos gerais, contratos', 'file-text', true, ARRAY['upload', 'download', 'list']),
('fiscal', 'Documentos Fiscais', 'XMLs, PDFs de notas fiscais', 'file-check', true, ARRAY['upload', 'download', 'list']),
('financeiro', 'Financeiro', 'Comprovantes, extratos bancários', 'banknote', true, ARRAY['upload', 'download', 'list']),
('crm', 'CRM', 'Propostas, apresentações', 'users', true, ARRAY['upload', 'download', 'share']),
('advocacia', 'Advocacia', 'Petições, documentos jurídicos', 'scale', true, ARRAY['upload', 'download', 'list']),
('comunicacao', 'Comunicação', 'Anexos de email, mídia de WhatsApp', 'mail', true, ARRAY['upload', 'download', 'share'])
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  storage_enabled = EXCLUDED.storage_enabled,
  required_features = EXCLUDED.required_features,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Ativar RLS nas novas tabelas
ALTER TABLE credential_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;

-- Políticas para credential_providers
CREATE POLICY "anyone_can_read_credential_providers"
  ON credential_providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_credential_providers"
  ON credential_providers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
  ));

-- Políticas para storage_providers
CREATE POLICY "anyone_can_read_storage_providers"
  ON storage_providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_storage_providers"
  ON storage_providers
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
  ));

-- Políticas para system_modules
CREATE POLICY "anyone_can_read_system_modules"
  ON system_modules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins_can_manage_system_modules"
  ON system_modules
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND (users.role IN ('admin', 'superadmin') OR users.is_super = true)
  ));