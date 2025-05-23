/*
  # Corrigir credenciais e provedores para Google Drive
  
  1. Mudanças
     - Atualiza os credential_providers do Google Drive para incluir 'google'
     - Garante que as credenciais do Google sejam reconhecidas pelo Google Drive
     - Adiciona credenciais de teste adicionais para facilitar o desenvolvimento
  
  2. Segurança
     - Mantém as políticas de segurança existentes
     - Usa apenas dados de exemplo para credenciais
*/

-- Atualizar o provedor Google Drive para aceitar credenciais 'google'
UPDATE storage_providers
SET credential_providers = ARRAY['google', 'google_oauth2']
WHERE code = 'google_drive';

-- Adicionar credencial de sistema para Google (se não existir)
INSERT INTO system_credentials (
  id,
  name,
  description,
  provider,
  auth_type,
  credentials,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Google API (Produção)',
  'Credencial para acesso aos serviços Google',
  'google',
  'oauth2',
  jsonb_build_object(
    'client_id', '123456789012-example.apps.googleusercontent.com',
    'client_secret', 'GOCSPX-examplecredential123456',
    'redirect_uri', 'https://example.com/oauth/callback',
    'access_token', 'ya29.a0example_token_would_be_here_in_production',
    'refresh_token', '1//04example_refresh_token',
    'token_type', 'Bearer',
    'expiry_date', (extract(epoch from now() + interval '1 hour') * 1000)::bigint,
    'scopes', ARRAY['https://www.googleapis.com/auth/drive']
  ),
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Atualizar configuração de armazenamento existente para usar a credencial correta
UPDATE storage_configs
SET credential_id = (
  SELECT id FROM system_credentials 
  WHERE provider = 'google' 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE provider = 'google_drive'
  AND NOT EXISTS (
    SELECT 1 FROM system_credentials sc
    WHERE sc.id = storage_configs.credential_id
      AND sc.provider = 'google'
  );

-- Atualizar o schema de configurações do provedor Google Drive
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'rootFolderId', jsonb_build_object(
    'type', 'text',
    'label', 'ID da Pasta Raiz',
    'help', 'ID da pasta do Google Drive para usar como raiz. Deixe em branco para usar a raiz do Drive',
    'required', false
  ),
  'basePath', jsonb_build_object(
    'type', 'text',
    'label', 'Caminho Virtual',
    'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)',
    'required', true,
    'default', '/dados'
  ),
  'createSharedFolders', jsonb_build_object(
    'type', 'boolean',
    'label', 'Criar Pastas Compartilhadas',
    'help', 'Criar automaticamente pastas compartilhadas para espaços colaborativos',
    'default', false,
    'required', false
  ),
  'fileNaming', jsonb_build_object(
    'type', 'select',
    'label', 'Formato de Nomes',
    'options', jsonb_build_array(
      jsonb_build_object('value', 'original', 'label', 'Original'),
      jsonb_build_object('value', 'uuid', 'label', 'UUID'),
      jsonb_build_object('value', 'date_prefix', 'label', 'Data + Original')
    ),
    'default', 'original',
    'required', false
  ),
  'defaultPermissions', jsonb_build_object(
    'type', 'select',
    'label', 'Permissões Padrão',
    'options', jsonb_build_array(
      jsonb_build_object('value', 'private', 'label', 'Privado'),
      jsonb_build_object('value', 'anyone_with_link', 'label', 'Qualquer pessoa com o link'),
      jsonb_build_object('value', 'public', 'label', 'Público')
    ),
    'default', 'private',
    'required', true
  )
)
WHERE code = 'google_drive';