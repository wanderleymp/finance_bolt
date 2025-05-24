import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Server, AlertTriangle, CheckSquare, 
  Globe, Key, Database, Info
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { LLMProvider } from '../../../types/llm';

const ProviderForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    apiEndpoint: string;
    authMethod: 'api_key' | 'oauth2' | 'none';
    status: 'active' | 'inactive' | 'maintenance';
    rateLimitRequests?: number;
    rateLimitTokens?: number;
    rateLimitPeriod?: string;
    icon: string;
    documentationUrl: string;
    isActive: boolean;
  }>({
    code: '',
    name: '',
    description: '',
    apiEndpoint: '',
    authMethod: 'api_key',
    status: 'active',
    icon: 'brain-circuit',
    documentationUrl: '',
    isActive: true
  });
  
  const [formErrors, setFormErrors] = useState<{
    code?: string;
    name?: string;
    apiEndpoint?: string;
  }>({});

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchProviderData(id);
    }
  }, [mode, id]);

  const fetchProviderData = async (providerId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('id', providerId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          code: data.code,
          name: data.name,
          description: data.description || '',
          apiEndpoint: data.api_endpoint || '',
          authMethod: data.auth_method,
          status: data.status,
          rateLimitRequests: data.rate_limit_requests,
          rateLimitTokens: data.rate_limit_tokens,
          rateLimitPeriod: data.rate_limit_period,
          icon: data.icon || 'brain-circuit',
          documentationUrl: data.documentation_url || '',
          isActive: data.is_active
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do provedor:', err);
      setError('Não foi possível carregar os dados do provedor. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do provedor',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      code?: string;
      name?: string;
      apiEndpoint?: string;
    } = {};
    
    if (!formData.code.trim()) {
      errors.code = 'Código é obrigatório';
    } else if (!/^[a-z0-9_]+$/.test(formData.code)) {
      errors.code = 'Código deve conter apenas letras minúsculas, números e underscores';
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (formData.apiEndpoint && !formData.apiEndpoint.startsWith('http')) {
      errors.apiEndpoint = 'URL da API deve começar com http:// ou https://';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({
        title: 'Erro de validação',
        message: 'Verifique os campos do formulário',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const providerData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        api_endpoint: formData.apiEndpoint || null,
        auth_method: formData.authMethod,
        status: formData.status,
        rate_limit_requests: formData.rateLimitRequests || null,
        rate_limit_tokens: formData.rateLimitTokens || null,
        rate_limit_period: formData.rateLimitPeriod || null,
        icon: formData.icon || 'brain-circuit',
        documentation_url: formData.documentationUrl || null,
        is_active: formData.isActive
      };
      
      if (mode === 'create') {
        // Criar novo provedor
        const { data, error } = await supabase
          .from('llm_providers')
          .insert([providerData])
          .select();
        
        if (error) throw error;
        
        setSuccess('Provedor criado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Provedor criado com sucesso!',
          type: 'success'
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          navigate('/admin/llm/providers');
        }, 1500);
      } else if (id) {
        // Atualizar provedor existente
        const { error } = await supabase
          .from('llm_providers')
          .update(providerData)
          .eq('id', id);
        
        if (error) throw error;
        
        setSuccess('Provedor atualizado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Provedor atualizado com sucesso!',
          type: 'success'
        });
        
        // Redirecionar após um breve delay
        setTimeout(() => {
          navigate('/admin/llm/providers');
        }, 1500);
      }
    } catch (err) {
      console.error('Erro ao salvar provedor:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar o provedor');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao salvar provedor',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number'
        ? value === '' ? undefined : Number(value)
        : value
    }));
    
    // Limpar erro específico deste campo
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof typeof formErrors];
        return updated;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Gerar código baseado no nome
  const generateCode = () => {
    if (formData.name && !formData.code) {
      const code = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[^\w\s-]/g, '')        // Remove caracteres especiais
        .replace(/\s+/g, '_')            // Substitui espaços por underscores
        .replace(/-+/g, '_');           // Remove hífens duplicados
      
      setFormData(prev => ({ ...prev, code }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/llm/providers')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Server className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            {mode === 'create' ? 'Novo Provedor de LLM' : 'Editar Provedor de LLM'}
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

        <form onSubmit={handleSubmit} className="p-6">
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
                onBlur={generateCode}
                className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border ${formErrors.code ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                required
                disabled={mode === 'edit'} // Não permitir editar o código
              />
              {formErrors.code ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.code}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Identificador único para o provedor (apenas letras minúsculas, números e underscores)
                </p>
              )}
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

            <div>
              <label htmlFor="apiEndpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL da API
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="apiEndpoint"
                  name="apiEndpoint"
                  value={formData.apiEndpoint}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-4 py-2 border ${formErrors.apiEndpoint ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="https://api.exemplo.com/v1"
                />
              </div>
              {formErrors.apiEndpoint && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.apiEndpoint}</p>
              )}
            </div>

            <div>
              <label htmlFor="authMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método de Autenticação <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="authMethod"
                  name="authMethod"
                  value={formData.authMethod}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="api_key">API Key</option>
                  <option value="oauth2">OAuth 2.0</option>
                  <option value="none">Nenhuma (Local)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                required
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="maintenance">Em Manutenção</option>
              </select>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ícone
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="brain-circuit"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Nome do ícone do Lucide React (ex: brain-circuit, server, database)
              </p>
            </div>

            <div>
              <label htmlFor="documentationUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL da Documentação
              </label>
              <input
                type="text"
                id="documentationUrl"
                name="documentationUrl"
                value={formData.documentationUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="https://docs.exemplo.com"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Limites de Taxa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="rateLimitRequests" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Requisições
                </label>
                <input
                  type="number"
                  id="rateLimitRequests"
                  name="rateLimitRequests"
                  value={formData.rateLimitRequests || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="rateLimitTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Tokens
                </label>
                <input
                  type="number"
                  id="rateLimitTokens"
                  name="rateLimitTokens"
                  value={formData.rateLimitTokens || ''}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label htmlFor="rateLimitPeriod" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Período do Limite
                </label>
                <select
                  id="rateLimitPeriod"
                  name="rateLimitPeriod"
                  value={formData.rateLimitPeriod || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Selecione um período</option>
                  <option value="minute">Por Minuto</option>
                  <option value="hour">Por Hora</option>
                  <option value="day">Por Dia</option>
                  <option value="month">Por Mês</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Sobre limites de taxa
                  </h3>
                  <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                    Os limites de taxa são usados para controlar o uso da API do provedor. Deixe em branco se não houver limites conhecidos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Provedor ativo
            </label>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/llm/providers')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Provedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProviderForm;