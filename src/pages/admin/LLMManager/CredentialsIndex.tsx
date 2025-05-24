import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  Key, CheckCircle, AlertCircle, Clock, 
  RefreshCcw, Check, X, AlertTriangle, Server
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMProviderCredential } from '../../../types/llm';

const CredentialsIndex: React.FC = () => {
  const { addToast } = useUI();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<LLMProviderCredential[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [testingCredential, setTestingCredential] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('llm_provider_credentials')
        .select('*, provider:provider_id(*)')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedCredentials: LLMProviderCredential[] = data.map(c => ({
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
      }
    } catch (err) {
      console.error('Erro ao carregar credenciais:', err);
      setError('Não foi possível carregar as credenciais. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar credenciais de LLM',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testCredential = async (credId: string) => {
    try {
      setTestingCredential(credId);
      
      // Simulação de teste - em uma aplicação real, chamaríamos uma API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar status do teste na lista
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credId
            ? { 
                ...cred, 
                testStatus: Math.random() > 0.2 ? 'success' : 'error',
                lastTestAt: new Date().toISOString()
              }
            : cred
        )
      );
      
      addToast({
        title: 'Teste concluído',
        message: 'O teste da credencial foi realizado com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao testar credencial:', err);
      
      addToast({
        title: 'Erro no teste',
        message: 'Não foi possível testar a credencial',
        type: 'error'
      });
    } finally {
      setTestingCredential(null);
    }
  };

  const handleDeleteCredential = async (credId: string) => {
    // Se não estiver no modo de confirmação para esta credencial, solicitar confirmação
    if (deleteConfirmation !== credId) {
      setDeleteConfirmation(credId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Verificar se a credencial está sendo usada
      const { data: settings, error: settingsError } = await supabase
        .from('tenant_llm_settings')
        .select('id')
        .eq('credential_id', credId);
      
      if (settingsError) throw settingsError;
      
      if (settings && settings.length > 0) {
        throw new Error(`Esta credencial está sendo usada por ${settings.length} configuração(ões) de tenant. Remova as associações primeiro.`);
      }
      
      // Excluir a credencial
      const { error: deleteError } = await supabase
        .from('llm_provider_credentials')
        .delete()
        .eq('id', credId);

      if (deleteError) throw deleteError;

      // Atualizar a lista de credenciais
      setCredentials(prev => prev.filter(cred => cred.id !== credId));
      
      addToast({
        title: 'Sucesso',
        message: 'Credencial excluída com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir credencial:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir a credencial',
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

  // Filtrar credenciais
  const filteredCredentials = credentials.filter(cred => {
    const matchesSearch = 
      cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cred.description && cred.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cred.provider?.name && cred.provider.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProvider = 
      filterProvider === 'all' || 
      cred.providerId === filterProvider;
    
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'system' && cred.isSystem) || 
      (filterType === 'tenant' && !cred.isSystem);
    
    return matchesSearch && matchesProvider && matchesType;
  });

  // Formatar data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar se uma credencial está expirada
  const isCredentialExpired = (cred: LLMProviderCredential): boolean => {
    return cred.expiresAt ? new Date(cred.expiresAt) < new Date() : false;
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Key className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Credenciais de LLM
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie credenciais para provedores de LLM
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/llm/credentials/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Credencial
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
                placeholder="Pesquisar credenciais..."
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
                {Array.from(new Set(credentials.map(c => c.providerId))).map(providerId => {
                  const provider = credentials.find(c => c.providerId === providerId)?.provider;
                  return (
                    <option key={providerId} value={providerId}>
                      {provider?.name || 'Desconhecido'}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos os Tipos</option>
                <option value="system">Sistema</option>
                <option value="tenant">Tenant</option>
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
                    onClick={fetchCredentials}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando credenciais...</span>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <Key className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma credencial encontrada</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterProvider !== 'all' || filterType !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece adicionando sua primeira credencial de LLM.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/llm/credentials/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Credencial
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map(cred => (
              <div 
                key={cred.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border ${
                  isCredentialExpired(cred)
                    ? 'border-red-300 dark:border-red-700'
                    : cred.testStatus === 'error'
                    ? 'border-red-300 dark:border-red-700'
                    : cred.isSystem
                    ? 'border-purple-300 dark:border-purple-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-md flex items-center justify-center ${
                        isCredentialExpired(cred) || cred.testStatus === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        <Key size={20} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {cred.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {cred.provider?.name || 'Provedor desconhecido'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cred.isSystem
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {cred.isSystem ? 'Sistema' : 'Tenant'}
                      </span>
                    </div>
                  </div>
                  
                  {cred.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {cred.description}
                    </p>
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>
                        {cred.lastTestAt ? `Testado: ${formatDate(cred.lastTestAt)}` : 'Nunca testado'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      {cred.testStatus === 'success' ? (
                        <CheckCircle size={14} className="mr-1 text-green-500 dark:text-green-400" />
                      ) : cred.testStatus === 'error' ? (
                        <AlertCircle size={14} className="mr-1 text-red-500 dark:text-red-400" />
                      ) : (
                        <Clock size={14} className="mr-1" />
                      )}
                      <span>
                        {cred.testStatus === 'success' ? 'Funcionando' : 
                         cred.testStatus === 'error' ? 'Com erro' : 
                         'Status desconhecido'}
                      </span>
                    </div>
                    
                    {cred.expiresAt && (
                      <div className={`col-span-2 flex items-center ${
                        isCredentialExpired(cred) ? 'text-red-500 dark:text-red-400' : ''
                      }`}>
                        <Clock size={14} className="mr-1" />
                        <span>
                          {isCredentialExpired(cred) ? 'Expirou em: ' : 'Expira em: '}
                          {formatDate(cred.expiresAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testCredential(cred.id)}
                      disabled={testingCredential === cred.id}
                      className={`p-2 rounded-md ${
                        testingCredential === cred.id
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                      }`}
                      title="Testar Conexão"
                    >
                      {testingCredential === cred.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent" />
                      ) : (
                        <RefreshCcw size={16} />
                      )}
                    </button>
                    
                    <Link
                      to={`/admin/llm/credentials/${cred.id}`}
                      className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md"
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </Link>
                    
                    <Link
                      to={`/admin/llm/credentials/${cred.id}/edit`}
                      className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-md"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </Link>
                  </div>
                  
                  <div>
                    {deleteConfirmation === cred.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={cancelDelete}
                          className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 rounded-md"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCredential(cred.id)}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                          title="Confirmar exclusão"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteCredential(cred.id)}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                        title="Excluir"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminRedirect>
  );
};

export default CredentialsIndex;