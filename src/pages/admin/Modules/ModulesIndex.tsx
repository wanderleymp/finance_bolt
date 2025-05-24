import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Edit, Trash, Check, X, Zap, Search, Filter, 
  MoreHorizontal, Package, DollarSign, ToggleLeft, 
  LayoutGrid, List, ChevronRight, ChevronDown, ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { SaaSModule } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

// Import Lucide icons dynamically
import * as LucideIcons from 'lucide-react';

const ModulesIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<SaaSModule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Carregar módulos ao montar o componente
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      console.log("ModulesIndex: Carregando módulos do banco de dados...");

      const { data, error } = await supabase
        .from('saas_modules')
        .select('*')
        .order('name');

      if (error) {
        console.error("ModulesIndex: Erro ao buscar módulos:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("ModulesIndex: Nenhum módulo encontrado");
      } else {
        console.log(`ModulesIndex: ${data.length} módulos encontrados:`, data);
      }

      // Mapear os dados para o formato do tipo SaaSModule
      const formattedModules: SaaSModule[] = (data || []).map(module => ({
        id: module.id,
        name: module.name,
        code: module.code,
        description: module.description || '',
        icon: module.icon || 'package',
        isCore: module.is_core,
        price: module.price,
        isActive: module.is_active,
        createdAt: module.created_at,
        updatedAt: module.updated_at
      }));

      setModules(formattedModules);
    } catch (err) {
      console.error("ModulesIndex: Erro ao carregar módulos:", err);
      setError('Não foi possível carregar os módulos. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar módulos',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handleDeleteModule = async (moduleId: string) => {
    // Se não estiver no modo de confirmação para este módulo, solicitar confirmação
    if (deleteConfirmation !== moduleId) {
      setDeleteConfirmation(moduleId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      console.log("ModulesIndex: Excluindo módulo:", moduleId);

      // Verificar se o módulo está associado a algum plano
      const { data: planModules, error: checkError } = await supabase
        .from('plan_modules')
        .select('plan_id')
        .eq('module_id', moduleId);

      if (checkError) {
        console.error("ModulesIndex: Erro ao verificar relações do módulo:", checkError);
        throw checkError;
      }

      if (planModules && planModules.length > 0) {
        throw new Error(`Este módulo não pode ser excluído pois está associado a ${planModules.length} plano(s)`);
      }

      // Verificar se o módulo está associado a algum tenant
      const { data: tenantModules, error: tenantError } = await supabase
        .from('tenant_modules')
        .select('tenant_id')
        .eq('module_id', moduleId);

      if (tenantError) {
        console.error("ModulesIndex: Erro ao verificar tenants do módulo:", tenantError);
        throw tenantError;
      }

      if (tenantModules && tenantModules.length > 0) {
        throw new Error(`Este módulo não pode ser excluído pois está sendo usado por ${tenantModules.length} tenant(s)`);
      }

      // Excluir o módulo
      const { error: deleteError } = await supabase
        .from('saas_modules')
        .delete()
        .eq('id', moduleId);

      if (deleteError) {
        console.error("ModulesIndex: Erro ao excluir módulo:", deleteError);
        throw deleteError;
      }

      // Atualizar a lista de módulos
      setModules(prev => prev.filter(module => module.id !== moduleId));
      
      addToast({
        title: 'Sucesso',
        message: 'Módulo excluído com sucesso',
        type: 'success'
      });
    } catch (err: any) {
      console.error("ModulesIndex: Erro ao excluir módulo:", err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err.message || 'Não foi possível excluir o módulo',
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

  // Filtrar e ordenar módulos
  const filteredModules = modules.filter(module => {
    // Filtro por termo de pesquisa
    const matchesSearch = 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (module.description && module.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtro por tipo
    const matchesType = 
      filterType === 'all' ||
      (filterType === 'core' && module.isCore) ||
      (filterType === 'addon' && !module.isCore) ||
      (filterType === 'active' && module.isActive) ||
      (filterType === 'inactive' && !module.isActive);
    
    return matchesSearch && matchesType;
  });

  // Renderizar ícone dinamicamente
  const renderIcon = (iconName: string, size = 20) => {
    try {
      const IconComponent = (LucideIcons as any)[iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())];
      
      if (IconComponent) {
        return <IconComponent size={size} />;
      }
    } catch (err) {
      console.error(`Erro ao renderizar ícone ${iconName}:`, err);
    }
    
    // Ícone padrão se o especificado não existir
    return <Package size={size} />;
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Módulos do Sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie os módulos disponíveis na sua plataforma SaaS
            </p>
          </div>
          
          <Link
            to="/admin/modules/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Link>
        </div>

        {/* Filtros e pesquisa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar módulos..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos os Tipos</option>
                <option value="core">Módulos Essenciais</option>
                <option value="addon">Módulos Adicionais</option>
                <option value="active">Módulos Ativos</option>
                <option value="inactive">Módulos Inativos</option>
              </select>
            </div>
            
            <div className="w-full md:w-auto flex space-x-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded border ${
                  viewMode === 'card'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                title="Visualização em cards"
              >
                <LayoutGrid size={18} />
              </button>
              
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded border ${
                  viewMode === 'table'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-400'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
                title="Visualização em tabela"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Feedback de erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 mb-6 rounded-md border border-red-200 dark:border-red-800">
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
                    onClick={fetchModules}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando módulos...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredModules.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            {searchTerm || filterType !== 'all' ? (
              <>
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum módulo encontrado</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Tente ajustar seus filtros de pesquisa.</p>
                <button
                  onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum módulo encontrado</h3>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Crie seu primeiro módulo para o sistema.</p>
                <div className="mt-6">
                  <Link
                    to="/admin/modules/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Módulo
                  </Link>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modules display - Card View */}
        {!loading && filteredModules.length > 0 && viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map(module => (
              <div 
                key={module.id}
                className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border transition-transform duration-200 hover:scale-[1.025] hover:shadow-2xl group overflow-hidden ${
                  module.isCore 
                    ? 'border-green-300 dark:border-green-700' 
                    : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-14 w-14 rounded-full flex items-center justify-center shadow-sm text-3xl font-bold ${
                      module.isCore 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-300' 
                        : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-200'
                    }`}>
                      {renderIcon(module.icon || 'package', 28)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {module.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{module.code}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${module.isCore ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{module.isCore ? <Zap size={14} /> : <Package size={14} />}{module.isCore ? 'Essencial' : 'Adicional'}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${module.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{module.isActive ? <Check size={14} /> : <X size={14} />}{module.isActive ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModuleExpansion(module.id)}
                    className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 rounded-full p-2 transition"
                    title={expandedModules[module.id] ? 'Recolher detalhes' : 'Expandir detalhes'}
                    aria-label={expandedModules[module.id] ? 'Recolher detalhes' : 'Expandir detalhes'}
                  >
                    {expandedModules[module.id] ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
                
                {expandedModules[module.id] && (
                  <div className="px-6 py-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {module.description || 'Nenhuma descrição disponível'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço</h4>
                        <p className="text-sm text-gray-900 dark:text-white flex items-center">
                          <DollarSign size={16} className="mr-1 text-gray-400" />
                          {module.price.toFixed(2)}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</h4>
                        <p className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            module.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {module.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Criado em {new Date(module.createdAt).toLocaleDateString('pt-BR')}
                      {module.updatedAt !== module.createdAt && 
                        ` • Atualizado em ${new Date(module.updatedAt).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                )}
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    to={`/admin/modules/${module.id}/edit`}
                    className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-600 transition"
                    title="Editar"
                    aria-label="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  {deleteConfirmation === module.id ? (
                    <>
                      <button
                        onClick={cancelDelete}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-500 transition"
                        title="Cancelar"
                        aria-label="Cancelar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module.id)}
                        className="inline-flex items-center justify-center p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 border border-transparent hover:border-red-300 dark:hover:border-red-600 transition"
                        title="Confirmar exclusão"
                        aria-label="Confirmar exclusão"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className={`inline-flex items-center justify-center p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 border border-transparent hover:border-red-200 dark:hover:border-red-600 transition ${module.isCore ? 'opacity-40 cursor-not-allowed' : ''}`}
                      disabled={module.isCore}
                      title={module.isCore ? "Módulos essenciais não podem ser excluídos" : "Excluir módulo"}
                      aria-label={module.isCore ? "Módulos essenciais não podem ser excluídos" : "Excluir módulo"}
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modules display - Table View */}
        {!loading && filteredModules.length > 0 && viewMode === 'table' && (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Preço
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
                  {filteredModules.map((module) => (
                    <tr 
                      key={module.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        module.isCore ? 'bg-green-50 dark:bg-green-900/10' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                            module.isCore 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                              : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {renderIcon(module.icon || 'package', 16)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.name}
                            </div>
                            {module.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">
                                {module.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {module.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          module.isCore 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {module.isCore ? 'Essencial' : 'Adicional'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          R$ {module.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          module.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {module.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/modules/${module.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          {deleteConfirmation === module.id ? (
                            <>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteModule(module.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteModule(module.id)}
                              className={`${
                                module.isCore
                                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                  : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                              }`}
                              disabled={module.isCore}
                              title={module.isCore ? "Módulos essenciais não podem ser excluídos" : "Excluir módulo"}
                            >
                              <Trash className="h-4 w-4" />
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

export default ModulesIndex;