/*
  # Correção do provedor Google Drive

  1. Alterações
    - Remove o provedor Google Drive existente para evitar conflitos
    - Insere o provedor Google Drive com configurações atualizadas
    - Garante que o provedor de credenciais Google OAuth2 esteja disponível
    - Corrige a atualização dos provedores de credenciais
*/

-- Remover o provedor Google Drive existente para evitar conflitos
DELETE FROM storage_providers WHERE code = 'google_drive';

-- Inserir o provedor Google Drive com configurações corretas
INSERT INTO storage_providers (
  code,
  name,
  description,
  icon,
  credential_providers,
  settings_schema,
  features,
  help_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'google_drive',
  'Google Drive',
  'Armazenamento em nuvem do Google com suporte a pastas compartilhadas',
  'cloud',
  ARRAY['google'],
  jsonb_build_object(
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
      'required', true
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
  ),
  ARRAY['upload', 'download', 'delete', 'list', 'share', 'search'],
  'https://developers.google.com/drive/api/guides/about-sdk',
  true,
  now(),
  now()
);

-- Garantir que o provedor Google esteja disponível para credenciais
INSERT INTO credential_providers (
  code,
  name,
  description,
  icon,
  auth_types,
  fields,
  help_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  'google_oauth2',
  'Google OAuth 2.0',
  'Autenticação OAuth 2.0 para serviços do Google',
  'mail',
  ARRAY['oauth2'],
  jsonb_build_object(
    'oauth2', jsonb_build_object(
      'client_id', jsonb_build_object('type', 'text', 'label', 'Client ID', 'required', true),
      'client_secret', jsonb_build_object('type', 'password', 'label', 'Client Secret', 'required', true),
      'redirect_uri', jsonb_build_object('type', 'text', 'label', 'Redirect URI', 'required', true),
      'scopes', jsonb_build_object('type', 'multi-select', 'label', 'Escopos', 'required', true, 'options', jsonb_build_array(
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly'
      ))
    )
  ),
  'https://developers.google.com/identity/protocols/oauth2',
  true,
  now(),
  now()
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  auth_types = EXCLUDED.auth_types,
  fields = EXCLUDED.fields,
  help_url = EXCLUDED.help_url,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Corrigir a atualização do provedor Google existente para incluir o novo provedor de credenciais
UPDATE credential_providers
SET credential_providers = array_append(credential_providers, 'google_oauth2')
WHERE code = 'google'
  AND NOT 'google_oauth2' = ANY(credential_providers::text[]);