import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, Check, X, ChevronDown, ChevronUp,
  DollarSign, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SaaSModule } from '../../types';

interface ModuleSelectorProps {
  tenantId: string;
  onModulesChange?: (modules: SaaSModule[]) => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ tenantId, onModulesChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<SaaSModule[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchTenantModules(tenantId);
    }
  }, [tenantId]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('saas_modules')
        .select('*')
        .order('name');
      
      if (error) throw error;

      const formattedModules: SaaSModule[] = data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        description: item.description || '',
        icon: item.icon || 'package',
        isCore: item.is_core,
        price: item.price,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      setModules(formattedModules);
    } catch (err) {
      console.error('Erro ao buscar módulos:', err);
      setError('Não foi possível carregar os módulos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantModules = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_modules')
        .select('module_id')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      
      const activeModuleIds = data.map(item => item.module_id);
      setSelectedModules(activeModuleIds);
    } catch (err) {
      console.error('Erro ao buscar módulos do tenant:', err);
    }
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
    
    // Notificar o componente pai sobre a mudança, se houver callback
    if (onModulesChange) {
      const updatedSelectedModules = modules.filter(module => 
        selectedModules.includes(module.id) 
          ? module.id !== moduleId 
          : [...selectedModules, moduleId].includes(module.id)
      );
      onModulesChange(updatedSelectedModules);
    }
  };

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Filter modules
  const filteredModules = modules
    .filter(module => 
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      module.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (module.description && module.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(module => 
      typeFilter === 'all' || 
      (typeFilter === 'core' && module.isCore) || 
      (typeFilter === 'addon' && !module.isCore)
    );

  // Dynamically render Lucide icons
  const renderIcon = (iconName: string) => {
    // Default to Package icon
    let IconComponent = Package;
    
    try {
      // Format the icon name to PascalCase (for Lucide React components)
      const formattedIconName = iconName.charAt(0).toUpperCase() + 
        iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
      
      // Try to find the icon in the imported icons
      const icons = {
        Package, Search, Filter, Check, X, ChevronDown, ChevronUp, DollarSign, Info
        // Add more icons here if needed
      };
      
      if (icons[formattedIconName as keyof typeof icons]) {
        IconComponent = icons[formattedIconName as keyof typeof icons];
      }
    } catch (err) {
      console.error('Error rendering icon:', err);
      // Fallback to Package icon if there's an error
    }
    
    return <IconComponent size={18} />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <Package className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
          Selecionar Módulos
        </h2>
      </div>

      {/* Filters and Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Buscar módulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Todos os Tipos</option>
              <option value="core">Módulos Essenciais</option>
              <option value="addon">Módulos Adicionais</option>
            </select>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando módulos...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <div>
            {/* Total Selected Stats */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedModules.length} de {modules.length} módulos selecionados
              </div>
              
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedModules(modules.filter(m => m.isCore).map(m => m.id))}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-4"
                >
                  Apenas Essenciais
                </button>
                
                <button
                  onClick={() => setSelectedModules(modules.map(m => m.id))}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mr-4"
                >
                  Selecionar Todos
                </button>
                
                <button
                  onClick={() => setSelectedModules([])}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  Limpar
                </button>
              </div>
            </div>
            
            {/* Modules Grid */}
            <div className="space-y-3">
              {filteredModules.length > 0 ? (
                filteredModules.map(module => (
                  <div 
                    key={module.id}
                    className={`border rounded-lg overflow-hidden ${
                      selectedModules.includes(module.id)
                        ? 'border-indigo-500 dark:border-indigo-400'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`px-4 py-3 flex justify-between items-center ${
                      selectedModules.includes(module.id)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'bg-white dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(module.id)}
                            onChange={() => toggleModuleSelection(module.id)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-2">
                            {module.icon && renderIcon(module.icon)}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.name}
                              {module.isCore && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                  Essencial
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{module.code}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {module.price > 0 && (
                          <span className="mr-3 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                            <DollarSign size={16} className="mr-1 text-green-600 dark:text-green-400" />
                            {module.price.toFixed(2)}
                          </span>
                        )}
                        
                        <button
                          onClick={() => toggleExpanded(module.id)}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          {expandedModules[module.id] ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {expandedModules[module.id] && (
                      <div className={`px-4 py-3 text-sm ${
                        selectedModules.includes(module.id)
                          ? 'bg-indigo-50 dark:bg-indigo-900/10'
                          : 'bg-gray-50 dark:bg-gray-700/50'
                      } border-t border-gray-200 dark:border-gray-700`}>
                        {module.description ? (
                          <p className="text-gray-700 dark:text-gray-300">{module.description}</p>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">Sem descrição disponível</p>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <div className="text-gray-500 dark:text-gray-400">
                            Criado em: {new Date(module.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                              module.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            }`}>
                              {module.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">Nenhum módulo encontrado com os filtros atuais.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleSelector;