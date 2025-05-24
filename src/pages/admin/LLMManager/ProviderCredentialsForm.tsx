import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Key, AlertTriangle, CheckSquare, 
  RefreshCcw, Eye, EyeOff, Server, BrainCircuit, Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMProvider, LLMProviderCredential, ConnectionTestResult } from '../../../types/llm';

const ProviderCredentialsForm: React.FC = () => {
  const navigate = useNavigate();
  const { id, providerId } = useParams<{ id?: string; providerId?: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    providerId: string;
    isSystem: boolean;
    tenantId?: string;
    credentials: Record<string, any>;
    isActive: boolean;
    expiresAt?: string;
  }>({
    name: '',
    description: '',
    providerId: providerId || '',
    isSystem: true,
    credentials: {},
    isActive: true
  });

  useEffect(() => {
    fetchProviders();
    
    if (mode === 'edit' && id) {
      fetchCredentialData(id);
    } else if (providerId) {
      fetchProviderData(providerId);
    }
  }, [mode, id, providerId]);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedProviders: LLMProvider[] = data.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          apiEndpoint: p.api_endpoint,
          authMethod: p.auth_method,
          status: p.status,
          rateLimitRequests: p.rate_limit_requests,
          rateLimitTokens: p.rate_limit_tokens,
          rateLimitPeriod: p.rate_limit_period,
          icon: p.icon,
          documentationUrl: p.documentation_url,
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }));
        
        setProviders(formattedProviders);
      }
    } catch (err) {
      console.error('Erro ao carregar provedores:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar provedores de LLM',
        type: 'error'
      });
    }
  };

  const fetchProviderData = async (provId: string) => {
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('id', provId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const provider: LLMProvider = {
          id: data.id,
          code: data.code,
          name: data.name,
          description: data.description,
          apiEndpoint: data.api_endpoint,
          authMethod: data.auth_method,
          status: data.status,
          rateLimitRequests: data.rate_limit_requests,
          rateLimitTokens: data.rate_limit_tokens,
          rateLimitPeriod: data.rate_limit_period,
          icon: data.icon,
          documentationUrl: data.documentation_url,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
        
        setSelectedProvider(provider);
        setFormData(prev => ({
          ...prev,
          providerId: provider.id,
          name: `${provider.name} API Key`,
        }));
        
        // Inicializar campos de credenciais com base no método de autenticação
        if (provider.authMethod === 'api_key') {
          setFormData(prev => ({
            ...prev,
            credentials: {
              ...prev.credentials,
              api_key: ''
            }
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do provedor:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do provedor',
        type: 'error'
      });
    }
  };

  const fetchCredentialData = async (credentialId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('llm_provider_credentials')
        .select('*, provider:provider_id(*)')
        .eq('id', credentialId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Formatar provedor
        if (data.provider) {
          const provider: LLMProvider = {
            id: data.provider.id,
            code: data.provider.code,
            name: data.provider.name,
            description: data.provider.description,
            apiEndpoint: data.provider.api_endpoint,
            authMethod: data.provider.auth_method,
            status: data.provider.status,
            rateLimitRequests: data.provider.rate_limit_requests,
            rateLimitTokens: data.provider.rate_limit_tokens,
            rateLimitPeriod: data.provider.rate_limit_period,
            icon: data.provider.icon,
            documentationUrl: data.provider.documentation_url,
            isActive: data.provider.is_active,
            createdAt: data.provider.created_at,
            updatedAt: data.provider.updated_at
          };
          
          setSelectedProvider(provider);
        }
        
        // Formatar dados do formulário
        setFormData({
          name: data.name,
          description: data.description || '',
          providerId: data.provider_id,
          isSystem: data.is_system,
          tenantId: data.tenant_id,
          credentials: data.credentials || {},
          isActive: data.is_active,
          expiresAt: data.expires_at ? new Date(data.expires_at).toISOString().split('T')[0] : undefined
        });
        
        // Esconder campos sensíveis por padrão
        const sensitiveFields = Object.keys(data.credentials || {}).filter(key => 
          key.includes('key') || key.includes('secret') || key.includes('password') || key.includes('token')
        );
        
        setHiddenFields(sensitiveFields);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da credencial:', err);
      setError('Não foi possível carregar os dados da credencial. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da credencial',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProviderId = e.target.value;
    setFormData(prev => ({
      ...prev,
      providerId: newProviderId,
      credentials: {} // Resetar credenciais ao mudar de provedor
    }));
    
    // Buscar dados do novo provedor
    const provider = providers.find(p => p.id === newProviderId);
    setSelectedProvider(provider || null);
    
    // Inicializar campos de credenciais com base no método de autenticação
    if (provider?.authMethod === 'api_key') {
      setFormData(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          api_key: ''
        }
      }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handleCredentialChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }));
  };

  const toggleFieldVisibility = (field: string) => {
    setHiddenFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const testConnection = async () => {
    if (!selectedProvider) return;
    
    try {
      setTestingConnection(true);
      setTestResult(null);
      
      // Em uma aplicação real, chamaríamos uma API para testar a conexão
      // Aqui vamos simular um teste
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simular sucesso ou falha aleatória
      const success = Math.random() > 0.3;
      
      const result: ConnectionTestResult = success
        ? {
            success: true,
            message: 'Conexão estabelecida com sucesso',
            statusCode: 200,
            responseTimeMs: Math.floor(Math.random() * 500) + 100
          }
        : {
            success: false,
            message: Math.random() > 0.5 
              ? 'API key inválida ou expirada' 
              : 'Erro de conexão com o serviço',
            statusCode: Math.random() > 0.5 ? 401 : 503
          };
      
      setTestResult(result);
      
      addToast({
        title: result.success ? 'Teste bem-sucedido' : 'Falha no teste',
        message: result.message,
        type: result.success ? 'success' : 'error'
      });
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erro desconhecido ao testar conexão',
      });
      
      addToast({
        title: 'Erro',
        message: 'Falha ao testar conexão com o provedor',
        type: 'error'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.providerId) {
      setError('Selecione um provedor');
      return;
    }
    
    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }
    
    // Verificar se há credenciais
    if (Object.keys(formData.credentials).length === 0) {
      setError('Credenciais são obrigatórias');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const credentialData = {
        name: formData.name,
        description: formData.description || null,
        provider_id: formData.providerId,
        is_system: formData.isSystem,
        tenant_id: formData.isSystem ? null : formData.tenantId,
        credentials: formData.credentials,
        is_active: formData.isActive,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };
      
      if (mode === 'create') {
        // Criar nova credencial
        const { data, error } = await supabase
          .from('llm_provider_credentials')
          .insert([credentialData])
          .select();
        
        if (error) throw error;
        
        setSuccess('Credencial criada com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Credencial criada com sucesso!',
          type: 'success'
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          navigate('/admin/llm/credentials');
        }, 1500);
      } else if (id) {
        // Atualizar credencial existente
        const { error } = await supabase
          .from('llm_provider_credentials')
          .update(credentialData)
          .eq('id', id);
        
        if (error) throw error;
        
        setSuccess('Credencial atualizada com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Credencial atualizada com sucesso!',
          type: 'success'
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          navigate('/admin/llm/credentials');
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao salvar credencial:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a credencial');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao salvar credencial',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/llm/credentials')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Key className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            {mode === 'create' ? 'Nova Credencial de LLM' : 'Editar Credencial de LLM'}
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provedor <span className="text-red-500">*</span>
              </label>
              <select
                id="providerId"
                name="providerId"
                value={formData.providerId}
                onChange={handleProviderChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
                disabled={mode === 'edit'} // Não permitir mudar o provedor na edição
              >
                <option value="">Selecione um provedor</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
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

            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data de Expiração
              </label>
              <input
                type="date"
                id="expiresAt"
                name="expiresAt"
                value={formData.expiresAt || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Deixe em branco para credenciais sem expiração
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSystem"
                name="isSystem"
                checked={formData.isSystem}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isSystem" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Credencial do sistema (disponível para todos os tenants)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Credencial ativa
              </label>
            </div>
          </div>

          {/* Credenciais específicas do provedor */}
          {selectedProvider && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <Key className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Credenciais para {selectedProvider.name}
                </h2>
                
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {testingConnection ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </button>
              </div>
              
              {testResult && (
                <div className={`mb-4 p-4 rounded-md ${
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center">
                    {testResult.success ? (
                      <CheckSquare className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      testResult.success
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {testResult.message}
                    </span>
                  </div>
                  
                  {testResult.statusCode && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-7">
                      Status: {testResult.statusCode}
                      {testResult.responseTimeMs && ` • Tempo de resposta: ${testResult.responseTimeMs}ms`}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {selectedProvider.authMethod === 'api_key' && (
                  <div>
                    <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      API Key <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={hiddenFields.includes('api_key') ? 'password' : 'text'}
                        id="api_key"
                        value={formData.credentials.api_key || ''}
                        onChange={(e) => handleCredentialChange('api_key', e.target.value)}
                        className="w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => toggleFieldVisibility('api_key')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {hiddenFields.includes('api_key') ? (
                          <EyeOff size={16} className="text-gray-400" />
                        ) : (
                          <Eye size={16} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Chave de API para autenticação com {selectedProvider.name}
                    </p>
                  </div>
                )}
                
                {selectedProvider.authMethod === 'oauth2' && (
                  <>
                    <div>
                      <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="client_id"
                        value={formData.credentials.client_id || ''}
                        onChange={(e) => handleCredentialChange('client_id', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client Secret <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={hiddenFields.includes('client_secret') ? 'password' : 'text'}
                          id="client_secret"
                          value={formData.credentials.client_secret || ''}
                          onChange={(e) => handleCredentialChange('client_secret', e.target.value)}
                          className="w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => toggleFieldVisibility('client_secret')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {hiddenFields.includes('client_secret') ? (
                            <EyeOff size={16} className="text-gray-400" />
                          ) : (
                            <Eye size={16} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="redirect_uri" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Redirect URI
                      </label>
                      <input
                        type="text"
                        id="redirect_uri"
                        value={formData.credentials.redirect_uri || ''}
                        onChange={(e) => handleCredentialChange('redirect_uri', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </>
                )}
                
                {/* Campos adicionais específicos por provedor */}
                {selectedProvider.code === 'anthropic' && (
                  <div>
                    <label htmlFor="anthropic_version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Anthropic Version
                    </label>
                    <input
                      type="text"
                      id="anthropic_version"
                      value={formData.credentials.anthropic_version || ''}
                      onChange={(e) => handleCredentialChange('anthropic_version', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="2023-06-01"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Versão da API Anthropic (opcional)
                    </p>
                  </div>
                )}
                
                {selectedProvider.code === 'google' && (
                  <div>
                    <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project ID
                    </label>
                    <input
                      type="text"
                      id="project_id"
                      value={formData.credentials.project_id || ''}
                      onChange={(e) => handleCredentialChange('project_id', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                )}
              </div>
              
              {selectedProvider.documentationUrl && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Documentação de {selectedProvider.name}
                      </h3>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Para obter informações sobre como gerar chaves de API e configurar credenciais, consulte a 
                        <a 
                          href={selectedProvider.documentationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-1 underline hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          documentação oficial
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/llm/credentials')}
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
              {loading ? 'Salvando...' : 'Salvar Credencial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderCredentialsForm;