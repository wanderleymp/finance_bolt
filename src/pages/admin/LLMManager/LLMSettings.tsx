import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Settings, BrainCircuit, Server, Database,
  AlertTriangle, Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { Tenant } from '../../../types';

const LLMSettings: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      if (data) {
        const formattedTenants: Tenant[] = data.map(tenant => ({
          id: tenant.id,
          name: tenant.nome,
          plan: tenant.plano as any,
          status: tenant.status,
          isActive: tenant.ativo,
          createdAt: tenant.createdAt,
          lastAccess: tenant.last_access,
        }));
        
        setTenants(formattedTenants);
      }
    } catch (err) {
      console.error('Erro ao carregar tenants:', err);
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar lista de tenants',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tenants com base na pesquisa
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/llm')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Configurações de LLM
          </h1>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Configurações por Tenant
                </h3>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  As configurações de LLM são gerenciadas por tenant. Selecione um tenant abaixo para configurar seus modelos, credenciais e limites de uso.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar Tenant
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Digite o nome do tenant..."
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando tenants...</span>
            </div>
          ) : filteredTenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                  onClick={() => navigate(`/admin/llm/tenants/${tenant.id}/settings`)}
                >
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Database size={20} />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenant.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tenant.plan}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/llm/tenants/${tenant.id}/settings`);
                      }}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Configurar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BrainCircuit className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum tenant encontrado com esse termo.' : 'Nenhum tenant disponível.'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Server className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Configurações Globais
          </h2>
        </div>
        
        <div className="p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Funcionalidade em Desenvolvimento
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  As configurações globais de LLM estão em desenvolvimento. Por enquanto, configure as definições por tenant.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Modelos Padrão</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure os modelos padrão que serão usados quando um tenant não tiver configurações específicas.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Limites Globais</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Defina limites globais de uso para todos os tenants que não possuem limites específicos.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Credenciais do Sistema</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gerencie as credenciais do sistema que podem ser compartilhadas entre tenants.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monitoramento</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Configure alertas e monitoramento para uso de LLM em toda a plataforma.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMSettings;