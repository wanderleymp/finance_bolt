import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Building, Mail, Phone, Check, X, Users, 
  MapPin, Edit, UserPlus, Globe, Calendar
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Organization, OrganizationUser, User } from '../../../types';
import { useUI } from '../../../contexts/UIContext';

const OrganizationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);

  useEffect(() => {
    if (id) {
      fetchOrganizationData(id);
    } else {
      navigate('/admin');
    }
  }, [id, navigate]);

  const fetchOrganizationData = async (orgId: string) => {
    try {
      setLoading(true);
      
      // Buscar dados da organização
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (orgError) {
        console.error('OrganizationDetail: Erro ao buscar organização:', orgError);
        throw orgError;
      }
      
      if (!orgData) {
        console.error('OrganizationDetail: Organização não encontrada');
        throw new Error('Organização não encontrada');
      }
      
      console.log('OrganizationDetail: Dados da organização encontrados:', orgData);
      
      // Formatar dados da organização
      const formattedOrg: Organization = {
        id: orgData.id,
        tenantId: orgData.tenant_id,
        name: orgData.name,
        description: orgData.description || undefined,
        logo: orgData.logo || undefined,
        isActive: orgData.is_active,
        createdAt: orgData.created_at,
        updatedAt: orgData.updated_at,
        contactEmail: orgData.contact_email || undefined,
        contactPhone: orgData.contact_phone || undefined,
        address: orgData.address || undefined
      };
      
      setOrganization(formattedOrg);
      
      // Buscar usuários da organização
      const { data: usersData, error: usersError } = await supabase
        .from('organization_users')
        .select(`
          *,
          user:user_id(*)
        `)
        .eq('organization_id', orgId);
      
      if (usersError) {
        console.error('OrganizationDetail: Erro ao buscar usuários:', usersError);
        throw usersError;
      }
      
      console.log('OrganizationDetail: Usuários da organização:', usersData);
      
      // Formatar dados dos usuários
      if (usersData) {
        const formattedUsers: OrganizationUser[] = usersData.map(item => ({
          id: item.id,
          organizationId: item.organization_id,
          userId: item.user_id,
          role: item.role as 'admin' | 'manager' | 'member',
          createdAt: item.created_at,
          user: item.user ? {
            id: item.user.id,
            name: item.user.name || '',
            email: item.user.email,
            role: item.user.role as any,
            avatar: item.user.avatar_url || undefined,
            lastLogin: item.user.last_login || undefined
          } : undefined
        }));
        
        setUsers(formattedUsers);
      }
    } catch (err) {
      console.error('OrganizationDetail: Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados da organização.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da organização',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
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
            <p className="text-gray-600 dark:text-gray-300">Carregando dados da organização...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/organizations')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error || 'Organização não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-wrap gap-2 justify-between items-center">
  <div className="flex gap-2">
    <button
      onClick={() => navigate('/admin')}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Menu Principal
    </button>
    <button
      onClick={() => navigate('/')}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Dashboard Principal
    </button>
  </div>
  <Link
    to={`/admin/organizations/${id}/edit`}
    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    <Edit className="h-4 w-4 mr-2" />
    Editar Organização
  </Link>
</div>

      {/* Header com informações principais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {organization.logo ? (
                    <img src={organization.logo} alt={organization.name} className="h-16 w-16 object-cover" />
                  ) : (
                    <Building size={32} className="text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organization.name}
                </h1>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    organization.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {organization.isActive ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Criada em {formatDate(organization.createdAt)}
              </div>
              {organization.updatedAt && organization.updatedAt !== organization.createdAt && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Atualizada em {formatDate(organization.updatedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid com informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna da esquerda - Informações de contato e detalhes */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Building className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Informações da Organização
              </h2>
            </div>
            
            <div className="p-6">
              <dl className="space-y-4">
                {organization.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{organization.description}</dd>
                  </div>
                )}
                
                {organization.contactEmail && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{organization.contactEmail}</span>
                    </dd>
                  </div>
                )}
                
                {organization.contactPhone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{organization.contactPhone}</span>
                    </dd>
                  </div>
                )}
                
                {organization.address && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Endereço</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <span>{organization.address}</span>
                    </dd>
                  </div>
                )}
                
                {organization.logo && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Logo URL</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={organization.logo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs"
                      >
                        {organization.logo}
                      </a>
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {organization.isActive ? (
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <Check size={16} className="mr-1" />
                        Ativa
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 dark:text-red-400">
                        <X size={16} className="mr-1" />
                        Inativa
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        
        {/* Coluna da direita - Usuários associados */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Usuários da Organização ({users.length})
              </h2>
              
              <Link
                to={`/admin/organizations/${id}/users`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Adicionar Usuário
              </Link>
            </div>
            
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cargo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Associado em
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((userRel) => (
                      <tr key={userRel.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userRel.user ? (
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {userRel.user.avatar ? (
                                  <img src={userRel.user.avatar} alt={userRel.user.name} className="h-8 w-8 object-cover" />
                                ) : (
                                  <span className="text-sm font-medium text-gray-500">
                                    {userRel.user.name ? userRel.user.name[0].toUpperCase() : '?'}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {userRel.user.name || 'Sem nome'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {userRel.user.email}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Usuário não encontrado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userRel.role === 'admin'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              : userRel.role === 'manager'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          }`}>
                            {userRel.role === 'admin' 
                              ? 'Administrador' 
                              : userRel.role === 'manager' 
                                ? 'Gerente' 
                                : 'Membro'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                            {formatDate(userRel.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum usuário associado a esta organização</p>
                <button
                  onClick={() => navigate(`/admin/organizations/${id}/users`)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Usuários
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;