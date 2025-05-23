/*
  # Adicionar provedor Google OAuth2
  
  1. Mudanças
     - Adiciona o provedor de credenciais Google OAuth2
     - Garante que o provedor esteja disponível para seleção
     - Configura os campos necessários para autenticação OAuth2
  
  2. Configurações
     - Client ID e Client Secret
     - Redirect URI
     - Escopos para Google Drive
*/

-- Adicionar provedor Google OAuth2 se não existir
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

-- Adicionar credencial de exemplo para Google OAuth2
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
  'Google Drive OAuth2 (Exemplo)',
  'Credencial de exemplo para Google Drive via OAuth2',
  'google_oauth2',
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