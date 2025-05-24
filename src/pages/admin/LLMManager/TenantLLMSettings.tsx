import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Settings, AlertTriangle, CheckSquare, 
  BrainCircuit, Server, Sliders, DollarSign, Info, Database
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { 
  LLMProvider, 
  LLMModel, 
  LLMProviderCredential, 
  TenantLLMSettings as TenantLLMSettingsType,
  LLMBudgetSettings
} from '../../../types/llm';

const TenantLLMSettings: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId } = useParams<{ tenantId: string }>();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [credentials, setCredentials] = useState<LLMProviderCredential[]>([]);
  
  const [llmSettings, setLLMSettings] = useState<{
    id?: string;
    defaultProviderId: string;
    defaultModelId: string;
    fallbackModelId?: string;
    useSystemCredentials: boolean;
    credentialId?: string;
    defaultParameters: {
      temperature: number;
      topP: number;
      frequencyPenalty: number;
      presencePenalty: number;
    };
    isActive: boolean;
  }>({
    defaultProviderId: '',
    defaultModelId: '',
    useSystemCredentials: true,
    defaultParameters: {
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    },
    isActive: true
  });
  
  const [budgetSettings, setBudgetSettings] = useState<{
    id?: string;
    monthlyBudget: number;
    dailyLimit?: number;
    tokenLimitPerHour?: number;
    tokenLimitPerDay?: number;
    alertThresholdPercent: number;
    actionOnLimitReached: 'alert' | 'block' | 'fallback';
    isActive: boolean;
  }>({
    monthlyBudget: 0,
    alertThresholdPercent: 80,
    actionOnLimitReached: 'alert',
    isActive: true
  });

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
      fetchProviders();
      fetchCredentials();
    }
  }, [tenantId]);

  useEffect(() => {
    if (llmSettings.defaultProviderId) {
      fetchModels(llmSettings.defaultProviderId);
    }
  }, [llmSettings.defaultProviderId]);

  const fetchTenantData = async () => {
    try {
      // Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, nome')
        .eq('id', tenantId)
        .single();
      
      if (tenantError) throw tenantError;
      
      if (tenantData) {
        setTenant({
          id: tenantData.id,
          name: tenantData.nome
        });
      }
      
      // Buscar configurações de LLM do tenant
      const { data: settingsData, error: settingsError } = await supabase
        .from('tenant_llm_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle(); // Usando maybeSingle() ao invés de single()
      
      if (!settingsError && settingsData) {
        setLLMSettings({
          id: settingsData.id,
          defaultProviderId: settingsData.default_provider_id || '',
          defaultModelId: settingsData.default_model_id || '',
          fallbackModelId: settingsData.fallback_model_id,
          useSystemCredentials: settingsData.use_system_credentials,
          credentialId: settingsData.credential_id,
          defaultParameters: settingsData.default_parameters || {
            temperature: 0.7,
            topP: 1.0,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0
          },
          isActive: settingsData.is_active
        });
      }
      
      // Buscar configurações de orçamento do tenant
      const { data: budgetData, error: budgetError } = await supabase
        .from('llm_budget_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle(); // Usando maybeSingle() ao invés de single()
      
      if (!budgetError && budgetData) {
        setBudgetSettings({
          id: budgetData.id,
          monthlyBudget: budgetData.monthly_budget,
          dailyLimit: budgetData.daily_limit,
          tokenLimitPerHour: budgetData.token_limit_per_hour,
          tokenLimitPerDay: budgetData.token_limit_per_day,
          alertThresholdPercent: budgetData.alert_threshold_percent,
          actionOnLimitReached: budgetData.action_on_limit_reached,
          isActive: budgetData.is_active
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do tenant:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do tenant',
        type: 'error'
      });
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('is_active', true)
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

  const fetchModels = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('llm_models')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedModels: LLMModel[] = data.map(m => ({
          id: m.id,
          providerId: m.provider_id,
          code: m.code,
          name: m.name,
          description: m.description,
          contextWindow: m.context_window,
          maxTokens: m.max_tokens,
          inputPricePer1kTokens: m.input_price_per_1k_tokens,
          outputPricePer1kTokens: m.output_price_per_1k_tokens,
          supportsFunctions: m.supports_functions,
          supportsVision: m.supports_vision,
          supportsStreaming: m.supports_streaming,
          specialization: m.specialization,
          performanceRating: m.performance_rating,
          isActive: m.is_active,
          createdAt: m.created_at,
          updatedAt: m.updated_at
        }));
        
        setModels(formattedModels);
      }
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar modelos de LLM',
        type: 'error'
      });
    }
  };

  const fetchCredentials = async () => {
    try {
      // Buscar credenciais do sistema
      const { data: systemData, error: systemError } = await supabase
        .from('llm_provider_credentials')
        .select('*, provider:provider_id(*)')
        .eq('is_system', true)
        .eq('is_active', true);
      
      if (systemError) throw systemError;
      
      // Buscar credenciais do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('llm_provider_credentials')
        .select('*, provider:provider_id(*)')
        .eq('is_system', false)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      
      if (tenantError) throw tenantError;
      
      // Combinar e formatar credenciais
      const allCredentials = [...(systemData || []), ...(tenantData || [])];
      
      const formattedCredentials: LLMProviderCredential[] = allCredentials.map(c => ({
        id: c.id,
        providerId: c.provider_id,
        provider: c.provider ? {
          id: c.provider.id,
          code: c.provider.code,
          name: c.provider.name,
          authMethod: c.provider.auth_method,
          status: c.provider.status,
          isActive: c.provider.is_active,
          createdAt: c.provider.created_at,
          updatedAt: c.provider.updated_at
        } : undefined,
        name: c.name,
        description: c.description,
        credentials: c.credentials,
        isSystem: c.is_system,
        tenantId: c.tenant_id,
        isActive: c.is_active,
        expiresAt: c.expires_at,
        lastUsedAt: c.last_used_at,
        lastTestAt: c.last_test_at,
        testStatus: c.test_status,
        createdBy: c.created_by,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }));
      
      setCredentials(formattedCredentials);
    } catch (err) {
      console.error('Erro ao carregar credenciais:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar credenciais de LLM',
        type: 'error'
      });
    }
  };

  const handleLLMSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setLLMSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handleParameterChange = (parameter: string, value: number) => {
    setLLMSettings(prev => ({
      ...prev,
      defaultParameters: {
        ...prev.defaultParameters,
        [parameter]: value
      }
    }));
  };

  const handleBudgetSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setBudgetSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' || name === 'monthlyBudget' || name === 'dailyLimit' || 
          name === 'tokenLimitPerHour' || name === 'tokenLimitPerDay' || name === 'alertThresholdPercent'
          ? Number(value)
          : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!llmSettings.defaultProviderId) {
      setError('Selecione um provedor padrão');
      return;
    }
    
    if (!llmSettings.defaultModelId) {
      setError('Selecione um modelo padrão');
      return;
    }
    
    if (!llmSettings.useSystemCredentials && !llmSettings.credentialId) {
      setError('Selecione uma credencial ou use as credenciais do sistema');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Preparar dados de configuração de LLM
      const llmSettingsData = {
        tenant_id: tenantId,
        default_provider_id: llmSettings.defaultProviderId,
        default_model_id: llmSettings.defaultModelId,
        fallback_model_id: llmSettings.fallbackModelId || null,
        use_system_credentials: llmSettings.useSystemCredentials,
        credential_id: llmSettings.useSystemCredentials ? null : llmSettings.credentialId,
        default_parameters: llmSettings.defaultParameters,
        is_active: llmSettings.isActive
      };
      
      // Preparar dados de configuração de orçamento
      const budgetSettingsData = {
        tenant_id: tenantId,
        monthly_budget: budgetSettings.monthlyBudget,
        daily_limit: budgetSettings.dailyLimit || null,
        token_limit_per_hour: budgetSettings.tokenLimitPerHour || null,
        token_limit_per_day: budgetSettings.tokenLimitPerDay || null,
        alert_threshold_percent: budgetSettings.alertThresholdPercent,
        action_on_limit_reached: budgetSettings.actionOnLimitReached,
        is_active: budgetSettings.isActive
      };
      
      // Salvar configurações de LLM
      if (llmSettings.id) {
        // Atualizar configurações existentes
        const { error: llmError } = await supabase
          .from('tenant_llm_settings')
          .update(llmSettingsData)
          .eq('id', llmSettings.id);
        
        if (llmError) throw llmError;
      } else {
        // Criar novas configurações
        const { error: llmError } = await supabase
          .from('tenant_llm_settings')
          .insert([llmSettingsData]);
        
        if (llmError) throw llmError;
      }
      
      // Salvar configurações de orçamento
      if (budgetSettings.id) {
        // Atualizar configurações existentes
        const { error: budgetError } = await supabase
          .from('llm_budget_settings')
          .update(budgetSettingsData)
          .eq('id', budgetSettings.id);
        
        if (budgetError) throw budgetError;
      } else {
        // Criar novas configurações
        const { error: budgetError } = await supabase
          .from('llm_budget_settings')
          .insert([budgetSettingsData]);
        
        if (budgetError) throw budgetError;
      }
      
      setSuccess('Configurações salvas com sucesso!');
      
      addToast({
        title: 'Sucesso',
        message: 'Configurações de LLM salvas com sucesso!',
        type: 'success'
      });
      
      // Recarregar dados
      fetchTenantData();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar as configurações');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao salvar configurações de LLM',
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
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <BrainCircuit className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Configurações de LLM
            {tenant && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                • {tenant.name}
              </span>
            )}
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
          {/* Configurações de Modelo e Provedor */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Server className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Provedor e Modelo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="defaultProviderId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provedor Padrão <span className="text-red-500">*</span>
                </label>
                <select
                  id="defaultProviderId"
                  name="defaultProviderId"
                  value={llmSettings.defaultProviderId}
                  onChange={handleLLMSettingsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecione um provedor</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="defaultModelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo Padrão <span className="text-red-500">*</span>
                </label>
                <select
                  id="defaultModelId"
                  name="defaultModelId"
                  value={llmSettings.defaultModelId}
                  onChange={handleLLMSettingsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                  disabled={!llmSettings.defaultProviderId}
                >
                  <option value="">Selecione um modelo</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                {!llmSettings.defaultProviderId && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Selecione um provedor primeiro
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="fallbackModelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo de Fallback
                </label>
                <select
                  id="fallbackModelId"
                  name="fallbackModelId"
                  value={llmSettings.fallbackModelId || ''}
                  onChange={handleLLMSettingsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  disabled={!llmSettings.defaultProviderId}
                >
                  <option value="">Nenhum (desativado)</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Modelo alternativo para usar quando limites são atingidos
                </p>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="useSystemCredentials"
                    name="useSystemCredentials"
                    checked={llmSettings.useSystemCredentials}
                    onChange={handleLLMSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useSystemCredentials" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Usar credenciais do sistema
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={llmSettings.isActive}
                    onChange={handleLLMSettingsChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Configurações ativas
                  </label>
                </div>
              </div>
            </div>
            
            {!llmSettings.useSystemCredentials && (
              <div className="mt-4">
                <label htmlFor="credentialId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Credencial <span className="text-red-500">*</span>
                </label>
                <select
                  id="credentialId"
                  name="credentialId"
                  value={llmSettings.credentialId || ''}
                  onChange={handleLLMSettingsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required={!llmSettings.useSystemCredentials}
                >
                  <option value="">Selecione uma credencial</option>
                  {credentials
                    .filter(c => !llmSettings.defaultProviderId || c.providerId === llmSettings.defaultProviderId)
                    .map(credential => (
                      <option key={credential.id} value={credential.id}>
                        {credential.name} {credential.isSystem ? '(Sistema)' : '(Tenant)'}
                      </option>
                    ))}
                </select>
                {credentials.length === 0 && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                    Nenhuma credencial disponível. Por favor, crie uma credencial primeiro.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Parâmetros do Modelo */}
          <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Sliders className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Parâmetros do Modelo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperatura: {llmSettings.defaultParameters.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={llmSettings.defaultParameters.temperature}
                  onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Preciso (0)</span>
                  <span>Criativo (1)</span>
                </div>
              </div>

              <div>
                <label htmlFor="topP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Top P: {llmSettings.defaultParameters.topP}
                </label>
                <input
                  type="range"
                  id="topP"
                  min="0"
                  max="1"
                  step="0.1"
                  value={llmSettings.defaultParameters.topP}
                  onChange={(e) => handleParameterChange('topP', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Determinístico (0)</span>
                  <span>Diverso (1)</span>
                </div>
              </div>

              <div>
                <label htmlFor="frequencyPenalty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penalidade de Frequência: {llmSettings.defaultParameters.frequencyPenalty}
                </label>
                <input
                  type="range"
                  id="frequencyPenalty"
                  min="0"
                  max="2"
                  step="0.1"
                  value={llmSettings.defaultParameters.frequencyPenalty}
                  onChange={(e) => handleParameterChange('frequencyPenalty', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500  dark:text-gray-400 mt-1">
                  <span>Sem penalidade (0)</span>
                  <span>Máxima (2)</span>
                </div>
              </div>

              <div>
                <label htmlFor="presencePenalty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penalidade de Presença: {llmSettings.defaultParameters.presencePenalty}
                </label>
                <input
                  type="range"
                  id="presencePenalty"
                  min="0"
                  max="2"
                  step="0.1"
                  value={llmSettings.defaultParameters.presencePenalty}
                  onChange={(e) => handleParameterChange('presencePenalty', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Sem penalidade (0)</span>
                  <span>Máxima (2)</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sobre os parâmetros
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <strong>Temperatura:</strong> Controla a aleatoriedade das respostas. Valores mais baixos são mais determinísticos e precisos, valores mais altos são mais criativos.
                  </p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <strong>Top P:</strong> Controla a diversidade do texto. Valores mais baixos consideram apenas as palavras mais prováveis, valores mais altos permitem mais variedade.
                  </p>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    <strong>Penalidades:</strong> Reduzem a repetição de palavras e frases. Valores mais altos desencorajam repetições.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações de Orçamento */}
          <div className="mb-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Orçamento e Limites
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="monthlyBudget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Orçamento Mensal (R$)
                </label>
                <input
                  type="number"
                  id="monthlyBudget"
                  name="monthlyBudget"
                  value={budgetSettings.monthlyBudget}
                  onChange={handleBudgetSettingsChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Defina 0 para sem limite
                </p>
              </div>

              <div>
                <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite Diário (R$)
                </label>
                <input
                  type="number"
                  id="dailyLimit"
                  name="dailyLimit"
                  value={budgetSettings.dailyLimit || ''}
                  onChange={handleBudgetSettingsChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deixe em branco para sem limite diário
                </p>
              </div>

              <div>
                <label htmlFor="tokenLimitPerHour" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Tokens por Hora
                </label>
                <input
                  type="number"
                  id="tokenLimitPerHour"
                  name="tokenLimitPerHour"
                  value={budgetSettings.tokenLimitPerHour || ''}
                  onChange={handleBudgetSettingsChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="tokenLimitPerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Tokens por Dia
                </label>
                <input
                  type="number"
                  id="tokenLimitPerDay"
                  name="tokenLimitPerDay"
                  value={budgetSettings.tokenLimitPerDay || ''}
                  onChange={handleBudgetSettingsChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="alertThresholdPercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite para Alertas (%)
                </label>
                <input
                  type="number"
                  id="alertThresholdPercent"
                  name="alertThresholdPercent"
                  value={budgetSettings.alertThresholdPercent}
                  onChange={handleBudgetSettingsChange}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Percentual do limite para começar a enviar alertas
                </p>
              </div>

              <div>
                <label htmlFor="actionOnLimitReached" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ação ao Atingir Limite
                </label>
                <select
                  id="actionOnLimitReached"
                  name="actionOnLimitReached"
                  value={budgetSettings.actionOnLimitReached}
                  onChange={handleBudgetSettingsChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="alert">Apenas Alertar</option>
                  <option value="block">Bloquear Uso</option>
                  <option value="fallback">Usar Modelo de Fallback</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/tenants')}
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
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantLLMSettings;