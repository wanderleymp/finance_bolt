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
                <label className="block text-sm font-medium text-gray-700  dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  value={formData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(key, parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={fieldSchema.required}
                  min={fieldSchema.min}
                  max={fieldSchema.max}
                  step={fieldSchema.step || 1}
                />
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          // Campo booleano (checkbox)
          if (fieldSchema.type === 'boolean') {
            return (
              <div key={key} className="flex items-center">
                <input
                  type="checkbox"
                  id={`setting-${key}`}
                  checked={!!formData.settings[key]}
                  onChange={(e) => handleSettingsChange(key, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={`setting-${key}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {fieldSchema.label || key}
                </label>
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          // Campo de seleção
          if (fieldSchema.type === 'select' && fieldSchema.options) {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <select
                  value={formData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(key, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={fieldSchema.required}
                >
                  <option value="">Selecione...</option>
                  {fieldSchema.options.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          return null; // Ignorar tipos de campo não suportados
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/storage')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Nova Configuração de Armazenamento' : 'Editar Configuração de Armazenamento'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/storage')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <div className="flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </div>
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar'}</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Mensagens de erro/sucesso */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">{success}</span>
            </div>
          </div>
        )}
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    formErrors.name
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Nome da configuração"
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Descrição opcional da configuração"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Configuração <span className="text-red-500">*</span>
                </label>
                <select
                  name="configType"
                  value={formData.configType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="system">Sistema</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
              
              {formData.configType === 'tenant' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tenant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      onClick={() => setShowTenantSearch(true)}
                      className={`w-full px-4 py-2 border rounded-md shadow-sm cursor-pointer bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        formErrors.tenantId
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {selectedTenant ? (
                        <span>{selectedTenant.name}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          Selecione um tenant...
                        </span>
                      )}
                    </div>
                    
                    {showTenantSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                        <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={tenantSearchTerm}
                              onChange={(e) => setTenantSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                              placeholder="Buscar tenant..."
                            />
                          </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto">
                          {filteredTenants.length > 0 ? (
                            filteredTenants.map((tenant) => (
                              <div
                                key={tenant.id}
                                onClick={() => handleTenantSelect(tenant)}
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                {tenant.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500 dark:text-gray-400 italic">
                              Nenhum tenant encontrado
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {formErrors.tenantId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formErrors.tenantId}
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Ativo
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isDefault"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Padrão
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Provedor e Credenciais */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Provedor e Credenciais
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provedor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 pl-10 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                      formErrors.provider
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                    disabled={providersLoading}
                  >
                    <option value="">Selecione um provedor...</option>
                    {providers.map((provider) => (
                      <option key={provider.code} value={provider.code}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                  
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {selectedProvider?.icon ? (
                      <img
                        src={selectedProvider.icon}
                        alt={selectedProvider.name}
                        className="w-5 h-5"
                      />
                    ) : (
                      <Cloud className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
                {formErrors.provider && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.provider}
                  </p>
                )}
                {providersLoading && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Carregando provedores...
                  </p>
                )}
              </div>
              
              {selectedProvider && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credencial <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="credentialId"
                      value={formData.credentialId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 pl-10 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        formErrors.credentialId
                          ? 'border-red-300 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      required
                      disabled={credentialsLoading}
                    >
                      <option value="">Selecione uma credencial...</option>
                      {availableCredentials.map((cred) => (
                        <option key={cred.id} value={cred.id}>
                          {cred.name}
                        </option>
                      ))}
                    </select>
                    
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  {formErrors.credentialId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formErrors.credentialId}
                    </p>
                  )}
                  {credentialsLoading && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Carregando credenciais...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Configurações do Provedor */}
          {selectedProvider && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Configurações do Provedor
                </h2>
                
                {selectedProvider.helpUrl && (
                  <a
                    href={selectedProvider.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <div className="flex items-center space-x-1">
                      <Info className="w-4 h-4" />
                      <span className="text-sm">Ajuda</span>
                    </div>
                  </a>
                )}
              </div>
              
              {renderSettingsFields()}
              
              {formErrors.settings && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                  {formErrors.settings}
                </p>
              )}
            </div>
          )}
          
          {/* Limites e Cotas */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Limites e Cotas
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limite de Armazenamento (bytes)
              </label>
              <input
                type="number"
                name="spaceLimit"
                value={formData.spaceLimit}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                min="0"
                step="1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Deixe 0 para sem limite
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorageConfigForm;