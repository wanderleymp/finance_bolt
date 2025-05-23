import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Building, CreditCard, Calendar, Check, X, Users, 
  Database, Package, Settings, Edit, Zap, Globe, Mail, Layers,
  LayoutDashboard, Server, FileText, Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SaaSModule, SaaSPlan } from '../../../types';
import { HardDrive } from 'lucide-react';

const TenantDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [tenant, setTenant] = useState<any | null>(null);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [plan, setPlan] = useState<SaaSPlan | null>(null);
  const [modules, setModules] = useState<SaaSModule[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    storageUsed: number;
    lastActivity: string | null;
  }>({
    totalUsers: 0,
    activeUsers: 0,
    storageUsed: 0,
    lastActivity: null
  });

  useEffect(() => {
    if (id) {
      fetchTenantData(id);
    } else {
      navigate('/admin/tenants');
    }
  }, [id, navigate]);

  const fetchTenantData = async (tenantId: string) => {
    try {
      setLoading(true);
      
      // Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();
      
      if (tenantError) throw tenantError;
      setTenant(tenantData);
      
      // Buscar assinatura do tenant
      const { data: subData, error: subError } = await supabase
        .from('tenant_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('tenant_id', tenantId)
        .single();
      
      if (!subError && subData) {
        setSubscription(subData);
        
        // Formatar os dados do plano
        setPlan({
          id: subData.plan.id,
          name: subData.plan.name,
          description: subData.plan.description || '',
          price: subData.plan.price,
          billingCycle: subData.plan.billing_cycle as 'monthly' | 'quarterly' | 'yearly',
          userLimit: subData.plan.user_limit,
          storageLimit: subData.plan.storage_limit,
          isRecommended: subData.plan.is_recommended,
          isActive: subData.plan.is_active,
          createdAt: subData.plan.created_at,
          updatedAt: subData.plan.updated_at
        });
      }
      
      // Buscar módulos do tenant
      const { data: modulesData, error: modulesError } = await supabase
        .from('tenant_modules')
        .select('*, module:module_id(*)')
        .eq('tenant_id', tenantId);
      
      if (!modulesError && modulesData) {
        // Formatar os dados dos módulos
        const formattedModules: SaaSModule[] = modulesData.map(item => ({
          id: item.module.id,
          name: item.module.name,
          code: item.module.code,
          description: item.module.description || '',
          icon: item.module.icon || 'package',
          isCore: item.module.is_core,
          price: item.module.price,
          isActive: item.is_active, // Usar o status do tenant_modules, não do módulo
          createdAt: item.module.created_at,
          updatedAt: item.module.updated_at
        }));
        
        setModules(formattedModules);
      }
      
      // Buscar usuários do tenant
      const { data: usersData, error: usersError } = await supabase
        .from('tenant_users')
        .select('*, user:user_id(*)')
        .eq('tenant_id', tenantId);
      
      if (!usersError && usersData) {
        setUsers(usersData);
        
        // Atualizar estatísticas
        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          activeUsers: usersData.filter(u => u.user.last_login !== null).length
        }));
      }
      
      // Buscar empresas do tenant
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (!companiesError && companiesData) {
        setCompanies(companiesData);
      }
      
    } catch (err) {
      console.error('Erro ao buscar dados do tenant:', err);
      setError('Não foi possível carregar os dados do tenant.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar tamanho de armazenamento para exibição
  const formatStorageSize = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // Formatar data para exibição
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando dados do tenant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
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
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-300">Tenant não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
        
        <Link
          to={`/admin/tenants/${id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Tenant
        </Link>
      </div>

      {/* Header com informações principais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Building size={32} />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tenant.nome}
                </h1>
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.status === 'ativo' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                  </span>
                  
                  {plan && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      plan.billingCycle === 'yearly'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                    }`}>
                      {plan.name}
                    </span>
                  )}
                  
                  {tenant.slug && (
                    <span className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Globe size={12} className="mr-1" />
                      {tenant.slug}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className={`text-sm ${
                tenant.ativo ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {tenant.ativo ? (
                  <span className="flex items-center">
                    <Check size={16} className="mr-1" />
                    Tenant ativo
                  </span>
                ) : (
                  <span className="flex items-center">
                    <X size={16} className="mr-1" />
                    Tenant inativo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Criado em {formatDate(tenant.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade com 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da esquerda - Estatísticas e detalhes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cartões de estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Users size={18} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuários</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Limite: {tenant.limiteusuarios || 'Ilimitado'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Building size={18} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Empresas</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{companies.length}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Database size={18} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Armazenamento</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatStorageSize(stats.storageUsed || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Limite: {formatStorageSize(tenant.limitearmazenamento || 0)}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2">
                <Package size={18} className="text-indigo-600 dark:text-indigo-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Módulos</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{modules.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {modules.filter(m => m.isActive).length} ativos
              </p>
            </div>
          </div>

          {/* Assinatura */}
          {subscription && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Assinatura
                </h2>
              </div>
              
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Plano</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{plan?.name}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : subscription.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {subscription.status === 'active' ? 'Ativa' : 
                         subscription.status === 'pending' ? 'Pendente' : 
                         'Inativa'}
                      </span>
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      R$ {subscription.amount.toFixed(2)}/{subscription.billing_cycle === 'monthly' ? 'mês' : subscription.billing_cycle === 'quarterly' ? 'trimestre' : 'ano'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data de início</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(subscription.start_date)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Próxima renovação</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(subscription.renewal_date)}</dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Renovação automática</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {subscription.is_auto_renew ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <Check size={16} className="mr-1" />
                          Sim
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <X size={16} className="mr-1" />
                          Não
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Empresas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Empresas ({companies.length})
              </h2>
              
              <Link
                to={`/admin/tenants/${id}/companies/new`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Adicionar
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              {companies.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        CNPJ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Último Acesso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {companies.map(company => (
                      <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {company.nome_fantasia}
                              {company.is_headquarters && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                  Matriz
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {company.razao_social}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {company.cnpj}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.is_headquarters
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {company.is_headquarters ? 'Matriz' : 'Filial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {company.last_access 
                            ? formatDate(company.last_access) 
                            : 'Nunca acessado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Building className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhuma empresa cadastrada para este tenant.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Coluna da direita - Módulos e usuários */}
        <div className="space-y-6">
          {/* Módulos ativos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Package className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Módulos ({modules.length})
              </h2>
              
              <Link
                to={`/admin/tenants/${id}/modules`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Gerenciar
              </Link>
            </div>
            
            <div className="p-4">
              {modules.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {modules.map(module => (
                    <li key={module.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            {module.icon && React.createElement(
                              (require('lucide-react') as any)[module.icon.charAt(0).toUpperCase() + module.icon.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase())],
                              { size: 16 }
                            )}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {module.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {module.code}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          module.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {module.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum módulo ativado para este tenant.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Usuários */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Usuários ({users.length})
              </h2>
              
              <Link
                to={`/admin/tenants/${id}/users`}
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Gerenciar
              </Link>
            </div>
            
            <div className="p-4">
              {users.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.slice(0, 5).map(userRel => (
                    <li key={userRel.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {userRel.user.avatar_url ? (
                            <img 
                              src={userRel.user.avatar_url} 
                              alt={userRel.user.name || 'Usuário'} 
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              {(userRel.user.name || userRel.user.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {userRel.user.name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail size={10} className="mr-1" />
                            {userRel.user.email}
                          </p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userRel.role === 'admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                          {userRel.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </div>
                    </li>
                  ))}
                  
                  {users.length > 5 && (
                    <li className="py-3 text-center">
                      <Link 
                        to={`/admin/tenants/${id}/users`}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Ver todos os {users.length} usuários
                      </Link>
                    </li>
                  )}
                </ul>
              ) : (
                <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum usuário cadastrado para este tenant.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Configurações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Settings className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Configurações
              </h2>
            </div>
            
            <div className="p-4">
              <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="text-sm text-gray-900 dark:text-white col-span-2">
                    {tenant.ativo ? (
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <Check size={16} className="mr-1" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 dark:text-red-400">
                        <X size={16} className="mr-1" />
                        Inativo
                      </span>
                    )}
                  </dd>
                </div>
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tema</dt>
                  <dd className="text-sm text-gray-900 dark:text-white col-span-2">{tenant.tema || 'Padrão'}</dd>
                </div>
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Limite de Usuários</dt>
                  <dd className="text-sm text-gray-900 dark:text-white col-span-2">
                    {tenant.limiteusuarios || 'Ilimitado'}
                    {users.length > 0 && tenant.limiteusuarios && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({users.length} / {tenant.limiteusuarios})
                      </span>
                    )}
                  </dd>
                </div>
                
                <div className="py-3 grid grid-cols-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Armazenamento</dt>
                  <dd className="text-sm text-gray-900 dark:text-white col-span-2">
                    {formatStorageSize(tenant.limitearmazenamento || 0)}
                    {stats.storageUsed > 0 && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({formatStorageSize(stats.storageUsed)} / {formatStorageSize(tenant.limitearmazenamento || 0)})
                      </span>
                    )}
                  </dd>
                </div>
                
                {tenant.idiomas && tenant.idiomas.length > 0 && (
                  <div className="py-3 grid grid-cols-3">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Idiomas</dt>
                    <dd className="text-sm text-gray-900 dark:text-white col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {tenant.idiomas.map((lang: string) => (
                          <span key={lang} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
          
          {/* Ações rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Zap className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Ações rápidas
              </h2>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  to={`/admin/tenants/${id}/modules`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Layers className="h-5 w-5 mr-2 text-indigo-500" />
                  Gerenciar Módulos
                </Link>
                
                <Link
                  to={`/admin/tenants/${id}/users`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Users className="h-5 w-5 mr-2 text-indigo-500" />
                  Gerenciar Usuários
                </Link>
                
                <Link
                  to={`/admin/tenants/${id}/companies/new`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Building className="h-5 w-5 mr-2 text-indigo-500" />
                  Nova Empresa
                </Link>
                
                <Link
                  to={`/admin/tenants/${id}/subscription`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <CreditCard className="h-5 w-5 mr-2 text-indigo-500" />
                  Gerenciar Assinatura
                </Link>
                
                <Link
                  to={`/admin/tenants/${id}/settings`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Settings className="h-5 w-5 mr-2 text-indigo-500" />
                  Configurações
                </Link>
                
                <Link
                  to={`/admin/tenants/${id}/activity`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                  Atividades
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetail;