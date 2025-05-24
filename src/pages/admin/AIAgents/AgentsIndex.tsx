import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, Eye, 
  BrainCircuit, MessageCircle, Tool, Database, 
  CheckCircle, AlertTriangle, Check, X, Settings
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { AIAgent } from '../../../types';
import { LLMModel } from '../../../types/llm';

const AgentsIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [models, setModels] = useState<Record<string, LLMModel>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchModels();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedAgents: AIAgent[] = data.map(agent => ({
          id: agent.id,
          tenantId: agent.tenant_id,
          name: agent.name,
          description: agent.description,
          type: agent.type,
          isSystem: agent.is_system,
          modelId: agent.model_id,
          fallbackModelId: agent.fallback_model_id,
          parameters: agent.parameters,
          systemPrompt: agent.system_prompt,
          tools: agent.tools,
          knowledgeBaseIds: agent.knowledge_base_ids,
          personality: agent.personality,
          isActive: agent.is_active,
          createdBy: agent.created_by,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at
        }));
        
        setAgents(formattedAgents);
      }
    } catch (err) {
      console.error('Erro ao carregar agentes:', err);
      setError('Não foi possível carregar os agentes. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar agentes',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_models')
        .select('*, provider:provider_id(*)');
      
      if (error) throw error;
      
      if (data) {
        const modelsMap: Record<string, LLMModel> = {};
        
        data.forEach(m => {
          modelsMap[m.id] = {
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
          };
        });
        
        setModels(modelsMap);
      }
    } catch (err) {
      console.error('Erro ao carregar modelos:', err);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    // Se não estiver no modo de confirmação para este agente, solicitar confirmação
    if (deleteConfirmation !== agentId) {
      setDeleteConfirmation(agentId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      
      // Excluir o agente
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      // Atualizar a lista de agentes
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      
      addToast({
        title: 'Sucesso',
        message: 'Agente excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao excluir agente:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o agente',
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

  // Filtrar agentes
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'system' && agent.isSystem) || 
      (filterType === 'tenant' && !agent.isSystem) ||
      agent.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Traduzir tipo de agente
  const translateAgentType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'general': 'Geral',
      'legal_assistant': 'Assistente Jurídico',
      'financial_assistant': 'Assistente Financeiro',
      'customer_service': 'Atendimento ao Cliente',
      'document_assistant': 'Assistente de Documentos',
      'research_assistant': 'Assistente de Pesquisa'
    };
    
    return typeMap[type] || type;
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <BrainCircuit className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
              Agentes IA
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie agentes de IA personalizados
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/ai-agents/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agente
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
                placeholder="Pesquisar agentes..."
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos os Tipos</option>
                <option value="system">Agentes do Sistema</option>
                <option value="tenant">Agentes do Tenant</option>
                <option value="legal_assistant">Assistentes Jurídicos</option>
                <option value="financial_assistant">Assistentes Financeiros</option>
                <option value="customer_service">Atendimento ao Cliente</option>
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
                    onClick={fetchAgents}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando agentes...</span>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <BrainCircuit className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum agente encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece criando seu primeiro agente de IA.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/ai-agents/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map(agent => (
              <div 
                key={agent.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border ${
                  agent.isSystem
                    ? 'border-purple-300 dark:border-purple-700'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <BrainCircuit size={20} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {translateAgentType(agent.type)}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {agent.isActive ? (
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
                    </div>
                  </div>
                  
                  {agent.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </p>
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <BrainCircuit size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                      <span>
                        {agent.modelId && models[agent.modelId]
                          ? models[agent.modelId].name
                          : 'Modelo padrão'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Tool size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                      <span>
                        {agent.tools ? `${agent.tools.length} ferramentas` : 'Sem ferramentas'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Database size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                      <span>
                        {agent.knowledgeBaseIds ? `${agent.knowledgeBaseIds.length} bases` : 'Sem bases'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <MessageCircle size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                      <span>
                        {agent.personality?.tone || 'Tom padrão'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/ai-agents/${agent.id}`}
                      className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-md"
                      title="Visualizar"
                    >
                      <Eye size={16} />
                    </Link>
                    
                    <Link
                      to={`/admin/ai-agents/${agent.id}/edit`}
                      className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-md"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </Link>
                    
                    <Link
                      to={`/admin/ai-agents/${agent.id}/settings`}
                      className="p-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-md"
                      title="Configurações"
                    >
                      <Settings size={16} />
                    </Link>
                  </div>
                  
                  <div>
                    {deleteConfirmation === agent.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={cancelDelete}
                          className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 rounded-md"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                          title="Confirmar exclusão"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md"
                        title="Excluir"
                        disabled={agent.isSystem} // Não permitir excluir agentes do sistema
                      >
                        <Trash size={16} className={agent.isSystem ? 'opacity-50' : ''} />
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

export default AgentsIndex;