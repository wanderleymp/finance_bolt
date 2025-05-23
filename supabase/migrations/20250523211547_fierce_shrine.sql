/*
  # Adicionar suporte para estrutura de pastas em armazenamento
  
  1. Alterações
    - Atualiza o schema de configurações de todos os provedores de armazenamento
    - Adiciona campo basePath para configuração de caminho de pasta
    - Garante compatibilidade com configurações existentes
  
  2. Funcionalidades
    - Permite especificar caminhos de pasta para organização de arquivos
    - Facilita a criação de estruturas hierárquicas para tenants e módulos
*/

-- Atualizar o schema de configurações do provedor local
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'base_path', jsonb_build_object('type', 'text', 'label', 'Caminho Base', 'required', true, 'help', 'Caminho completo para a pasta de armazenamento'),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
  'max_size_mb', jsonb_build_object('type', 'number', 'label', 'Tamanho Máximo (MB)', 'required', false, 'default', 10)
)
WHERE code = 'local';

-- Atualizar o schema de configurações do provedor Google Drive
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'folder_id', jsonb_build_object('type', 'text', 'label', 'ID da Pasta', 'required', false, 'help', 'Se não informado, será usada a raiz'),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
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
)
WHERE code = 'google_drive';

-- Atualizar o schema de configurações do provedor OneDrive
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'drive_id', jsonb_build_object('type', 'text', 'label', 'ID do Drive', 'required', false, 'help', 'Se não informado, será usada a raiz'),
  'folder_path', jsonb_build_object('type', 'text', 'label', 'Caminho da Pasta', 'required', false),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
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
)
WHERE code = 'onedrive';

-- Atualizar o schema de configurações do provedor S3
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'bucket', jsonb_build_object('type', 'text', 'label', 'Bucket', 'required', true),
  'prefix', jsonb_build_object('type', 'text', 'label', 'Prefixo', 'required', false),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
  'region', jsonb_build_object('type', 'select', 'label', 'Região', 'required', true, 'options', jsonb_build_array(
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'sa-east-1', 'eu-west-1'
  )),
  'acl', jsonb_build_object('type', 'select', 'label', 'ACL', 'required', false, 'default', 'private', 'options', jsonb_build_array(
    jsonb_build_object('value', 'private', 'label', 'Privado'),
    jsonb_build_object('value', 'public-read', 'label', 'Leitura Pública'),
    jsonb_build_object('value', 'authenticated-read', 'label', 'Leitura Autenticada')
  ))
)
WHERE code = 's3';

-- Atualizar o schema de configurações do provedor Dropbox
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'folder_path', jsonb_build_object('type', 'text', 'label', 'Caminho da Pasta', 'required', false, 'default', '/'),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
  'shared_folder', jsonb_build_object('type', 'boolean', 'label', 'Pasta Compartilhada', 'required', false, 'default', false)
)
WHERE code = 'dropbox';

-- Atualizar o schema de configurações do provedor MinIO
UPDATE storage_providers
SET settings_schema = jsonb_build_object(
  'endpoint', jsonb_build_object('type', 'text', 'label', 'Endpoint', 'required', true),
  'bucket', jsonb_build_object('type', 'text', 'label', 'Bucket', 'required', true),
  'prefix', jsonb_build_object('type', 'text', 'label', 'Prefixo', 'required', false),
  'basePath', jsonb_build_object('type', 'text', 'label', 'Caminho Virtual', 'required', true, 'help', 'Caminho virtual para organização de arquivos (ex: /dados/empresa)'),
  'use_ssl', jsonb_build_object('type', 'boolean', 'label', 'Usar SSL', 'required', false, 'default', true)
)
WHERE code = 'minio';

-- Adicionar função para criar estrutura de pastas para tenants
CREATE OR REPLACE FUNCTION create_tenant_folder_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Aqui seria implementada a lógica para criar pastas no sistema de arquivos
  -- Em uma implementação real, isso seria feito por uma função Edge ou um webhook
  -- que chamaria uma API para criar as pastas no sistema de armazenamento
  
  -- Para fins de demonstração, apenas registramos a operação
  RAISE NOTICE 'Criando estrutura de pastas para o tenant: %', NEW.nome;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para criar pastas quando um novo tenant for criado
DROP TRIGGER IF EXISTS create_tenant_folders ON tenants;
CREATE TRIGGER create_tenant_folders
AFTER INSERT ON tenants
FOR EACH ROW
EXECUTE FUNCTION create_tenant_folder_structure();

-- Adicionar função para criar estrutura de pastas para módulos de tenant
CREATE OR REPLACE FUNCTION create_tenant_module_folder_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Aqui seria implementada a lógica para criar pastas de módulos
  -- Em uma implementação real, isso seria feito por uma função Edge ou um webhook
  
  -- Para fins de demonstração, apenas registramos a operação
  RAISE NOTICE 'Criando estrutura de pastas para o módulo % do tenant %', NEW.module_id, NEW.tenant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para criar pastas quando um novo módulo for associado a um tenant
DROP TRIGGER IF EXISTS create_tenant_module_folders ON tenant_modules;
CREATE TRIGGER create_tenant_module_folders
AFTER INSERT ON tenant_modules
FOR EACH ROW
EXECUTE FUNCTION create_tenant_module_folder_structure();