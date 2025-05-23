import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, HardDrive, Database, Key, 
  AlertTriangle, CheckSquare, Info, Search, Settings,
  Cloud, Server, FileText, Globe, Lock, Cog, Download
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { StorageProvider, StorageConfig, SystemCredential, TenantCredential } from '../../../types';
import { useUI } from '../../../contexts/UIContext';

type FormMode = 'create' | 'edit';

const StorageConfigForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode: FormMode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Lista de provedores e credenciais
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [systemCredentials, setSystemCredentials] = useState<SystemCredential[]>([]);
  const [tenantCredentials, setTenantCredentials] = useState<TenantCredential[]>([]);
  
  // Dados do formulário
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    provider: string;
    configType: 'system' | 'tenant';
    tenantId: string;
    credentialId: string;
    settings: Record<string, any>;
    isActive: boolean;
    isDefault: boolean;
    spaceLimit: number;
  }>({
    name: '',
    description: '',
    provider: '',
    configType: 'system',
    tenantId: '',
    credentialId: '',
    settings: {},
    isActive: true,
    isDefault: false,
    spaceLimit: 1024 * 1024 * 1024 * 5 // 5GB padrão
  });
  
  // Estado para seleção de tenant (para configurações específicas de tenant)
  const [tenants, setTenants] = useState<{ id: string, name: string }[]>([]);
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [showTenantSearch, setShowTenantSearch] = useState(false);
  
  // Controle de erros no formulário
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    provider?: string;
    tenantId?: string;
    credentialId?: string;
    settings?: string;
  }>({});

  // Carregar dados iniciais
  useEffect(() => {
    fetchProviders();
    fetchTenants();
    
    if (mode === 'edit' && id) {
      fetchStorageConfig(id);
    }
  }, [mode, id]);

  // Efeito para carregar credenciais quando o provedor ou tipo de configuração mudar
  useEffect(() => {
    if (formData.provider) {
      fetchCredentials(formData.provider, formData.configType, formData.tenantId);
    }
  }, [formData.provider, formData.configType, formData.tenantId]);

  // Buscar provedores de armazenamento disponíveis
  const fetchProviders = async () => {
    try {
      setProvidersLoading(true);
      console.log('StorageConfigForm: Carregando provedores...');
      
      const { data, error } = await supabase
        .from('storage_providers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('StorageConfigForm: Erro ao buscar provedores:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`StorageConfigForm: ${data.length} provedores encontrados`);
        
        const formattedProviders: StorageProvider[] = data.map(provider => ({
          code: provider.code,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
          credentialProviders: provider.credential_providers,
          settingsSchema: provider.settings_schema,
          features: provider.features,
          helpUrl: provider.help_url,
          isActive: provider.is_active
        }));
        
        setProviders(formattedProviders);
        
        // Selecionar automaticamente o primeiro provedor se não houver um selecionado
        if (!formData.provider && formattedProviders.length > 0) {
          setFormData(prev => ({
            ...prev,
            provider: formattedProviders[0].code
          }));
        }
      } else {
        console.log('StorageConfigForm: Nenhum provedor encontrado');
        
        addToast({
          title: 'Atenção',
          message: 'Nenhum provedor de armazenamento disponível',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('StorageConfigForm: Erro ao carregar provedores:', err);
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar provedores de armazenamento',
        type: 'error'
      });
    } finally {
      setProvidersLoading(false);
    }
  };

  // Buscar tenants para seleção
  const fetchTenants = async () => {
    try {
      console.log('StorageConfigForm: Carregando tenants...');
      
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) {
        console.error('StorageConfigForm: Erro ao buscar tenants:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`StorageConfigForm: ${data.length} tenants encontrados`);
        
        const formattedTenants = data.map(tenant => ({
          id: tenant.id,
          name: tenant.nome
        }));
        
        setTenants(formattedTenants);
      } else {
        console.log('StorageConfigForm: Nenhum tenant encontrado');
      }
    } catch (err) {
      console.error('StorageConfigForm: Erro ao carregar tenants:', err);
    }
  };

  // Buscar credenciais compatíveis com o provedor selecionado
  const fetchCredentials = async (provider: string, configType: 'system' | 'tenant', tenantId?: string) => {
    try {
      setCredentialsLoading(true);
      console.log(`StorageConfigForm: Carregando credenciais para provedor: ${provider}`);
      
      // Obter provedor atual para saber quais tipos de credenciais são compatíveis
      const currentProvider = providers.find(p => p.code === provider);
      
      if (!currentProvider) {
        console.error(`StorageConfigForm: Provedor não encontrado: ${provider}`);
        
        // Buscar todos os provedores disponíveis
        const { data: allProviders } = await supabase
          .from('storage_providers')
          .select('code, name, credential_providers')
          .eq('is_active', true);
          
        console.log('StorageConfigForm: Provedores disponíveis:', allProviders);
        
        // Verificar se o provedor existe no banco de dados
        const providerExists = allProviders?.some(p => p.code === provider);
        
        if (providerExists) {
          // Se o provedor existe mas não foi carregado, tentar recarregar os provedores
          await fetchProviders();
          
          // Usar credenciais genéricas para este provedor
          const compatibleCredentialProviders = ['google', 'google_oauth2'];
          
          // Continuar com a busca de credenciais
          console.log(`StorageConfigForm: Usando provedores de credenciais compatíveis: ${compatibleCredentialProviders.join(', ')}`);
        } else {
          setError(`Provedor "${provider}" não está disponível ou foi removido do sistema. Por favor, selecione outro provedor.`);
          setSystemCredentials([]);
          setTenantCredentials([]);
          return;
        }
      }
      
      // Determinar provedores de credenciais compatíveis
      let compatibleCredentialProviders: string[] = [];
      
      if (currentProvider?.credentialProviders) {
        compatibleCredentialProviders = currentProvider.credentialProviders;
      } else if (provider === 'google_drive') {
        // Fallback para Google Drive
        compatibleCredentialProviders = ['google', 'google_oauth2'];
      } else {
        // Fallback genérico baseado no nome do provedor
        compatibleCredentialProviders = [provider];
      }
      
      console.log(`StorageConfigForm: Provedores de credenciais compatíveis: ${compatibleCredentialProviders.join(', ')}`);
      
      // Buscar credenciais do sistema
      const { data: systemData, error: systemError } = await supabase
        .from('system_credentials')
        .select('*')
        .in('provider', compatibleCredentialProviders)
        .eq('is_active', true)
        .order('name');
      
      if (systemError) {
        console.error('StorageConfigForm: Erro ao buscar credenciais do sistema:', systemError);
        throw systemError;
      }
      
      if (systemData && systemData.length > 0) {
        console.log(`StorageConfigForm: ${systemData.length} credenciais do sistema encontradas`);
        
        const formattedSystemCredentials: SystemCredential[] = systemData.map(cred => ({
          id: cred.id,
          name: cred.name,
          description: cred.description,
          provider: cred.provider,
          authType: cred.auth_type,
          credentials: cred.credentials,
          isActive: cred.is_active,
          createdAt: cred.created_at,
          updatedAt: cred.updated_at,
          expiresAt: cred.expires_at,
          lastUsedAt: cred.last_used_at,
          createdBy: cred.created_by,
          updatedBy: cred.updated_by,
          metadata: cred.metadata
        }));
        
        setSystemCredentials(formattedSystemCredentials);
      } else {
        console.log('StorageConfigForm: Nenhuma credencial do sistema encontrada');
        setSystemCredentials([]);
      }
      
      // Se for configuração de tenant e tiver um tenant selecionado, buscar credenciais específicas
      if (configType === 'tenant' && tenantId) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenant_credentials')
          .select('*')
          .in('provider', compatibleCredentialProviders)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('name');
        
        if (tenantError) {
          console.error('StorageConfigForm: Erro ao buscar credenciais do tenant:', tenantError);
          throw tenantError;
        }
        
        if (tenantData && tenantData.length > 0) {
          console.log(`StorageConfigForm: ${tenantData.length} credenciais do tenant encontradas`);
          
          const formattedTenantCredentials: TenantCredential[] = tenantData.map(cred => ({
            id: cred.id,
            tenantId: cred.tenant_id,
            name: cred.name,
            description: cred.description,
            provider: cred.provider,
            authType: cred.auth_type,
            credentials: cred.credentials,
            isActive: cred.is_active,
            createdAt: cred.created_at,
            updatedAt: cred.updated_at,
            expiresAt: cred.expires_at,
            lastUsedAt: cred.last_used_at,
            createdBy: cred.created_by,
            updatedBy: cred.updated_by,
            metadata: cred.metadata,
            overrideSystem: cred.override_system,
            systemCredentialId: cred.system_credential_id
          }));
          
          setTenantCredentials(formattedTenantCredentials);
        } else {
          console.log('StorageConfigForm: Nenhuma credencial do tenant encontrada');
          setTenantCredentials([]);
        }
      } else {
        setTenantCredentials([]);
      }
    } catch (err) {
      console.error('StorageConfigForm: Erro ao carregar credenciais:', err);
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar credenciais para o provedor selecionado',
        type: 'error'
      });
      
      setSystemCredentials([]);
      setTenantCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };

  // Buscar configuração existente para edição
  const fetchStorageConfig = async (configId: string) => {
    try {
      setLoading(true);
      console.log('StorageConfigForm: Buscando configuração:', configId);
      
      const { data, error } = await supabase
        .from('storage_configs')
        .select('*')
        .eq('id', configId)
        .single();
      
      if (error) {
        console.error('StorageConfigForm: Erro ao buscar configuração:', error);
        throw error;
      }
      
      if (data) {
        console.log('StorageConfigForm: Configuração encontrada:', data);
        
        setFormData({
          name: data.name,
          description: data.description || '',
          provider: data.provider,
          configType: data.config_type as 'system' | 'tenant',
          tenantId: data.tenant_id || '',
          credentialId: data.credential_id || '',
          settings: data.settings || {},
          isActive: data.is_active,
          isDefault: data.is_default,
          spaceLimit: data.space_limit || 1024 * 1024 * 1024 * 5 // 5GB padrão
        });
        
        // Buscar credenciais compatíveis
        await fetchCredentials(data.provider, data.config_type as 'system' | 'tenant', data.tenant_id || undefined);
      } else {
        console.log('StorageConfigForm: Configuração não encontrada');
        throw new Error('Configuração não encontrada');
      }
    } catch (err) {
      console.error('StorageConfigForm: Erro ao carregar configuração:', err);
      setError('Não foi possível carregar os dados da configuração. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da configuração',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Validar formulário antes de enviar
  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      provider?: string;
      tenantId?: string;
      credentialId?: string;
      settings?: string;
    } = {};
    
    // Nome é obrigatório
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    // Provedor é obrigatório
    if (!formData.provider) {
      errors.provider = 'Provedor é obrigatório';
    }
    
    // Tenant é obrigatório se for configuração de tenant
    if (formData.configType === 'tenant' && !formData.tenantId) {
      errors.tenantId = 'Tenant é obrigatório para configurações de tenant';
    }
    
    // Credencial é obrigatória
    if (!formData.credentialId) {
      errors.credentialId = 'Credencial é obrigatória';
    }
    
    // Validar configurações específicas do provedor
    const selectedProvider = providers.find(p => p.code === formData.provider);
    if (selectedProvider && selectedProvider.settingsSchema) {
      const requiredFields = Object.entries(selectedProvider.settingsSchema)
        .filter(([_, schema]) => schema.required)
        .map(([field]) => field);
      
      for (const field of requiredFields) {
        if (!formData.settings[field]) {
          errors.settings = `Configurações incompletas: O campo '${field}' é obrigatório`;
          break;
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar configuração
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({
        title: 'Erro de validação',
        message: 'Verifique os campos do formulário',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('StorageConfigForm: Iniciando salvamento da configuração...');
      
      const configData = {
        name: formData.name,
        description: formData.description || null,
        provider: formData.provider,
        config_type: formData.configType,
        tenant_id: formData.configType === 'tenant' ? formData.tenantId : null,
        credential_id: formData.credentialId,
        settings: formData.settings,
        is_active: formData.isActive,
        is_default: formData.isDefault,
        space_limit: formData.spaceLimit,
        updated_at: new Date().toISOString()
      };
      
      if (mode === 'create') {
        // Criar nova configuração
        console.log('StorageConfigForm: Criando nova configuração:', configData);
        
        const { data, error } = await supabase
          .from('storage_configs')
          .insert([configData])
          .select()
          .single();
        
        if (error) {
          console.error('StorageConfigForm: Erro ao criar configuração:', error);
          throw error;
        }
        
        console.log('StorageConfigForm: Configuração criada com sucesso:', data);
        
        setSuccess('Configuração de armazenamento criada com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Configuração de armazenamento criada com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/storage'), 1500);
      } else if (mode === 'edit' && id) {
        // Atualizar configuração existente
        console.log('StorageConfigForm: Atualizando configuração:', configData);
        
        const { error } = await supabase
          .from('storage_configs')
          .update(configData)
          .eq('id', id);
        
        if (error) {
          console.error('StorageConfigForm: Erro ao atualizar configuração:', error);
          throw error;
        }
        
        console.log('StorageConfigForm: Configuração atualizada com sucesso');
        
        setSuccess('Configuração de armazenamento atualizada com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Configuração de armazenamento atualizada com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/storage'), 1500);
      }
    } catch (err: any) {
      console.error('StorageConfigForm: Erro ao salvar configuração:', err);
      setError(err.message || 'Ocorreu um erro ao salvar a configuração. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: err.message || 'Falha ao salvar configuração',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para alterações nos campos do formulário
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'configType') {
      // Se mudar o tipo de configuração, resetar tenant e credencial
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tenantId: value === 'tenant' ? prev.tenantId : '',
        credentialId: '' // Reset credential when changing config type
      }));
    } else if (name === 'provider') {
      // Se mudar o provedor, resetar as configurações e credencial
      setFormData(prev => ({
        ...prev,
        [name]: value,
        settings: {},
        credentialId: '' // Reset credential when changing provider
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : name === 'spaceLimit'
            ? parseFloat(value) || 0
            : value
      }));
    }
    
    // Limpar erro específico deste campo
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof typeof formErrors];
        return updated;
      });
    }
  };

  // Manipulador para alterações em checkboxes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Manipulador para alterações nas configurações do provedor
  const handleSettingsChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));
    
    // Limpar erro de configurações
    if (formErrors.settings) {
      setFormErrors(prev => {
        const { settings, ...rest } = prev;
        return rest;
      });
    }
  };

  // Selecionar tenant
  const handleTenantSelect = (tenant: { id: string, name: string }) => {
    setFormData(prev => ({
      ...prev,
      tenantId: tenant.id
    }));
    setShowTenantSearch(false);
    
    // Limpar erro de tenant
    if (formErrors.tenantId) {
      setFormErrors(prev => {
        const { tenantId, ...rest } = prev;
        return rest;
      });
    }
  };

  // Filtrar tenants baseado na busca
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase())
  );

  // Obter o tenant selecionado
  const selectedTenant = tenants.find(t => t.id === formData.tenantId);

  // Obter o provedor selecionado
  const selectedProvider = providers.find(p => p.code === formData.provider);

  // Obter a lista de credenciais disponíveis com base no tipo de configuração
  const availableCredentials = formData.configType === 'system' 
    ? systemCredentials 
    : [...systemCredentials, ...tenantCredentials];

  // Renderizar campos de configuração baseados no schema do provedor
  const renderSettingsFields = () => {
    if (!selectedProvider || !selectedProvider.settingsSchema) {
      // Fallback para Google Drive se não houver schema
      if (formData.provider === 'google_drive') {
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID da Pasta Raiz
              </label>
              <input
                type="text"
                value={formData.settings.rootFolderId || ''}
                onChange={(e) => handleSettingsChange('rootFolderId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="ID da pasta do Google Drive (opcional)"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Deixe em branco para usar a raiz do Drive
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Caminho Virtual <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.settings.basePath || ''}
                onChange={(e) => handleSettingsChange('basePath', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="/dados/empresa"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Caminho virtual para organização de arquivos
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Formato de Nomes
              </label>
              <select
                value={formData.settings.fileNaming || 'original'}
                onChange={(e) => handleSettingsChange('fileNaming', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="original">Original</option>
                <option value="uuid">UUID</option>
                <option value="date_prefix">Data + Original</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Permissões Padrão <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.settings.defaultPermissions || 'private'}
                onChange={(e) => handleSettingsChange('defaultPermissions', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="private">Privado</option>
                <option value="anyone_with_link">Qualquer pessoa com o link</option>
                <option value="public">Público</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createSharedFolders"
                checked={!!formData.settings.createSharedFolders}
                onChange={(e) => handleSettingsChange('createSharedFolders', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="createSharedFolders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Criar pastas compartilhadas
              </label>
            </div>
          </div>
        );
      }
      
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          Nenhuma configuração específica necessária para este provedor.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {Object.entries(selectedProvider.settingsSchema).map(([key, schema]) => {
          const fieldSchema = schema as any; // Type as any for simplicity
          
          // Campo de texto padrão
          if (fieldSchema.type === 'string' || !fieldSchema.type) {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(key, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={fieldSchema.required}
                  placeholder={fieldSchema.placeholder || ''}
                />
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          // Campo numérico
          if (fieldSchema.type === 'number') {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  value={formData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(