import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BrainCircuit, Server, Key, DollarSign, BarChart2, 
  AlertTriangle, CheckCircle, RefreshCcw, Settings, Plus
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMProvider, LLMModel, LLMUsageLog } from '../../../types/llm';

const LLMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [usageLogs, setUsageLogs] = useState<LLMUsageLog[]>([]);
  
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    totalModels: 0,
    activeModels: 0,
    totalTokensToday: 0,
    totalCostToday: 0,
    totalTokensMonth: 0,
    totalCostMonth: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Buscar provedores
      const { data: providersData, error: providersError } = await supabase
        .from('llm_providers')
        .select('*')
        .order('name');
      
      if (providersError) throw providersError;
      
      // Buscar modelos
      const { data: modelsData, error: modelsError } = await supabase
        .from('llm_models')
        .select('*, provider:provider_id(*)')
        .order('name');
      
      if (modelsError) throw modelsError;
      
      // Buscar logs de uso (últimos 30 dias)
      const { data: logsData, error: logsError } = await supabase
        .from('llm_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });
      
      if (logsError) throw logsError;
      
      // Formatar dados
      const formattedProviders: LLMProvider[] = providersData.map(p => ({
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
      
      const formattedModels: LLMModel[] = modelsData.map(m => ({
        id: m.id,
        providerId: m.provider_id,
        provider: m.provider ? {
          id: m.provider.id,
          code: m.provider.code,
          name: m.provider.name,
          authMethod: m.provider.auth_method,
          status: m.provider.status,
          isActive: m.provider.is_active,
          createdAt: m.provider.created_at,
          updatedAt: m.provider.updated_at
        } : undefined,
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
      
      const formattedLogs: LLMUsageLog[] = logsData.map(log => ({
        id: log.id,
        tenantId: log.tenant_id,
        userId: log.user_id,
        providerId: log.provider_id,
        modelId: log.model_id,
        requestId: log.request_id,
        promptTokens: log.prompt_tokens,
        completionTokens: log.completion_tokens,
        totalTokens: log.total_tokens,
        estimatedCost: log.estimated_cost,
        durationMs: log.duration_ms,
        status: log.status,
        errorMessage: log.error_message,
        metadata: log.metadata,
        createdAt: log.created_at
      }));
      
      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      
      const todayLogs = formattedLogs.filter(log => log.createdAt.startsWith(today));
      const monthLogs = formattedLogs.filter(log => log.createdAt >= firstDayOfMonth);
      
      const totalTokensToday = todayLogs.reduce((sum, log) => sum + log.totalTokens, 0);
      const totalCostToday = todayLogs.reduce((sum, log) => sum + log.estimatedCost, 0);
      
      const totalTokensMonth = monthLogs.reduce((sum, log) => sum + log.totalTokens, 0);
      const totalCostMonth = monthLogs.reduce((sum, log) => sum + log.estimatedCost, 0);
      
      // Atualizar estado
      setProviders(formattedProviders);
      setModels(formattedModels);
      setUsageLogs(formattedLogs);
      
      setStats({
        totalProviders: formattedProviders.length,
        activeProviders: formattedProviders.filter(p => p.isActive).length,
        totalModels: formattedModels.length,
        activeModels: formattedModels.filter(m => m.isActive).length,
        totalTokensToday,
        totalCostToday,
        totalTokensMonth,
        totalCostMonth
      });
      
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do LLM Manager',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatar número como moeda
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Formatar número com separadores de milhar
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BrainCircuit className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
            LLM Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie provedores, modelos e uso de LLMs
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCcw className="h-4 w-4 mr-1.5" />
            Atualizar
          </button>
          
          <button
            onClick={() => navigate('/admin/llm/settings')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Configurações
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Provedores</h3>
            <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeProviders}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            de {stats.totalProviders} configurados
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Modelos</h3>
            <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeModels}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            de {stats.totalModels} disponíveis
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tokens Hoje</h3>
            <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalTokensToday)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Custo: {formatCurrency(stats.totalCostToday)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tokens no Mês</h3>
            <DollarSign className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(stats.totalTokensMonth)}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Custo: {formatCurrency(stats.totalCostMonth)}
          </p>
        </div>
      </div>

      {/* Status dos Provedores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Status dos Provedores
            </h2>
            <button
              onClick={() => navigate('/admin/llm/providers')}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Provedor
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Provedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Modelos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Autenticação
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                      Carregando provedores...
                    </div>
                  </td>
                </tr>
              ) : providers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum provedor configurado
                  </td>
                </tr>
              ) : (
                providers.map(provider => {
                  const providerModels = models.filter(m => m.providerId === provider.id);
                  const activeModels = providerModels.filter(m => m.isActive);
                  
                  return (
                    <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BrainCircuit size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {provider.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {provider.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {provider.isActive ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {activeModels.length} de {providerModels.length} ativos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {provider.authMethod === 'api_key' ? 'API Key' : 
                         provider.authMethod === 'oauth2' ? 'OAuth 2.0' : 'Nenhuma'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/admin/llm/providers/${provider.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => navigate(`/admin/llm/providers/${provider.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modelos Populares */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Modelos Populares
            </h2>
            <button
              onClick={() => navigate('/admin/llm/models')}
              className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Ver todos
            </button>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
              <span className="text-gray-500 dark:text-gray-400">Carregando modelos...</span>
            </div>
          ) : models.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              Nenhum modelo disponível
            </div>
          ) : (
            models
              .filter(m => m.isActive)
              .slice(0, 6)
              .map(model => (
                <div 
                  key={model.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <BrainCircuit size={16} />
                      </div>
                      <div className="ml-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {model.provider?.name}
                        </p>
                      </div>
                    </div>
                    {model.supportsVision && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        Visão
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Contexto:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{formatNumber(model.contextWindow)} tokens</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Funções:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">{model.supportsFunctions ? 'Sim' : 'Não'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Custo:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        ${model.inputPricePer1kTokens.toFixed(4)}/{model.outputPricePer1kTokens.toFixed(4)} por 1K tokens
                      </span>
                    </div>
                  </div>
                </div>
              ))
          )}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-center">
            <div className="flex justify-center space-x-4">
              <Link
                to="/admin/llm/models"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <BrainCircuit className="h-4 w-4 mr-1.5" />
                Gerenciar Modelos
              </Link>
              <Link
                to="/admin/llm/providers"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Server className="h-4 w-4 mr-1.5" />
                Gerenciar Provedores
              </Link>
              <Link
                to="/admin/llm/credentials"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Key className="h-4 w-4 mr-1.5" />
                Gerenciar Credenciais
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Uso Recente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Uso Recente
            </h2>
            <button
              onClick={() => navigate('/admin/llm/usage')}
              className="text-sm text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Relatório completo
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Modelo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tokens
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Custo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                      Carregando logs de uso...
                    </div>
                  </td>
                </tr>
              ) : usageLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Nenhum log de uso encontrado
                  </td>
                </tr>
              ) : (
                usageLogs.slice(0, 5).map(log => {
                  const model = models.find(m => m.id === log.modelId);
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {model?.name || 'Desconhecido'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {model?.provider?.name || 'Provedor desconhecido'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col">
                          <span>Total: {formatNumber(log.totalTokens)}</span>
                          <span className="text-xs">
                            (Input: {formatNumber(log.promptTokens)}, Output: {formatNumber(log.completionTokens)})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(log.estimatedCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {log.status === 'success' ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Sucesso
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} className="mr-1" />
                              Erro
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LLMDashboard