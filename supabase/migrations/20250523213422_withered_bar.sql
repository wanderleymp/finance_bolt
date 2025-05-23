/*
  # Adicionar credenciais de teste para Google Drive
  
  1. Mudanças
     - Adiciona credenciais de sistema para Google Drive
     - Configura credenciais de teste para uso imediato
     - Garante que as credenciais estejam disponíveis para seleção
  
  2. Dados
     - Credenciais de teste para ambiente de desenvolvimento
     - Não contém dados sensíveis reais
*/

-- Adicionar credencial de sistema para Google Drive
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
  'Google Drive API (Teste)',
  'Credencial de teste para Google Drive',
  'google',
  'oauth2',
  jsonb_build_object(
    'client_id', '123456789012-example.apps.googleusercontent.com',
    'client_secret', 'GOCSPX-examplecredential123456',
    'redirect_uri', 'https://example.com/oauth/callback',
    'access_token', 'ya29.a0example_token_would_be_here_in_production',
    'refresh_token', '1//04example_refresh_token',
    'token_type', 'Bearer',
    'expiry_date', (extract(epoch from now() + interval '1 hour') * 1000)::bigint
  ),
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Adicionar credencial de sistema para Google OAuth2
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
  'Google OAuth2 (Teste)',
  'Credencial de teste para autenticação Google OAuth2',
  'google_oauth2',
  'oauth2',
  jsonb_build_object(
    'client_id', '123456789012-example.apps.googleusercontent.com',
    'client_secret', 'GOCSPX-examplecredential123456',
    'redirect_uri', 'https://example.com/oauth/callback',
    'access_token', 'ya29.a0example_token_would_be_here_in_production',
    'refresh_token', '1//04example_refresh_token',
    'token_type', 'Bearer',
    'expiry_date', (extract(epoch from now() + interval '1 hour') * 1000)::bigint
  ),
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Adicionar configuração de armazenamento de exemplo para Google Drive
INSERT INTO storage_configs (
  id,
  name,
  description,
  provider,
  config_type,
  credential_id,
  settings,
  is_active,
  is_default,
  created_at,
  updated_at,
  space_limit
) 
SELECT
  gen_random_uuid(),
  'Google Drive (Exemplo)',
  'Configuração de exemplo para Google Drive',
  'google_drive',
  'system',
  id,
  jsonb_build_object(
    'rootFolderId', '',
    'basePath', '/dados/empresa',
    'createSharedFolders', false,
    'fileNaming', 'original',
    'defaultPermissions', 'private'
  ),
  true,
  false,
  now(),
  now(),
  5368709120 -- 5GB
FROM system_credentials 
WHERE name = 'Google Drive API (Teste)'
  AND NOT EXISTS (
    SELECT 1 FROM storage_configs 
    WHERE name = 'Google Drive (Exemplo)'
  )
LIMIT 1;