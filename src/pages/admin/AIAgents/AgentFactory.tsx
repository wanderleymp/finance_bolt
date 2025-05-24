import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Server, Settings, AlertTriangle, CheckSquare, MessageCircle, PenTool as Tool, Database, Sliders, Save, X, ChevronLeft, FileText, Search, Plus, Check, Info } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { AIAgentTemplate, AIAgentTool, AIKnowledgeBase } from '../../../types/agent';
import { LLMModel } from '../../../types/llm';

const AgentFactory: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<AIAgentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AIAgentTemplate | null>(null);
  const [models, setModels] = useState<LLMModel[]>([]);
  const [tools, setTools] = useState<AIAgentTool[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<AIKnowledgeBase[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    modelId: '',
    fallbackModelId: '',
    systemPrompt: '',
    parameters: {
      temperature: 0.7,
      topP: 1.0
    },
    selectedTools: [] as string[],
    selectedKnowledgeBases: [] as string[],
    personality: {
      tone: 'professional',
      style: 'helpful',
      expertise: 'general'
    },
    isActive: true
  });

  useEffect(() => {
    fetchTemplates();
    fetchModels();
    fetchTools();
    fetchKnowledgeBases();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agent_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedTemplates: AIAgentTemplate[] = data.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          isSystem: t.is_system,
          modelId: t.model_id,
          parameters: t.parameters,
          systemPrompt: t.system_prompt,
          tools: t.tools,
          personality: t.personality,
          icon: t.icon,
          category: t.category,
          isActive: t.is_active,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }));
        
        setTemplates(formattedTemplates);
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar templates de agentes',
        type: 'error'
      });
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('llm_models')
        .select('*, provider:provider_id(*)')
        .eq('is_active', true)
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
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar modelos de LLM',
        type: 'error'
      });
    }
  };

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agent_tools')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedTools: AIAgentTool[] = data.map(t => ({
          id: t.id,
          code: t.code,
          name: t.name,
          description: t.description,
          functionSchema: t.function_schema,
          isSystem: t.is_system,
          tenantId: t.tenant_id,
          requiresAuth: t.requires_auth,
          category: t.category,
          icon: t.icon,
          isActive: t.is_active,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        }));
        
        setTools(formattedTools);
      }
    } catch (err) {
      console.error('Erro ao carregar ferramentas:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar ferramentas de agentes',
        type: 'error'
      });
    }
  };

  const fetchKnowledgeBases = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_knowledge_bases')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const formattedKnowledgeBases: AIKnowledgeBase[] = data.map(kb => ({
          id: kb.id,
          name: kb.name,
          description: kb.description,
          tenantId: kb.tenant_id,
          isSystem: kb.is_system,
          embeddingModelId: kb.embedding_model_id,
          chunkSize: kb.chunk_size,
          chunkOverlap: kb.chunk_overlap,
          metadata: kb.metadata,
          isActive: kb.is_active,
          createdBy: kb.created_by,
          createdAt: kb.created_at,
          updatedAt: kb.updated_at
        }));
        
        setKnowledgeBases(formattedKnowledgeBases);
      }
    } catch (err) {
      console.error('Erro ao carregar bases de conhecimento:', err);
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar bases de conhecimento',
        type: 'error'
      });
    }
  };

  const selectTemplate = (template: AIAgentTemplate) => {
    setSelectedTemplate(template);
    
    // Preencher formulário com dados do template
    setFormData({
      ...formData,
      name: `Novo ${template.name}`,
      description: template.description || '',
      type: template.type,
      modelId: template.modelId || '',
      systemPrompt: template.systemPrompt || '',
      parameters: template.parameters || {
        temperature: 0.7,
        topP: 1.0
      },
      selectedTools: template.tools?.map(t => typeof t === 'string' ? t : t.code) || [],
      personality: template.personality || {
        tone: 'professional',
        style: 'helpful',
        expertise: 'general'
      }
    });
    
    // Avançar para o próximo passo
    setStep(2);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
  };

  const handleParameterChange = (parameter: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [parameter]: value
      }
    }));
  };

  const handlePersonalityChange = (aspect: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [aspect]: value
      }
    }));
  };

  const toggleTool = (toolCode: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTools: prev.selectedTools.includes(toolCode)
        ? prev.selectedTools.filter(t => t !== toolCode)
        : [...prev.selectedTools, toolCode]
    }));
  };

  const toggleKnowledgeBase = (kbId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedKnowledgeBases: prev.selectedKnowledgeBases.includes(kbId)
        ? prev.selectedKnowledgeBases.filter(id => id !== kbId)
        : [...prev.selectedKnowledgeBases, kbId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }
    
    if (!formData.modelId) {
      setError('Selecione um modelo');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Preparar ferramentas selecionadas
      const selectedToolsData = tools
        .filter(tool => formData.selectedTools.includes(tool.code))
        .map(tool => ({
          code: tool.code,
          name: tool.name,
          function: tool.functionSchema
        }));
      
      // Criar agente
      const { data, error } = await supabase
        .from('ai_agents')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          is_system: false, // Agentes criados pelo usuário nunca são do sistema
          model_id: formData.modelId,
          fallback_model_id: formData.fallbackModelId || null,
          parameters: formData.parameters,
          system_prompt: formData.systemPrompt,
          tools: selectedToolsData.length > 0 ? selectedToolsData : null,
          knowledge_base_ids: formData.selectedKnowledgeBases.length > 0 ? formData.selectedKnowledgeBases : null,
          personality: formData.personality,
          is_active: formData.isActive
        }])
        .select();
      
      if (error) throw error;
      
      setSuccess('Agente criado com sucesso!');
      
      addToast({
        title: 'Sucesso',
        message: 'Agente criado com sucesso!',
        type: 'success'
      });
      
      // Redirecionar para a página do agente após um breve delay
      setTimeout(() => {
        navigate('/admin/ai-agents');
      }, 1500);
    } catch (err) {
      console.error('Erro ao criar agente:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao criar o agente');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao criar agente',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Escolha um Template
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  onClick={() => selectTemplate(template)}
                >
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <BrainCircuit size={20} />
                    </div>
                    <h3 className="ml-3 text-base font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                  </div>
                  
                  {template.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {template.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                        {template.category}
                      </span>
                    )}
                    
                    {template.personality?.tone && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {template.personality.tone}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/admin/ai-agents')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Criar do Zero
              </button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecione um tipo</option>
                  <option value="general">Assistente Geral</option>
                  <option value="legal_assistant">Assistente Jurídico</option>
                  <option value="financial_assistant">Assistente Financeiro</option>
                  <option value="customer_service">Atendimento ao Cliente</option>
                  <option value="document_assistant">Assistente de Documentos</option>
                  <option value="research_assistant">Assistente de Pesquisa</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Próximo
              </button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <BrainCircuit className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Configuração de Modelo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="modelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo Principal <span className="text-red-500">*</span>
                </label>
                <select
                  id="modelId"
                  name="modelId"
                  value={formData.modelId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">Selecione um modelo</option>
                  {models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fallbackModelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo de Fallback
                </label>
                <select
                  id="fallbackModelId"
                  name="fallbackModelId"
                  value={formData.fallbackModelId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Nenhum</option>
                  {models
                    .filter(m => m.id !== formData.modelId)
                    .map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider?.name})
                      </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Modelo alternativo para usar quando limites são atingidos
                </p>
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperatura: {formData.parameters.temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.parameters.temperature}
                  onChange={(e) => handleParameterChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Preciso (0)</span>
                  <span>Criativo (1)</span>
                </div>
              </div>

              <div>
                <label htmlFor="topP" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Top P: {formData.parameters.topP}
                </label>
                <input
                  type="range"
                  id="topP"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.parameters.topP}
                  onChange={(e) => handleParameterChange('topP', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Determinístico (0)</span>
                  <span>Diverso (1)</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  System Prompt
                </label>
                <textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Instruções para o comportamento do agente..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Instruções que definem o comportamento e capacidades do agente
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Próximo
              </button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Tool className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Ferramentas e Conhecimento
            </h2>
            
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                Ferramentas Disponíveis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map(tool => (
                  <div
                    key={tool.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.selectedTools.includes(tool.code)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => toggleTool(tool.code)}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                        formData.selectedTools.includes(tool.code)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}>
                        {formData.selectedTools.includes(tool.code) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {tool.name}
                        </h3>
                        {tool.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {tool.description}
                          </p>
                        )}
                        {tool.requiresAuth && (
                          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Requer autenticação
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                Bases de Conhecimento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {knowledgeBases.map(kb => (
                  <div
                    key={kb.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.selectedKnowledgeBases.includes(kb.id)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => toggleKnowledgeBase(kb.id)}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                        formData.selectedKnowledgeBases.includes(kb.id)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}>
                        {formData.selectedKnowledgeBases.includes(kb.id) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {kb.name}
                        </h3>
                        {kb.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {kb.description}
                          </p>
                        )}
                        <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          {kb.isSystem ? 'Sistema' : 'Tenant'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              
              <button
                type="button"
                onClick={() => setStep(5)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Próximo
              </button>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Personalidade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tom de Comunicação
                </label>
                <select
                  id="tone"
                  value={formData.personality.tone}
                  onChange={(e) => handlePersonalityChange('tone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="professional">Profissional</option>
                  <option value="friendly">Amigável</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Técnico</option>
                  <option value="empathetic">Empático</option>
                </select>
              </div>

              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estilo de Resposta
                </label>
                <select
                  id="style"
                  value={formData.personality.style}
                  onChange={(e) => handlePersonalityChange('style', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="helpful">Prestativo</option>
                  <option value="concise">Conciso</option>
                  <option value="detailed">Detalhado</option>
                  <option value="analytical">Analítico</option>
                  <option value="creative">Criativo</option>
                  <option value="instructive">Instrutivo</option>
                </select>
              </div>

              <div>
                <label htmlFor="expertise" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Especialização
                </label>
                <select
                  id="expertise"
                  value={formData.personality.expertise}
                  onChange={(e) => handlePersonalityChange('expertise', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="general">Geral</option>
                  <option value="legal">Jurídico</option>
                  <option value="finance">Financeiro</option>
                  <option value="customer_service">Atendimento ao Cliente</option>
                  <option value="technical">Técnico</option>
                  <option value="research">Pesquisa</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sobre a personalidade do agente
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    A personalidade define como o agente se comunica e interage com os usuários. Um bom equilíbrio entre tom, estilo e especialização ajuda a criar uma experiência mais natural e eficaz.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Agente ativo
              </label>
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Agente'}
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/ai-agents')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <BrainCircuit className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            Criar Novo Agente
          </h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 ${
                step > 1 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 ${
                step > 2 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                3
              </div>
              <div className={`h-1 w-12 ${
                step > 3 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                4
              </div>
              <div className={`h-1 w-12 ${
                step > 4 ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            </div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 5 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                5
              </div>
            </div>
          </div>
          
          <div className="mb-4 text-center">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {step === 1 && 'Escolha um Template'}
              {step === 2 && 'Informações Básicas'}
              {step === 3 && 'Configuração de Modelo'}
              {step === 4 && 'Ferramentas e Conhecimento'}
              {step === 5 && 'Personalidade'}
            </h2>
          </div>
          
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default AgentFactory;