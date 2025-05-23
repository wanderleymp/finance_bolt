import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  HardDrive, CheckCircle, AlertCircle, 
  RefreshCcw, Check, X, Database, AlertTriangle,
  Cloud
} from 'lucide-react';
import { StorageConfig, StorageProvider, SystemModule } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const StorageConfigsIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [storageConfigs, setStorageConfigs] = useState<StorageConfig[]>([]);
  const [providers, setProviders] = useState<StorageProvider[]>([]);
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [syncingStorage, setSyncingStorage] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
    fetchModules();
    fetchStorageConfigs();
  }, []);

  // Buscar provedores de armazenamento
  const fetchProviders = async () => {
    try {
      console.log('StorageConfigsIndex: Carregando provedores...');
      
      const { data, error } = await supabase
        .from('storage_providers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('StorageConfigsIndex: Erro ao buscar provedores:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`StorageConfigsIndex: ${data.length} provedores encontrados`);
        
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
      } else {
        console.log('StorageConfigsIndex: Nenhum provedor encontrado');
      }
    } catch (err) {
      console.error('StorageConfigsIndex: Erro ao carregar provedores:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar provedores de armazenamento',
        type: 'error'
      });
    }
  };

  // Buscar módulos do sistema
  const fetchModules = async () => {
    try {
      console.log('StorageConfigsIndex: Carregando módulos...');
      
      const { data, error } = await supabase
        .from('system_modules')
        .select('*')
        .eq('storage_enabled', true)
        .order('name');
      
      if (error) {
        console.error('StorageConfigsIndex: Erro ao buscar módulos:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`StorageConfigsIndex: ${data.length} módulos encontrados`);
        
        const formattedModules: SystemModule[] = data.map(module => ({
          code: module.code,
          name: module.name,
          description: module.description,
          icon: module.icon,
          isActive: module.is_active,
          storageEnabled: module.storage_enabled,
          requiredFeatures: module.required_features
        }));
        
        setModules(formattedModules);
      }
    } catch (err) {
      console.error('StorageConfigsIndex: Erro ao carregar módulos:', err);
    }
  };

  // Buscar configurações de armazenamento
  const fetchStorageConfigs = async () => {
    try {
      setLoading(true);
      console.log('StorageConfigsIndex: Carregando configurações de armazenamento...');
      
      const { data, error } = await supabase
        .from('storage_configs')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('StorageConfigsIndex: Erro ao buscar configurações:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`StorageConfigsIndex: ${data.length} configurações encontradas`);
        
        // Simular estatísticas para demo
        const formattedConfigs: StorageConfig[] = data.map(config => {
          // Gerar estatísticas simuladas
          const filesCount = Math.floor(Math.random() * 10000);
          const totalSize = filesCount * Math.floor(Math.random() * 1024 * 1024); // tamanho médio de 1MB
          const spaceLimit = config.space_limit || 1024 * 1024 * 1024 * 10; // 10GB padrão se não estiver definido
          
          return {
            id: config.id,
            name: config.name,
            description: config.description,
            provider: config.provider,
            configType: config.config_type as 'system' | 'tenant',
            tenantId: config.tenant_id,
            credentialId: config.credential_id,
            settings: config.settings,
            isActive: config.is_active,
            isDefault: config.is_default,
            createdAt: config.created_at,
            updatedAt: config.updated_at,
            createdBy: config.created_by,
            updatedBy: config.updated_by,
            spaceUsed: config.space_used || totalSize,
            spaceLimit: config.space_limit || spaceLimit,
            lastSyncAt: config.last_sync_at || new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            stats: {
              filesCount,
              totalSize,
              lastUpload: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
              uploadCount: Math.floor(Math.random() * 100),
              downloadCount: Math.floor(Math.random() * 50),
              availableSpace: spaceLimit - totalSize,
              usedPercentage: (totalSize / spaceLimit) * 100
            }
          };
        });
        
        setStorageConfigs(formattedConfigs);
      } else {
        console.log('StorageConfigsIndex: Nenhuma configuração encontrada');
        setStorageConfigs([]);
      }
    } catch (err) {
      console.error('StorageConfigsIndex: Erro ao carregar configurações:', err);
      setError('Não foi possível carregar as configurações de armazenamento. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar configurações de armazenamento',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    // Se não estiver no modo de confirmação para esta config, solicitar confirmação
    if (deleteConfirmation !== configId) {
      setDeleteConfirmation(configId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Verificar se há mapeamentos de módulos usando esta configuração
      const { data: mappings, error: mappingsError } = await supabase
        .from('module_storage_mappings')
        .select('id')
        .eq('storage_config_id', configId);
      
      if (mappingsError) {
        console.error('StorageConfigsIndex: Erro ao verificar mapeamentos:', mappingsError);
        throw mappingsError;
      }

      if (mappings && mappings.length > 0) {
        throw new Error(`Esta configuração está sendo usada por ${mappings.length} mapeamento(s) de módulo. Remova os mapeamentos antes de excluir.`);
      }

      // Excluir a configuração
      const { error: deleteError } = await supabase
        .from('storage_configs')
        .delete()
        .eq('id', configId);

      if (deleteError) {
        console.error('StorageConfigsIndex: Erro ao excluir configuração:', deleteError);
        throw deleteError;
      }

      // Atualizar a lista
      setStorageConfigs(prev => prev.filter(config => config.id !== configId));
      
      addToast({
        title: 'Sucesso',
        message: 'Configuração excluída com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('StorageConfigsIndex: Erro ao excluir configuração:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir a configuração',
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

  const syncStorage = async (configId: string) => {
    try {
      setSyncingStorage(configId);
      
      // Simulação de sincronização - em uma aplicação real, chamaríamos uma API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar estatísticas
      setStorageConfigs(prev => 
        prev.map(config => {
          if (config.id === configId) {
            // Atualizar estatísticas simuladas
            const filesCount = Math.floor(Math.random() * 10000);
            const totalSize = filesCount * Math.floor(Math.random() * 1024 * 1024);
            const spaceLimit = config.spaceLimit || 1024 * 1024 * 1024 * 10;
            
            return {
              ...config,
              spaceUsed: totalSize,
              lastSyncAt: new Date().toISOString(),
              stats: {
                ...config.stats,
                filesCount,
                totalSize,
                lastUpload: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString(),
                availableSpace: spaceLimit - totalSize,
                usedPercentage: (totalSize / spaceLimit) * 100
              }
            };
          }
          return config;
        })
      );
      
      addToast({
        title: 'Sincronização concluída',
        message: 'Estatísticas de armazenamento atualizadas com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('StorageConfigsIndex: Erro ao sincronizar:', err);
      
      addToast({
        title: 'Erro na sincronização',
        message: 'Não foi possível atualizar as estatísticas de armazenamento',
        type: 'error'
      });
    } finally {
      setSyncingStorage(null);
    }
  };

  // Filtrar configurações
  const filteredConfigs = storageConfigs.filter(config => {
    const matchesSearch = 
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (config.description && config.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      config.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = 
      filterProvider === 'all' || 
      config.provider === filterProvider;
    
    const matchesType = 
      filterType === 'all' || 
      config.configType === filterType;
    
    return matchesSearch && matchesProvider && matchesType;
  });

  // Encontrar o nome do provedor
  const getProviderName = (code: string): string => {
    const provider = providers.find(p => p.code === code);
    return provider ? provider.name : code;
  };

  // Formatar tamanho em bytes para exibição
  const formatSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Armazenamento</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie configurações de armazenamento do sistema
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/storage/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
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
                placeholder="Pesquisar configurações..."
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
                    onClick={fetchStorageConfigs}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando configurações...</span>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <HardDrive className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma configuração encontrada</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterProvider !== 'all' || filterType !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece criando sua primeira configuração de armazenamento.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/storage/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Configuração
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredConfigs.map(config => (
              <div 
                key={config.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border ${
                  !config.isActive
                    ? 'border-red-300 dark:border-red-700'
                    : config.isDefault
                    ? 'border-indigo-300 dark:border-indigo-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 p-2 rounded-md ${
                        !config.isActive
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : config.isDefault
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        {config.provider === 'google_drive' || config.provider === 'onedrive' || config.provider === 'dropbox' ? (
                          <Cloud size={24} />
                        ) : (
                          <HardDrive size={24} />
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {config.name}
                          </h3>
                          {config.isDefault && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          {getProviderName(config.provider)}
                          <span className="mx-1.5">•</span>
                          {config.configType === 'system' ? 'Sistema' : 'Tenant'}
                        </p>
                        {config.settings.basePath && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <HardDrive size={12} className="mr-1" />
                            Pasta: {config.settings.basePath}
                          </p>
                        )}
                        {config.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {config.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {config.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <CheckCircle size={12} className="mr-1" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          <AlertCircle size={12} className="mr-1" />
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Estatísticas de uso */}
                  <div className="mt-4">
                    <div className="flex justify-between mb-1 text-xs text-gray-600 dark:text-gray-300">
                      <span>Uso de Espaço</span>
                      <span>
                        {formatSize(config.spaceUsed)} / {formatSize(config.spaceLimit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          (config.stats?.usedPercentage || 0) > 90
                            ? 'bg-red-600'
                            : (config.stats?.usedPercentage || 0) > 75
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(config.stats?.usedPercentage || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Estatísticas adicionais */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Arquivos:</span> {config.stats?.filesCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Último upload:</span> {config.stats?.lastUpload ? new Date(config.stats.lastUpload).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Última sincronização:</span> {config.lastSyncAt ? new Date(config.lastSyncAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">Status:</span>
                      {config.isActive ? (
                        <CheckCircle size={12} className="text-green-500 dark:text-green-400 mr-1" />
                      ) : (
                        <AlertCircle size={12} className="text-red-500 dark:text-red-400 mr-1" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => syncStorage(config.id)}
                        disabled={syncingStorage === config.id}
                        className={`p-2 rounded-md ${
                          syncingStorage === config.id
                            ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/40'
                        }`}
                        title="Sincronizar Estatísticas"
                      >
                        {syncingStorage === config.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent" />
                        ) : (
                          <RefreshCcw size={16} />
                        )}
                      </button>
                      <Link
                        to={`/admin/storage/${config.id}`}
                        className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md"
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        to={`/admin/storage/${config.id}/edit`}
                        className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-md"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </Link>
                    </div>
                    
                    <div>
                      {deleteConfirmation === config.id ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={cancelDelete}
                            className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 rounded-md"
                            title="Cancelar"
                          >
                            <X size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(config.id)}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                            title="Confirmar exclusão"
                          >
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                          title="Excluir"
                        >
                          