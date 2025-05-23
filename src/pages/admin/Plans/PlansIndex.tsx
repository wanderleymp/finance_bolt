import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Edit, Trash, Check, X, CreditCard, Package, Zap, 
  Users, Database, Tag, ChevronDown, ChevronUp, Eye,
  LayoutGrid, List
} from 'lucide-react';
import { SaaSPlan, SaaSModule } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const PlansIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      console.log('PlansIndex: Carregando planos...');
      
      const { data: plansData, error: plansError } = await supabase
        .from('saas_plans')
        .select('*')
        .order('price');
      
      if (plansError) {
        console.error('PlansIndex: Erro ao buscar planos:', plansError);
        throw plansError;
      }
      
      if (plansData) {
        console.log(`PlansIndex: ${plansData.length} planos encontrados`);
        
        // Para cada plano, buscar seus módulos
        const plansWithModules = await Promise.all(
          plansData.map(async (plan) => {
            const { data: modulesData, error: modulesError } = await supabase
              .from('plan_modules')
              .select('module:module_id(*)')
              .eq('plan_id', plan.id);
            
            if (modulesError) {
              console.error(`PlansIndex: Erro ao buscar módulos do plano ${plan.id}:`, modulesError);
              return {
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
                updatedAt: plan.updated_at,
                modules: [] as SaaSModule[]
              };
            }
            
            const modules = modulesData?.map(item => ({
              id: item.module.id,
              name: item.module.name,
              code: item.module.code,
              description: item.module.description || '',
              icon: item.module.icon || 'package',
              isCore: item.module.is_core,
              price: item.module.price,
              isActive: item.module.is_active,
              createdAt: item.module.created_at,
              updatedAt: item.module.updated_at
            })) || [];
            
            return {
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
              updatedAt: plan.updated_at,
              modules
            };
          })
        );
        
        setPlans(plansWithModules);
      }
    } catch (err) {
      console.error('PlansIndex: Erro ao buscar planos:', err);
      setError('Não foi possível carregar os planos. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar planos',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      console.log('PlansIndex: Excluindo plano:', planId);
      
      // Verificar se há tenants usando este plano
      const { data: subscriptions, error: subError } = await supabase
        .from('tenant_subscriptions')
        .select('tenant_id')
        .eq('plan_id', planId);
      
      if (subError) {
        console.error('PlansIndex: Erro ao verificar assinaturas:', subError);
        throw subError;
      }
      
      if (subscriptions && subscriptions.length > 0) {
        throw new Error(`Este plano não pode ser excluído pois está sendo utilizado por ${subscriptions.length} tenant(s)`);
      }
      
      // Excluir relacionamentos com módulos
      const { error: moduleError } = await supabase
        .from('plan_modules')
        .delete()
        .eq('plan_id', planId);
      
      if (moduleError) {
        console.error('PlansIndex: Erro ao excluir relações de módulos:', moduleError);
        throw moduleError;
      }
      
      // Excluir o plano
      const { error: planError } = await supabase
        .from('saas_plans')
        .delete()
        .eq('id', planId);
      
      if (planError) {
        console.error('PlansIndex: Erro ao excluir plano:', planError);
        throw planError;
      }
      
      // Atualizar a lista de planos
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      
      addToast({
        title: 'Sucesso',
        message: 'Plano excluído com sucesso',
        type: 'success'
      });
    } catch (err: any) {
      console.error('PlansIndex: Erro ao excluir plano:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err.message || 'Não foi possível excluir o plano',
        type: 'error'
      });
    }
  };

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatBillingCycle = (cycle: string): string => {
    return cycle === 'monthly' 
      ? 'Mensal' 
      : cycle === 'quarterly' 
        ? 'Trimestral' 
        : 'Anual';
  };

  const formatStorageSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos SaaS</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie os planos de assinatura para sua plataforma
            </p>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${
                  viewMode === 'card' 
                    ? 'bg-white dark:bg-gray-800 shadow' 
                    : 'hover:bg-white/60 dark:hover:bg-gray-600'
                }`}
                title="Visualização em cards"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${
                  viewMode === 'table' 
                    ? 'bg-white dark:bg-gray-800 shadow' 
                    : 'hover:bg-white/60 dark:hover:bg-gray-600'
                }`}
                title="Visualização em tabela"
              >
                <List size={18} />
              </button>
            </div>
            
            <Link
              to="/admin/plans/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 p-4">
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

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando planos...</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum plano encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Crie seu primeiro plano para oferecer aos clientes.</p>
            <div className="mt-6">
              <Link
                to="/admin/plans/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano
              </Link>
            </div>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div 
                key={plan.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border ${
                  plan.isRecommended
                    ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-400 dark:ring-indigo-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.isRecommended && (
                  <div className="bg-indigo-500 py-1 px-3 text-white text-xs font-medium text-center">
                    Recomendado
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                        /{plan.billingCycle === 'monthly' ? 'mês' : plan.billingCycle === 'quarterly' ? 'trimestre' : 'ano'}
                      </span>
                    </div>
                    
                    {plan.description && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Até {plan.userLimit} usuários
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {formatStorageSize(plan.storageLimit)} de armazenamento
                      </span>
                    </div>
                    
                    <div className="flex items-start">
                      <Package className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-3 mt-0.5" />
                      <div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {plan.modules?.length || 0} módulos incluídos
                        </span>
                        <button
                          onClick={() => togglePlanExpansion(plan.id)}
                          className="block text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mt-1 flex items-center"
                        >
                          {expandedPlans[plan.id] ? (
                            <>Ocultar módulos <ChevronUp size={14} className="ml-1" /></>
                          ) : (
                            <>Ver módulos <ChevronDown size={14} className="ml-1" /></>
                          )}
                        </button>
                        
                        {expandedPlans[plan.id] && plan.modules && (
                          <ul className="mt-2 space-y-1">
                            {plan.modules.map(module => (
                              <li key={module.id} className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                                <Check className="h-3 w-3 text-green-500 dark:text-green-400 mr-1" />
                                {module.name}
                                {module.isCore && (
                                  <span className="ml-1 text-green-600 dark:text-green-400">*</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <Link
                    to={`/admin/plans/${plan.id}/edit`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Link>
                  
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash className="h-3.5 w-3.5 mr-1" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Preço
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuários
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Armazenamento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Faturamento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {plans.map(plan => (
                    <tr key={plan.id} className={plan.isRecommended ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                              {plan.name}
                              {plan.isRecommended && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {plan.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{formatCurrency(plan.price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Até {plan.userLimit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{formatStorageSize(plan.storageLimit)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{formatBillingCycle(plan.billingCycle)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {plan.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/plans/${plan.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
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

export default PlansIndex;