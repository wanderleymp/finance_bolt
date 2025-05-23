import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  Key, CheckCircle, AlertCircle, Clock, 
  RefreshCcw, Check, X, AlertTriangle
} from 'lucide-react';
import { SystemCredential, CredentialProvider } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const SystemCredentialsIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<SystemCredential[]>([]);
  const [providers, setProviders] = useState<CredentialProvider[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [testingCredential, setTestingCredential] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    inactive: 0
  });

  useEffect(() => {
    fetchProviders();
    fetchCredentials();
  }, []);

  const fetchProviders = async () => {
    try {
      console.log('CredentialsIndex: Carregando provedores...');
      
      const { data, error } = await supabase
        .from('credential_providers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('CredentialsIndex: Erro ao buscar provedores:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`CredentialsIndex: ${data.length} provedores encontrados`);
        
        const formattedProviders: CredentialProvider[] = data.map(provider => ({
          code: provider.code,
          name: provider.name,
          description: provider.description,
          icon: provider.icon,
          authTypes: provider.auth_types,
          fields: provider.fields,
          helpUrl: provider.help_url,
          isActive: provider.is_active
        }));
        
        setProviders(formattedProviders);
      } else {
        console.log('CredentialsIndex: Nenhum provedor encontrado');
      }
    } catch (err) {
      console.error('CredentialsIndex: Erro ao carregar provedores:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar provedores de credenciais',
        type: 'error'
      });
    }
  };

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      console.log('CredentialsIndex: Carregando credenciais...');
      
      const { data, error } = await supabase
        .from('system_credentials')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('CredentialsIndex: Erro ao buscar credenciais:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`CredentialsIndex: ${data.length} credenciais encontradas`);
        
        const formattedCredentials: SystemCredential[] = data.map(cred => ({
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
          metadata: cred.metadata,
          
          // Simular status de teste para demonstração
          testStatus: Math.random() > 0.7 
            ? 'error' 
            : Math.random() > 0.3 
              ? 'success' 
              : 'pending',
          lastTestDate: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString()
        }));
        
        setCredentials(formattedCredentials);
        
        // Calcular estatísticas
        const now = new Date();
        const stats = {
          total: formattedCredentials.length,
          active: formattedCredentials.filter(c => c.isActive).length,
          expired: formattedCredentials.filter(c => c.expiresAt && new Date(c.expiresAt) < now).length,
          inactive: formattedCredentials.filter(c => !c.isActive).length
        };
        
        setStats(stats);
      } else {
        console.log('CredentialsIndex: Nenhuma credencial encontrada');
        setCredentials([]);
        setStats({
          total: 0,
          active: 0,
          expired: 0,
          inactive: 0
        });
      }
    } catch (err) {
      console.error('CredentialsIndex: Erro ao carregar credenciais:', err);
      setError('Não foi possível carregar as credenciais. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar credenciais',
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
                lastTestDate: new Date().toISOString()
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
      console.error('CredentialsIndex: Erro ao testar credencial:', err);
      
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
      console.log('CredentialsIndex: Excluindo credencial:', credId);

      // Verificar dependências antes de excluir
      const { data: storageConfigs, error: storageError } = await supabase
        .from('storage_configs')
        .select('id')
        .eq('credential_id', credId);
      
      if (storageError) {
        console.error('CredentialsIndex: Erro ao verificar configurações de armazenamento:', storageError);
        throw storageError;
      }

      if (storageConfigs && storageConfigs.length > 0) {
        throw new Error(`Esta credencial está sendo usada por ${storageConfigs.length} configuração(ões) de armazenamento. Remova as dependências antes de excluir.`);
      }

      // Verificar credenciais de tenant que usam esta credencial
      const { data: tenantCreds, error: tenantCredsError } = await supabase
        .from('tenant_credentials')
        .select('id')
        .eq('system_credential_id', credId);
      
      if (tenantCredsError) {
        console.error('CredentialsIndex: Erro ao verificar credenciais de tenant:', tenantCredsError);
        throw tenantCredsError;
      }

      if (tenantCreds && tenantCreds.length > 0) {
        throw new Error(`Esta credencial está sendo usada por ${tenantCreds.length} credencial(is) de tenant. Remova as dependências antes de excluir.`);
      }

      // Excluir os registros de teste associados
      const { error: testLogsError } = await supabase
        .from('credential_test_logs')
        .delete()
        .eq('credential_id', credId)
        .eq('credential_type', 'system');
      
      if (testLogsError) {
        console.error('CredentialsIndex: Erro ao excluir logs de teste:', testLogsError);
        throw testLogsError;
      }

      // Excluir a credencial
      const { error: deleteError } = await supabase
        .from('system_credentials')
        .delete()
        .eq('id', credId);

      if (deleteError) {
        console.error('CredentialsIndex: Erro ao excluir credencial:', deleteError);
        throw deleteError;
      }

      // Atualizar a lista de credenciais
      setCredentials(prev => prev.filter(cred => cred.id !== credId));
      
      // Atualizar estatísticas
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        active: prev.active - (credentials.find(c => c.id === credId)?.isActive ? 1 : 0),
        expired: prev.expired - (credentials.find(c => c.id === credId)?.expiresAt && new Date(credentials.find(c => c.id === credId)?.expiresAt as string) < new Date() ? 1 : 0),
        inactive: prev.inactive - (!credentials.find(c => c.id === credId)?.isActive ? 1 : 0)
      }));
      
      addToast({
        title: 'Sucesso',
        message: 'Credencial excluída com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('CredentialsIndex: Erro ao excluir credencial:', err);
      
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
      cred.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = 
      filterProvider === 'all' || 
      cred.provider === filterProvider;
    
    const now = new Date();
    const isExpired = cred.expiresAt && new Date(cred.expiresAt) < now;
    
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && cred.isActive && !isExpired) || 
      (filterStatus === 'inactive' && !cred.isActive) ||
      (filterStatus === 'expired' && isExpired);
    
    return matchesSearch && matchesProvider && matchesStatus;
  });

  // Encontrar o nome do provedor
  const getProviderName = (code: string): string => {
    const provider = providers.find(p => p.code === code);
    return provider ? provider.name : code;
  };

  // Verificar se uma credencial está expirada
  const isCredentialExpired = (cred: SystemCredential): boolean => {
    return cred.expiresAt ? new Date(cred.expiresAt) < new Date() : false;
  };

  // Verificar se uma credencial expira em breve (30 dias)
  const isCredentialExpiringCritical = (cred: SystemCredential): boolean => {
    if (!cred.expiresAt) return false;
    
    const expireDate = new Date(cred.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  // Verificar se uma credencial expira em breve (30 dias)
  const isCredentialExpiringWarning = (cred: SystemCredential): boolean => {
    if (!cred.expiresAt) return false;
    
    const expireDate = new Date(cred.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return daysUntilExpiry > 7 && daysUntilExpiry <= 30;
  };

  // Formatar data
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Credenciais do Sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie credenciais de integração globais
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/credentials/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Credencial
            </Link>
          </div>
        </div>

        {/* Resumo das estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-indigo-100 dark:bg-indigo-900/30 p-3">
                <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total de Credenciais</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.total}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Ativas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.active}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-red-100 dark:bg-red-900/30 p-3">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Expiradas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.expired}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-gray-100 dark:bg-gray-700 p-3">
                <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Inativas</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.inactive}</div>
                  </dd>
                </dl>
              </div>
            </div>
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
                <Filter size={16} className="text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                <option value="all">Todos os Provedores</option>
                {providers.map(provider => (
                  <option key={provider.code} value={provider.code}>
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
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
                <option value="expired">Expiradas</option>
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
              {searchTerm || filterProvider !== 'all' || filterStatus !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece criando sua primeira credencial de integração.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/credentials/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Credencial
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCredentials.map(credential => (
              <div 
                key={credential.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border ${
                  credential.testStatus === 'error' || isCredentialExpired(credential)
                    ? 'border-red-300 dark:border-red-700'
                    : isCredentialExpiringCritical(credential)
                    ? 'border-yellow-300 dark:border-yellow-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4 flex justify-between">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 p-2 rounded-md ${
                      credential.testStatus === 'error' || isCredentialExpired(credential)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : isCredentialExpiringCritical(credential)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      <Key size={24} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {credential.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {getProviderName(credential.provider)}
                      </p>
                      {credential.description && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {credential.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    {credential.testStatus === 'success' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                        <CheckCircle size={12} className="mr-1" />
                        OK
                      </span>
                    ) : credential.testStatus === 'error' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                        <AlertCircle size={12} className="mr-1" />
                        Erro
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <Clock size={12} className="mr-1" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-xs border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock size={14} className="mr-1" /> Último teste: {formatDate(credential.lastTestDate)}
                      </p>
                      {credential.expiresAt && (
                        <p className={`flex items-center mt-1 ${
                          isCredentialExpired(credential)
                            ? 'text-red-600 dark:text-red-400'
                            : isCredentialExpiringCritical(credential)
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : isCredentialExpiringWarning(credential)
                            ? 'text-yellow-500 dark:text-yellow-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <Clock size={14} className="mr-1" /> 
                          {isCredentialExpired(credential)
                            ? 'Expirou em: '
                            : 'Expira em: '
                          }
                          {formatDate(credential.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => testCredential(credential.id)}
                        disabled={testingCredential === credential.id}
                        className={`p-2 rounded-md ${
                          testingCredential === credential.id
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                        }`}
                        title="Testar Conexão"
                      >
                        {testingCredential === credential.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent" />
                        ) : (
                          <RefreshCcw size={16} />
                        )}
                      </button>
                      <Link
                        to={`/admin/credentials/${credential.id}`}
                        className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md"
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/admin/credentials/${credential.id}/edit`}
                        className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-md"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </Link>
                      {deleteConfirmation === credential.id ? (
                        <>
                          <button
                            onClick={cancelDelete}
                            className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 rounded-md"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCredential(credential.id)}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                            title="Confirmar exclusão"
                          >
                            <Check size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                          title="Excluir"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
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

export default SystemCredentialsIndex;