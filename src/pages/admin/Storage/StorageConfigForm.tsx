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
                  onChange={(e) => handleSettingsChange(key, e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={fieldSchema.required}
                  min={fieldSchema.min}
                  max={fieldSchema.max}
                  step={fieldSchema.step || 1}
                  placeholder={fieldSchema.placeholder || ''}
                />
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          // Checkbox
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
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {fieldSchema.help && (
                  <div className="ml-6">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                  </div>
                )}
              </div>
            );
          }
          
          // Select
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
                  {fieldSchema.options.map((option: any) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
                {fieldSchema.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldSchema.help}</p>
                )}
              </div>
            );
          }
          
          // Campo de texto longo (textarea)
          if (fieldSchema.type === 'textarea') {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  value={formData.settings[key] || ''}
                  onChange={(e) => handleSettingsChange(key, e.target.value)}
                  rows={fieldSchema.rows || 3}
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
          
          // Campo json (avançado)
          if (fieldSchema.type === 'json') {
            return (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldSchema.label || key}
                  {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  value={formData.settings[key] ? JSON.stringify(formData.settings[key], null, 2) : ''}
                  onChange={(e) => {
                    try {
                      const jsonValue = e.target.value ? JSON.parse(e.target.value) : {};
                      handleSettingsChange(key, jsonValue);
                    } catch (error) {
                      // Não atualizar em caso de JSON inválido
                      console.error('JSON inválido:', error);
                    }
                  }}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  required={fieldSchema.required}
                  placeholder={fieldSchema.placeholder || '{ ... }'}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formato JSON. {fieldSchema.help || ''}
                </p>
              </div>
            );
          }
          
          // Fallback para tipos não suportados
          return (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {fieldSchema.label || key}
                {fieldSchema.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                <Info size={16} className="inline mr-1" />
                Tipo de campo não suportado: {fieldSchema.type}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Formatar tamanho em bytes para exibição
  const formatSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  // Renderizar ícone com base no código de provedor
  const renderProviderIcon = (providerCode: string) => {
    switch (providerCode) {
      case 'aws_s3': 
      case 's3':
        return <Cloud />;
      case 'google_cloud_storage':
      case 'google_drive':
        return <Cloud />;
      case 'azure_blob':
        return <Cloud />;
      case 'local_filesystem':
        return <HardDrive />;
      case 'supabase_storage':
        return <Database />;
      default:
        return <HardDrive />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/storage')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Nova Configuração de Armazenamento' : 'Editar Configuração de Armazenamento'}
          </h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provedor <span className="text-red-500">*</span>
              </label>
              <select
                id="provider"
                name="provider"
                value={formData.provider}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${formErrors.provider ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                required
                disabled={mode === 'edit'} // Não permitir alterar o provedor na edição
              >
                <option value="">Selecione um provedor</option>
                {providersLoading ? (
                  <option value="" disabled>Carregando provedores...</option>
                ) : (
                  providers.map(provider => (
                    <option key={provider.code} value={provider.code}>
                      {provider.name}
                    </option>
                  ))
                )}
              </select>
              {formErrors.provider && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.provider}</p>
              )}
              {selectedProvider?.helpUrl && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <Info size={12} className="inline mr-1" />
                    Saiba mais sobre este provedor
                  </a>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="configType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Configuração <span className="text-red-500">*</span>
              </label>
              <select
                id="configType"
                name="configType"
                value={formData.configType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={mode === 'edit'} // Não permitir alterar o tipo na edição
              >
                <option value="system">Sistema (Global)</option>
                <option value="tenant">Tenant (Específico)</option>
              </select>
              {formData.configType === 'system' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Configurações do sistema são compartilhadas por todos os tenants.
                </p>
              )}
            </div>

            {/* Mostrar seletor de tenant se for configuração de tenant */}
            {formData.configType === 'tenant' && (
              <div>
                <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      id="tenant"
                      readOnly
                      value={selectedTenant ? selectedTenant.name : 'Selecione um tenant...'}
                      onClick={() => setShowTenantSearch(!showTenantSearch)}
                      className={`w-full px-4 py-2 cursor-pointer border ${formErrors.tenantId ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                      disabled={mode === 'edit'} // Não permitir alterar o tenant na edição
                    />
                  </div>
                  
                  {/* Dropdown de busca de tenants */}
                  {showTenantSearch && mode === 'create' && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                      <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar tenant..."
                            value={tenantSearchTerm}
                            onChange={(e) => setTenantSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {filteredTenants.length > 0 ? (
                          filteredTenants.map((tenant) => (
                            <div
                              key={tenant.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                formData.tenantId === tenant.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                              }`}
                              onClick={() => handleTenantSelect(tenant)}
                            >
                              <div className="flex items-center">
                                <Database size={16} className="mr-2 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {tenant.name}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            Nenhum tenant encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {formErrors.tenantId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.tenantId}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="credentialId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credencial <span className="text-red-500">*</span>
              </label>
              <select
                id="credentialId"
                name="credentialId"
                value={formData.credentialId}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${formErrors.credentialId ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                required
              >
                <option value="">Selecione uma credencial</option>
                {credentialsLoading ? (
                  <option value="" disabled>Carregando credenciais...</option>
                ) : (
                  <>
                    {systemCredentials.length > 0 && (
                      <optgroup label="Credenciais do Sistema">
                        {systemCredentials.map(cred => (
                          <option key={cred.id} value={cred.id}>
                            {cred.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {tenantCredentials.length > 0 && (
                      <optgroup label="Credenciais do Tenant">
                        {tenantCredentials.map(cred => (
                          <option key={cred.id} value={cred.id}>
                            {cred.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {systemCredentials.length === 0 && tenantCredentials.length === 0 && (
                      <option value="" disabled>Nenhuma credencial disponível</option>
                    )}
                  </>
                )}
              </select>
              {formErrors.credentialId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.credentialId}</p>
              )}
              {!formData.credentialId && !credentialsLoading && (
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  <a href="/admin/credentials/new" target="_blank" rel="noopener noreferrer" className="hover:underline">
                    <Info size={12} className="inline mr-1" />
                    Criar nova credencial
                  </a>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="spaceLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limite de Armazenamento
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  id="spaceLimit"
                  name="spaceLimit"
                  value={formData.spaceLimit / (1024 * 1024 * 1024)} // Converter para GB para exibição
                  onChange={(e) => {
                    const gbValue = parseFloat(e.target.value) || 0;
                    setFormData(prev => ({
                      ...prev,
                      spaceLimit: gbValue * 1024 * 1024 * 1024 // Converter GB para bytes
                    }));
                  }}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">GB</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Limite total de armazenamento. Atual: {formatSize(formData.spaceLimit)}
              </p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Configurações específicas do provedor */}
          {formData.provider && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                <Cog className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Configurações de {selectedProvider?.name || 'Provedor'}
              </h2>
              
              {formErrors.settings && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 rounded-r-md">
                  <p className="text-sm text-red-700 dark:text-red-300">{formErrors.settings}</p>
                </div>
              )}
              
              {renderSettingsFields()}
            </div>
          )}

          {/* Opções e flags */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Opções
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Configuração ativa
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
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Configuração padrão
                </label>
                <div className="ml-2 group relative">
                  <Info size={16} className="text-gray-400 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-black text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    Apenas uma configuração pode ser padrão para cada tipo (sistema/tenant). Ao marcar esta opção, qualquer outra configuração padrão do mesmo tipo será desmarcada.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/storage')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StorageConfigForm;