import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Building, CreditCard, Users, Database, 
  AlertTriangle, CheckSquare, Globe
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SaaSPlan } from '../../../types';
import { useUI } from '../../../contexts/UIContext';
import { HardDrive } from 'lucide-react';

const TenantForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  
  const [formData, setFormData] = useState({
    nome: '',
    plano: '',
    status: 'ativo',
    slug: '',
    limiteusuarios: 5,
    limitearmazenamento: 5120,
    tema: 'default',
    ativo: true,
    idiomas: ['pt-BR']
  });
  
  const [formErrors, setFormErrors] = useState<{
    nome?: string;
    plano?: string;
    slug?: string;
  }>({});

  useEffect(() => {
    console.log('TenantForm: Componente montado');
    loadPlans();
    
    if (mode === 'edit' && id) {
      fetchTenantData(id);
    }
  }, [mode, id]);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      console.log('TenantForm: Carregando planos...');
      
      const { data, error } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price');
      
      if (error) {
        console.error('TenantForm: Erro ao carregar planos:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`TenantForm: ${data.length} planos encontrados`);
        
        setPlans(data.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description || '',
          price: plan.price,
          billingCycle: plan.billing_cycle as 'monthly' | 'quarterly' | 'yearly',
          userLimit: plan.user_limit,
          storageLimit: plan.storage_limit,
          isRecommended: plan.is_recommended,
          isActive: plan.is_active,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at
        })));
      } else {
        console.log('TenantForm: Nenhum plano encontrado');
        addToast({
          title: 'Atenção',
          message: 'Nenhum plano disponível. Por favor, cadastre planos primeiro.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('TenantForm: Erro ao carregar planos:', err);
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os planos disponíveis.',
        type: 'error'
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchTenantData = async (tenantId: string) => {
    try {
      setLoading(true);
      console.log('TenantForm: Buscando dados do tenant:', tenantId);
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();
      
      if (error) {
        console.error('TenantForm: Erro ao buscar dados do tenant:', error);
        throw error;
      }
      
      if (data) {
        console.log('TenantForm: Dados do tenant encontrados:', data);
        setFormData({
          nome: data.nome,
          plano: data.plano,
          status: data.status,
          slug: data.slug || '',
          limiteusuarios: data.limiteusuarios || 5,
          limitearmazenamento: data.limitearmazenamento || 5120,
          tema: data.tema || 'default',
          ativo: data.ativo,
          idiomas: data.idiomas || ['pt-BR']
        });
      }
    } catch (err) {
      console.error('TenantForm: Erro ao buscar dados do tenant:', err);
      setError('Não foi possível carregar os dados do tenant. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do tenant',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      nome?: string;
      plano?: string;
      slug?: string;
    } = {};
    
    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.plano) {
      errors.plano = 'Plano é obrigatório';
    }
    
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug deve conter apenas letras minúsculas, números e hífens';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateSlug = () => {
    if (formData.nome && !formData.slug) {
      const slug = formData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')  // Remove acentos
        .replace(/[^\w\s-]/g, '')        // Remove caracteres especiais
        .replace(/\s+/g, '-')            // Substitui espaços por hífens
        .replace(/--+/g, '-');           // Remove hífens duplicados
      
      setFormData(prev => ({ ...prev, slug }));
    }
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
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('TenantForm: Iniciando salvamento do tenant...');
      
      // Buscar dados do plano selecionado
      const selectedPlan = plans.find(p => p.id === formData.plano);
      
      if (mode === 'create') {
        // Criar novo tenant
        console.log('TenantForm: Criando novo tenant:', formData);
        
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert([{
            nome: formData.nome,
            plano: formData.plano,
            status: formData.status,
            slug: formData.slug,
            limiteusuarios: selectedPlan?.userLimit || formData.limiteusuarios,
            limitearmazenamento: selectedPlan?.storageLimit || formData.limitearmazenamento,
            tema: formData.tema,
            ativo: formData.ativo,
            idiomas: formData.idiomas
          }])
          .select()
          .single();
        
        if (tenantError) {
          console.error('TenantForm: Erro ao criar tenant:', tenantError);
          throw tenantError;
        }
        
        console.log('TenantForm: Tenant criado com sucesso:', tenantData);
        
        // Criar assinatura para o tenant
        if (selectedPlan) {
          console.log('TenantForm: Criando assinatura para o tenant com plano:', selectedPlan.name);
          
          const { error: subscriptionError } = await supabase
            .from('tenant_subscriptions')
            .insert([{
              tenant_id: tenantData.id,
              plan_id: selectedPlan.id,
              status: formData.ativo ? 'active' : 'inactive',
              billing_cycle: selectedPlan.billingCycle,
              amount: selectedPlan.price,
              is_auto_renew: true,
              start_date: new Date().toISOString(),
              renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
            }]);
          
          if (subscriptionError) {
            console.error('TenantForm: Erro ao criar assinatura:', subscriptionError);
            throw subscriptionError;
          }
          
          // Associar módulos do plano ao tenant
          console.log('TenantForm: Buscando módulos do plano para associar ao tenant');
          
          const { data: planModules, error: modulesError } = await supabase
            .from('plan_modules')
            .select('module_id')
            .eq('plan_id', selectedPlan.id);
          
          if (modulesError) {
            console.error('TenantForm: Erro ao buscar módulos do plano:', modulesError);
            throw modulesError;
          }
          
          if (planModules && planModules.length > 0) {
            console.log(`TenantForm: Associando ${planModules.length} módulos ao tenant`);
            
            const tenantModules = planModules.map(pm => ({
              tenant_id: tenantData.id,
              module_id: pm.module_id,
              is_active: true,
              activation_date: new Date().toISOString()
            }));
            
            const { error: insertModulesError } = await supabase
              .from('tenant_modules')
              .insert(tenantModules);
            
            if (insertModulesError) {
              console.error('TenantForm: Erro ao associar módulos:', insertModulesError);
              throw insertModulesError;
            }
          }
        }
        
        setSuccess('Tenant criado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Tenant criado com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/tenants'), 1500);
      } else if (mode === 'edit' && id) {
        // Atualizar tenant existente
        console.log('TenantForm: Atualizando tenant existente:', formData);
        
        const { error: updateError } = await supabase
          .from('tenants')
          .update({
            nome: formData.nome,
            plano: formData.plano,
            status: formData.status,
            slug: formData.slug,
            limiteusuarios: formData.limiteusuarios,
            limitearmazenamento: formData.limitearmazenamento,
            tema: formData.tema,
            ativo: formData.ativo,
            idiomas: formData.idiomas,
            updatedAt: new Date().toISOString()
          })
          .eq('id', id);
        
        if (updateError) {
          console.error('TenantForm: Erro ao atualizar tenant:', updateError);
          throw updateError;
        }
        
        // Atualizar assinatura se o plano mudou
        const { data: currentSub, error: subError } = await supabase
          .from('tenant_subscriptions')
          .select('*')
          .eq('tenant_id', id)
          .single();
        
        if (!subError && currentSub && currentSub.plan_id !== formData.plano) {
          console.log('TenantForm: Atualizando assinatura do tenant com novo plano');
          
          const { error: updateSubError } = await supabase
            .from('tenant_subscriptions')
            .update({
              plan_id: formData.plano,
              status: formData.ativo ? 'active' : 'inactive',
              amount: selectedPlan?.price || 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentSub.id);
          
          if (updateSubError) {
            console.error('TenantForm: Erro ao atualizar assinatura:', updateSubError);
            throw updateSubError;
          }
        }
        
        setSuccess('Tenant atualizado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Tenant atualizado com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/tenants'), 1500);
      }
    } catch (err: any) {
      console.error('TenantForm: Erro ao salvar tenant:', err);
      setError(err.message || 'Ocorreu um erro ao salvar o tenant. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: err.message || 'Falha ao salvar o tenant',
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
    
    if (name === 'plano') {
      // Se mudar o plano, atualizar limites baseado no plano selecionado
      const selectedPlan = plans.find(p => p.id === value);
      if (selectedPlan) {
        setFormData(prev => ({
          ...prev,
          plano: value,
          limiteusuarios: selectedPlan.userLimit,
          limitearmazenamento: selectedPlan.storageLimit
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          plano: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : name === 'limiteusuarios' || name === 'limitearmazenamento'
            ? parseInt(value) || 0
            : value
      }));
    }
    
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

  // Formatar tamanho de armazenamento para exibição
  const formatStorageSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${mb / 1024} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Novo Tenant' : 'Editar Tenant'}
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
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  onBlur={generateSlug}
                  className={`w-full pl-10 px-4 py-2 border ${formErrors.nome ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                />
              </div>
              {formErrors.nome && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.nome}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-4 py-2 border ${formErrors.slug ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="exemplo-empresa"
                />
              </div>
              {formErrors.slug ? (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.slug}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Identificador único para URL, gerado automaticamente se deixado em branco
                </p>
              )}
            </div>

            <div>
              <label htmlFor="plano" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plano <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="plano"
                  name="plano"
                  value={formData.plano}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-4 py-2 border ${formErrors.plano ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required
                >
                  <option value="">Selecione um plano</option>
                  {loadingPlans ? (
                    <option value="" disabled>Carregando planos...</option>
                  ) : (
                    plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - R$ {plan.price.toFixed(2)}/{plan.billingCycle === 'monthly' ? 'mês' : plan.billingCycle === 'quarterly' ? 'trimestre' : 'ano'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {formErrors.plano && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.plano}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
                <option value="suspenso">Suspenso</option>
              </select>
            </div>

            <div>
              <label htmlFor="limiteusuarios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limite de Usuários
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="limiteusuarios"
                  name="limiteusuarios"
                  value={formData.limiteusuarios}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="limitearmazenamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Limite de Armazenamento (MB)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Database className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="limitearmazenamento"
                  name="limitearmazenamento"
                  value={formData.limitearmazenamento}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatStorageSize(formData.limitearmazenamento)}
              </p>
            </div>

            <div>
              <label htmlFor="tema" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tema
              </label>
              <select
                id="tema"
                name="tema"
                value={formData.tema}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="default">Padrão</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Tenant ativo
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/tenants')}
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
              {loading ? 'Salvando...' : 'Salvar Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantForm;