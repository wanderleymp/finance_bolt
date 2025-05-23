/*
  # Add Google Drive storage provider
  
  1. Changes
    - Add Google Drive provider to storage_providers table
    
  2. Provider Details
    - Code: google_drive
    - Name: Google Drive
    - Requires Google OAuth credentials
    - Settings for folder configuration and sharing options
*/

INSERT INTO storage_providers (
  code,
  name,
  description,
  icon,
  credential_providers,
  settings_schema,
  features,
  help_url,
  is_active
) VALUES (
  'google_drive',
  'Google Drive',
  'Store files in Google Drive with support for shared drives and folder organization',
  'https://www.gstatic.com/images/branding/product/2x/drive_48dp.png',
  ARRAY['google_oauth2'],
  jsonb_build_object(
    'rootFolder', jsonb_build_object(
      'type', 'string',
      'label', 'Root Folder ID',
      'help', 'ID of the Google Drive folder to use as root. Leave empty to use the root of the Drive',
      'required', false
    ),
    'createSharedFolders', jsonb_build_object(
      'type', 'boolean',
      'label', 'Create Shared Folders',
      'help', 'Automatically create shared folders for collaborative spaces',
      'default', false,
      'required', false
    ),
    'defaultPermissions', jsonb_build_object(
      'type', 'select',
      'label', 'Default File Permissions',
      'options', ARRAY['private', 'anyone_with_link', 'public'],
      'default', 'private',
      'required', true
    )
  ),
  ARRAY['upload', 'download', 'delete', 'list', 'share', 'search'],
  'https://developers.google.com/drive/api/guides/about-sdk',
  true
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  credential_providers = EXCLUDED.credential_providers,
  settings_schema = EXCLUDED.settings_schema,
  features = EXCLUDED.features,
  help_url = EXCLUDED.help_url,
  is_active = EXCLUDED.is_active;