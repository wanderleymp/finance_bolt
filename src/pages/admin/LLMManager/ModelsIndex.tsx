import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  BrainCircuit, CheckCircle, AlertCircle, 
  RefreshCcw, Check, X, AlertTriangle, Server
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMModel, LLMProvider } from '../../../types/llm';

const ModelsIndex: React.FC = () => {
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [providers, setProviders] = useState<Record<string, LLMProvider>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('llm_models')
        .select('*, provider:provider_id(*)')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedModels: LLMModel[] = data.map(m => ({
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
        
        setModels(formattedModels);
      }
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
      setError('Não foi possível carregar os modelos. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar modelos de LLM',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_providers')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const providersMap: Record<string, LLMProvider> = {};
        
        data.forEach(p => {
          providersMap[p.id] = {
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
          };
        });
        
        setProviders(providersMap);
      }
    } catch (err) {
      console.error('Erro ao carregar provedores:', err);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    // Se não estiver no modo de confirmação para este modelo, solicitar confirmação
    if (deleteConfirmation !== modelId) {
      setDeleteConfirmation(modelId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Verificar se o modelo está sendo usado por agentes
      const { data: agents, error: agentsError } = await supabase
        .from('ai_agents')
        .select('id')
        .or(`model_id.eq.${modelId},fallback_model_id.eq.${modelId}`);
      
      if (agentsError) throw agentsError;
      
      if (agents && agents.length > 0) {
        throw new Error(`Este modelo está sendo usado por ${agents.length} agente(s). Remova as associações primeiro.`);
      }
      
      // Excluir o modelo
      const { error: deleteError } = await supabase
        .from('llm_models')
        .delete()
        .eq('id', modelId);

      if (deleteError) throw deleteError;

      // Atualizar a lista de modelos
      setModels(prev => prev.filter(model => model.id !== modelId));
      
      addToast({
        title: 'Sucesso',
        message: 'Modelo excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o modelo',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmation(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // Filtrar modelos
  const filteredModels = models.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProvider = 
      filterProvider === 'all' || 
      model.providerId === filterProvider;
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && model.isActive) || 
      (filterStatus === 'inactive' && !model.isActive);
    
    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Formatar preço
  const formatPrice = (price: number): string => {
    return `$${price.toFixed(6)}`;
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BrainCircuit className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Modelos de LLM
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie modelos de linguagem disponíveis
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/llm/models/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Modelo
            </Link>
          </div>
        </div>

        {/* Filtros e pesquisa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar modelos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server size={16} className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                <option value="all">Todos os Provedores</option>
                {Object.values(providers).map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
                <div className="mt-2">
                  <button
                    onClick={fetchModels}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando modelos...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <BrainCircuit className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum modelo encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterProvider !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece adicionando seu primeiro modelo de LLM.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/llm/models/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Modelo
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Provedor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contexto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Preço (Input/Output)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredModels.map(model => (
                    <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <BrainCircuit size={20} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {model.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {model.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {model.provider?.name || 'Desconhecido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {model.contextWindow.toLocaleString()} tokens
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatPrice(model.inputPricePer1kTokens)} / {formatPrice(model.outputPricePer1kTokens)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          model.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {model.isActive ? (
                            <>
                              <CheckCircle size={12} className="mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <AlertCircle size={12} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/llm/models/${model.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/admin/llm/models/${model.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          
                          {deleteConfirmation === model.id ? (
                            <>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteModel(model.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Confirmar exclusão"
                              >
                                <Check size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminRedirect>
  );
};

export default ModelsIndex;