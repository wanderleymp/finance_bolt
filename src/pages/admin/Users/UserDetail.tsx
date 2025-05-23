import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, User, Mail, Shield, Clock, 
  Calendar, Edit, UserPlus, Building, Database,
  Check, X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { User as UserType, Tenant, Organization } from '../../../types';
import { useUI } from '../../../contexts/UIContext';

const UserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [userTenants, setUserTenants] = useState<Tenant[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    if (id) {
      fetchUserData(id);
    } else {
      navigate('/admin/users');
    }
  }, [id, navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error('UserDetail: Erro ao buscar usuário:', userError);
        throw userError;
      }
      
      if (!userData) {
        console.error('UserDetail: Usuário não encontrado');
        throw new Error('Usuário não encontrado');
      }
      
      console.log('UserDetail: Dados do usuário encontrados:', userData);
      
      // Formatar dados do usuário
      const formattedUser: UserType = {
        id: userData.id,
        name: userData.name || '',
        email: userData.email,
        avatar: userData.avatar_url || undefined,
        role: userData.role as any,
        lastLogin: userData.last_login || undefined
      };
      
      setUser(formattedUser);
      
      // Buscar tenants do usuário
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenant_users')
        .select(`
          tenant:tenant_id(*)
        `)
        .eq('user_id', userId);
      
      if (tenantsError) {
        console.error('UserDetail: Erro ao buscar tenants do usuário:', tenantsError);
        throw tenantsError;
      }
      
      console.log('UserDetail: Tenants do usuário:', tenantsData);
      
      // Formatar dados dos tenants
      if (tenantsData && tenantsData.length > 0) {
        const formattedTenants: Tenant[] = tenantsData
          .filter(item => item.tenant) // Garantir que o tenant existe
          .map(item => ({
            id: item.tenant.id,
            name: item.tenant.nome,
            plan: item.tenant.plano,
            isActive: item.tenant.ativo,
            status: item.tenant.status,
            createdAt: item.tenant.createdAt
          }));
        
        setUserTenants(formattedTenants);
      }
      
      // Buscar organizações do usuário
      const { data: orgsData, error: orgsError } = await supabase
        .from('organization_users')
        .select(`
          organization:organization_id(*)
        `)
        .eq('user_id', userId);
      
      if (orgsError) {
        console.error('UserDetail: Erro ao buscar organizações do usuário:', orgsError);
        throw orgsError;
      }
      
      console.log('UserDetail: Organizações do usuário:', orgsData);
      
      // Formatar dados das organizações
      if (orgsData && orgsData.length > 0) {
        const formattedOrgs: Organization[] = orgsData
          .filter(item => item.organization) // Garantir que a organização existe
          .map(item => ({
            id: item.organization.id,
            tenantId: item.organization.tenant_id,
            name: item.organization.name,
            description: item.organization.description || undefined,
            isActive: item.organization.is_active,
            createdAt: item.organization.created_at,
            updatedAt: item.organization.updated_at
          }));
        
        setUserOrganizations(formattedOrgs);
      }
    } catch (err) {
      console.error('UserDetail: Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados do usuário.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do usuário',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Tradução de papéis
  const translateRole = (role?: string): string => {
    if (!role) return 'Desconhecido';
    
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'superadmin':
        return 'Super Admin';
      case 'manager':
        return 'Gerente';
      case 'user':
        return 'Usuário';
      default:
        return role;
    }
  };

  // Formatar data para exibição
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando dados do usuário...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error || 'Usuário não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
        
        <Link
          to={`/admin/users/${id}/edit`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar Usuário
        </Link>
      </div>

      {/* Header com informações principais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-16 w-16 object-cover" />
                  ) : (
                    <User size={32} className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user.name || 'Sem nome'}
                </h1>
                <div className="flex items-center mt-2">
                  <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin' || user.role === 'superadmin'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    : user.role === 'manager'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                }`}>
                  {translateRole(user.role)}
                </span>
              </div>
              {user.lastLogin && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Último login: {formatDate(user.lastLogin)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid com informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tenants do usuário */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Tenants ({userTenants.length})
            </h2>
            
            <Link
              to={`/admin/users/${id}/tenants`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Gerenciar Tenants
            </Link>
          </div>
          
          {userTenants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plano
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Database className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {tenant.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                            : tenant.plan === 'pro'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {tenant.plan === 'enterprise' 
                            ? 'Enterprise' 
                            : tenant.plan === 'pro' 
                              ? 'Profissional' 
                              : 'Básico'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {tenant.isActive ? (
                            <><Check size={12} className="mr-1" /> Ativo</>
                          ) : (
                            <><X size={12} className="mr-1" /> Inativo</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Database className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhum tenant associado a este usuário</p>
              <button
                onClick={() => navigate(`/admin/users/${id}/tenants`)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Associar a Tenants
              </button>
            </div>
          )}
        </div>
        
        {/* Organizações do usuário */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Building className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Organizações ({userOrganizations.length})
            </h2>
            
            <Link
              to={`/admin/users/${id}/organizations`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Gerenciar Organizações
            </Link>
          </div>
          
          {userOrganizations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {org.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {userTenants.find(t => t.id === org.tenantId)?.name || org.tenantId.substring(0, 8) + '...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {org.isActive ? (
                            <><Check size={12} className="mr-1" /> Ativa</>
                          ) : (
                            <><X size={12} className="mr-1" /> Inativa</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <Building className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma organização associada a este usuário</p>
              <button
                onClick={() => navigate(`/admin/users/${id}/organizations`)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Associar a Organizações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;