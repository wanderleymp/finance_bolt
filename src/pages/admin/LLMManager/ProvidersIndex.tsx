import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  Server, CheckCircle, AlertCircle, 
  RefreshCcw, Check, X, BrainCircuit, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMProvider } from '../../../types/llm';

const ProvidersIndex: React.FC = () => {
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
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
      setError('Não foi possível carregar os provedores. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar provedores de LLM',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    // Se não estiver no modo de confirmação para este provedor, solicitar confirmação
    if (deleteConfirmation !== providerId) {
      setDeleteConfirmation(providerId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Verificar se há modelos associados a este provedor
      const { data: models, error: modelsError } = await supabase
        .from('llm_models')
        .select('id')
        .eq('provider_id', providerId);
      
      if (modelsError) throw modelsError;
      
      if (models && models.length > 0) {
        throw new Error(`Este provedor possui ${models.length} modelo(s) associado(s). Remova os modelos primeiro.`);
      }
      
      // Verificar se há credenciais associadas a este provedor
      const { data: credentials, error: credsError } = await supabase
        .from('llm_provider_credentials')
        .select('id')
        .eq('provider_id', providerId);
      
      if (credsError) throw credsError;
      
      if (credentials && credentials.length > 0) {
        throw new Error(`Este provedor possui ${credentials.length} credencial(is) associada(s). Remova as credenciais primeiro.`);
      }
      
      // Excluir o provedor
      const { error: deleteError } = await supabase
        .from('llm_providers')
        .delete()
        .eq('id', providerId);

      if (deleteError) throw deleteError;

      // Atualizar a lista de provedores
      setProviders(prev => prev.filter(provider => provider.id !== providerId));
      
      addToast({
        title: 'Sucesso',
        message: 'Provedor excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir provedor:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o provedor',
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

  // Filtrar provedores
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.description && provider.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && provider.isActive) || 
      (filterStatus === 'inactive' && !provider.isActive);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Server className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Provedores de LLM
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie provedores de modelos de linguagem
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/llm/providers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Provedor
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
                placeholder="Pesquisar provedores..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                    onClick={fetchProviders}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando provedores...</span>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <Server className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum provedor encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece adicionando seu primeiro provedor de LLM.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/llm/providers/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Provedor
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
                      Provedor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Autenticação
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
                  {filteredProviders.map(provider => (
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
                            {provider.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {provider.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {provider.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {provider.authMethod === 'api_key' ? 'API Key' : 
                         provider.authMethod === 'oauth2' ? 'OAuth 2.0' : 
                         provider.authMethod === 'none' ? 'Nenhuma' : provider.authMethod}
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
                              <AlertCircle size={12} className="mr-1" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/llm/providers/${provider.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Visualizar"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/admin/llm/providers/${provider.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          
                          {deleteConfirmation === provider.id ? (
                            <>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProvider(provider.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Confirmar exclusão"
                              >
                                <Check size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteProvider(provider.id)}
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

export default ProvidersIndex;