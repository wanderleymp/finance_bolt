import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, CreditCard, Users, Database, 
  AlertTriangle, CheckSquare, Calendar, Package, Plus, Check
} from 'lucide-react';
import { supabase, checkUserPermissions } from '../../../lib/supabase';
import { SaaSModule } from '../../../types';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';

const PlanForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<SaaSModule[]>([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [loadedModules, setLoadedModules] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    userLimit: 1,
    storageLimit: 1024,
    isRecommended: false,
    isActive: true
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    price?: string;
    userLimit?: string;
    storageLimit?: string;
  }>({});

  // Verificar permissões de administrador e carregar dados
  useEffect(() => {
    const checkPermissions = async () => {
      // Verificar se o usuário está autenticado
      if (!isAuthenticated || !user) {
        console.log("PlanForm: Usuário não autenticado");
        addToast({
          title: 'Acesso negado',
          message: 'Você precisa estar logado para acessar esta página',
          type: 'error'
        });
        navigate('/login', { state: { redirectTo: window.location.pathname } });
        return;
      }
      
      // Verificar se o usuário é admin
      const isUserAdmin = checkUserPermissions() || 
                         user.role === 'admin' || 
                         user.role === 'superadmin' || 
                         user.email === 'super@financeia.com.br';
      
      console.log("PlanForm: Verificação de admin:", isUserAdmin);
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        addToast({
          title: 'Acesso restrito',
          message: 'Apenas administradores podem gerenciar planos',
          type: 'warning'
        });
        navigate('/');
        return;
      }
      
      // Carregar módulos e dados do plano se necessário
      await loadModules();
      
      if (mode === 'edit' && id) {
        await fetchPlanData(id);
      }
    };
    
    checkPermissions();
  }, [navigate, mode, id, addToast, user, isAuthenticated]);

  const loadModules = async () => {
    try {
      setLoadingModules(true);
      console.log('PlanForm: Carregando módulos...');
      
      // Verificar se o usuário tem permissões
      if (!isAuthenticated || !user) {
        throw new Error("Usuário não autenticado");
      }
      
      const { data, error } = await supabase
        .from('saas_modules')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('PlanForm: Erro ao buscar módulos:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`PlanForm: ${data.length} módulos encontrados:`, data);
        
        const formattedModules: SaaSModule[] = data.map(module => ({
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
        
        setAvailableModules(formattedModules);
        setLoadedModules(true);
      } else {
        console.log('PlanForm: Nenhum módulo encontrado');
        addToast({
          title: 'Atenção',
          message: 'Nenhum módulo disponível. Por favor, cadastre módulos primeiro.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('PlanForm: Erro ao carregar módulos:', err);
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os módulos. Verifique suas permissões.',
        type: 'error'
      });
    } finally {
      setLoadingModules(false);
    }
  };

  const fetchPlanData = async (planId: string) => {
    try {
      setLoading(true);
      console.log('PlanForm: Buscando dados do plano:', planId);
      
      // Buscar dados do plano
      const { data: planData, error: planError } = await supabase
        .from('saas_plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (planError) {
        console.error('PlanForm: Erro ao buscar plano:', planError);
        throw planError;
      }
      
      if (planData) {
        console.log('PlanForm: Plano encontrado:', planData);
        setFormData({
          name: planData.name,
          description: planData.description || '',
          price: planData.price,
          billingCycle: planData.billing_cycle as 'monthly' | 'quarterly' | 'yearly',
          userLimit: planData.user_limit,
          storageLimit: planData.storage_limit,
          isRecommended: planData.is_recommended,
          isActive: planData.is_active
        });
      }
      
      // Buscar módulos associados a este plano
      const { data: planModulesData, error: modulesError } = await supabase
        .from('plan_modules')
        .select('module_id')
        .eq('plan_id', planId);
      
      if (modulesError) {
        console.error('PlanForm: Erro ao buscar módulos do plano:', modulesError);
        throw modulesError;
      }
      
      if (planModulesData) {
        console.log('PlanForm: Módulos do plano:', planModulesData);
        setSelectedModuleIds(planModulesData.map(pm => pm.module_id));
      }
    } catch (err) {
      console.error('PlanForm: Erro ao buscar dados do plano:', err);
      setError('Não foi possível carregar os dados do plano. Por favor, tente novamente.');
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do plano',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      name?: string;
      price?: string;
      userLimit?: string;
      storageLimit?: string;
    } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (formData.price < 0) {
      errors.price = 'Preço não pode ser negativo';
    }
    
    if (formData.userLimit < 1) {
      errors.userLimit = 'Limite de usuários deve ser pelo menos 1';
    }
    
    if (formData.storageLimit < 1) {
      errors.storageLimit = 'Limite de armazenamento deve ser pelo menos 1 MB';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      addToast({
        title: 'Acesso negado',
        message: 'Apenas administradores podem criar ou editar planos',
        type: 'error'
      });
      return;
    }
    
    if (!validateForm()) {
      addToast({
        title: 'Erro',
        message: 'Por favor, corrija os erros no formulário',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('PlanForm: Iniciando salvamento do plano...');
      
      if (mode === 'create') {
        // Criar novo plano
        console.log('PlanForm: Criando novo plano:', formData);
        const { data: planData, error: planError } = await supabase
          .from('saas_plans')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            billing_cycle: formData.billingCycle,
            user_limit: formData.userLimit,
            storage_limit: formData.storageLimit,
            is_recommended: formData.isRecommended,
            is_active: formData.isActive
          }])
          .select()
          .single();
        
        if (planError) {
          console.error('PlanForm: Erro ao criar plano:', planError);
          throw planError;
        }
        
        console.log('PlanForm: Plano criado:', planData);
        
        // Associar módulos ao plano
        if (selectedModuleIds.length > 0 && planData) {
          console.log('PlanForm: Associando módulos ao plano:', selectedModuleIds);
          const planModules = selectedModuleIds.map(moduleId => ({
            plan_id: planData.id,
            module_id: moduleId
          }));
          
          const { error: modulesError } = await supabase
            .from('plan_modules')
            .insert(planModules);
          
          if (modulesError) {
            console.error('PlanForm: Erro ao associar módulos:', modulesError);
            throw modulesError;
          }
        }
        
        setSuccess('Plano criado com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Plano criado com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/plans'), 1500);
        
      } else if (mode === 'edit' && id) {
        // Atualizar plano existente
        console.log('PlanForm: Atualizando plano existente:', formData);
        const { error: planError } = await supabase
          .from('saas_plans')
          .update({
            name: formData.name,
            description: formData.description || null,
            price: formData.price,
            billing_cycle: formData.billingCycle,
            user_limit: formData.userLimit,
            storage_limit: formData.storageLimit,
            is_recommended: formData.isRecommended,
            is_active: formData.isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (planError) {
          console.error('PlanForm: Erro ao atualizar plano:', planError);
          throw planError;
        }
        
        // Atualizar módulos associados
        // Primeiro remover todos os módulos existentes
        console.log('PlanForm: Removendo módulos antigos');
        const { error: deleteError } = await supabase
          .from('plan_modules')
          .delete()
          .eq('plan_id', id);
        
        if (deleteError) {
          console.error('PlanForm: Erro ao remover módulos antigos:', deleteError);
          throw deleteError;
        }
        
        // Depois adicionar os selecionados
        if (selectedModuleIds.length > 0) {
          console.log('PlanForm: Adicionando novos módulos:', selectedModuleIds);
          const planModules = selectedModuleIds.map(moduleId => ({
            plan_id: id,
            module_id: moduleId
          }));
          
          const { error: insertError } = await supabase
            .from('plan_modules')
            .insert(planModules);
          
          if (insertError) {
            console.error('PlanForm: Erro ao inserir novos módulos:', insertError);
            throw insertError;
          }
        }
        
        setSuccess('Plano atualizado com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Plano atualizado com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/plans'), 1500);
      }
    } catch (err: any) {
      console.error('PlanForm: Erro ao salvar plano:', err);
      setError(err.message || 'Ocorreu um erro ao salvar o plano. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: err.message || 'Ocorreu um erro ao salvar o plano',
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
        : name === 'price'
          ? parseFloat(value) || 0
          : name === 'userLimit' || name === 'storageLimit'
            ? parseInt(value) || 0
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

  const toggleModuleSelection = (moduleId: string) => {
    console.log('PlanForm: Alternando seleção do módulo:', moduleId);
    setSelectedModuleIds(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAllModules = () => {
    setSelectedModuleIds(availableModules.map(m => m.id));
  };

  const selectCoreModules = () => {
    setSelectedModuleIds(availableModules.filter(m => m.isCore).map(m => m.id));
  };

  const clearModuleSelection = () => {
    setSelectedModuleIds([]);
  };

  // Calcular preço mensal/anual baseado no ciclo de cobrança
  const calculateDisplayPrice = () => {
    if (formData.billingCycle === 'monthly') {
      return formData.price;
    } else if (formData.billingCycle === 'quarterly') {
      return formData.price / 3;
    } else {
      return formData.price / 12;
    }
  };

  // Formatar tamanho de armazenamento para exibição
  const formatStorageSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${mb / 1024} GB`;
    }
    return `${mb} MB`;
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Acesso Restrito
            </h1>
          </div>

          <div className="p-6">
            <div className="flex items-center p-4 mb-4 text-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300 rounded-lg border-l-4 border-yellow-500">
              <AlertTriangle className="flex-shrink-0 h-5 w-5 mr-3" />
              <div>
                <h3 className="font-medium">Permissão negada</h3>
                <p>Você não tem permissão para gerenciar planos. Esta funcionalidade está disponível apenas para administradores.</p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Voltar para o Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/plans')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Novo Plano' : 'Editar Plano'}
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
          {/* Primeira seção: Informações básicas do plano */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informações do Plano</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className={`w-full px-4 py-2 border ${formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preço (R$) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.price ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                </div>
                {formErrors.price ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.price}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formData.billingCycle !== 'monthly' && (
                      <>Equivalente a R$ {calculateDisplayPrice().toFixed(2)} por mês</>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="billingCycle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ciclo de Cobrança
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="billingCycle"
                    name="billingCycle"
                    value={formData.billingCycle}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
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
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Descrição breve do plano..."
                />
              </div>
            </div>
          </div>

          {/* Segunda seção: Limites */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Limites</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="userLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Usuários
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="userLimit"
                    name="userLimit"
                    value={formData.userLimit}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.userLimit ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                </div>
                {formErrors.userLimit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.userLimit}</p>
                )}
              </div>

              <div>
                <label htmlFor="storageLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Armazenamento (MB)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Database className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="storageLimit"
                    name="storageLimit"
                    value={formData.storageLimit}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.storageLimit ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                </div>
                {formErrors.storageLimit ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.storageLimit}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatStorageSize(formData.storageLimit)}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecommended"
                  name="isRecommended"
                  checked={formData.isRecommended}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecommended" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Plano recomendado (destacado)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Plano ativo (visível para novos clientes)
                </label>
              </div>
            </div>
          </div>

          {/* Terceira seção: Módulos */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Módulos Incluídos
              {loadedModules ? 
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({availableModules.length} disponíveis)
                </span> : null
              }
            </h2>
            
            {loadingModules ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando módulos...</span>
              </div>
            ) : !loadedModules ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Problemas ao carregar módulos
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      Não foi possível carregar a lista de módulos disponíveis. Verifique suas permissões ou tente novamente.
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => loadModules()}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : availableModules.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500" />
                <p className="mt-2 text-gray-500 dark:text-gray-400">Nenhum módulo disponível</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Adicione módulos no menu de Módulos antes de criar planos.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button 
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={selectCoreModules}
                  >
                    Apenas Essenciais
                  </button>
                  <button 
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={selectAllModules}
                  >
                    Selecionar Todos
                  </button>
                  <button 
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={clearModuleSelection}
                  >
                    Limpar Seleção
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableModules.map(module => (
                    <div 
                      key={module.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedModuleIds.includes(module.id)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      onClick={() => toggleModuleSelection(module.id)}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                          selectedModuleIds.includes(module.id)
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}>
                          {selectedModuleIds.includes(module.id) ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {module.name}
                            </h3>
                            {module.isCore && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                Essencial
                              </span>
                            )}
                          </div>
                          {module.price > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              +R$ {module.price.toFixed(2)}/mês
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {selectedModuleIds.length === 0 ? (
                    <p className="italic">Nenhum módulo selecionado. Clique nos módulos acima para incluí-los no plano.</p>
                  ) : (
                    <p>{selectedModuleIds.length} módulo(s) selecionado(s). Módulos essenciais são incluídos em todos os planos gratuitamente.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/plans')}
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
              {loading ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanForm;