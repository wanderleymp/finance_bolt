import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit, Trash, Eye,
  Building, Users, Mail, Phone, Check, X, AlertTriangle
} from 'lucide-react';
import { Organization } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const OrganizationsIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      console.log('OrganizationsIndex: Carregando organizações...');
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('OrganizationsIndex: Erro ao buscar organizações:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`OrganizationsIndex: ${data.length} organizações encontradas`);
        
        const formattedOrganizations: Organization[] = data.map(org => ({
          id: org.id,
          tenantId: org.tenant_id,
          name: org.name,
          description: org.description || undefined,
          logo: org.logo || undefined,
          isActive: org.is_active,
          createdAt: org.created_at,
          updatedAt: org.updated_at,
          contactEmail: org.contact_email || undefined,
          contactPhone: org.contact_phone || undefined,
          address: org.address || undefined
        }));
        
        setOrganizations(formattedOrganizations);
      } else {
        console.log('OrganizationsIndex: Nenhuma organização encontrada');
      }
    } catch (err) {
      console.error('OrganizationsIndex: Erro ao carregar organizações:', err);
      setError('Não foi possível carregar as organizações. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar organizações',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    // Se não estiver no modo de confirmação para esta organização, solicitar confirmação
    if (deleteConfirmation !== orgId) {
      setDeleteConfirmation(orgId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      console.log('OrganizationsIndex: Excluindo organização:', orgId);

      // Verificar se a organização possui usuários
      const { data: orgUsers, error: usersError } = await supabase
        .from('organization_users')
        .select('id')
        .eq('organization_id', orgId);
      
      if (usersError) {
        console.error('OrganizationsIndex: Erro ao verificar usuários da organização:', usersError);
        throw usersError;
      }

      // Excluir relacionamentos de usuários primeiro (se houver)
      if (orgUsers && orgUsers.length > 0) {
        const { error: deleteUsersError } = await supabase
          .from('organization_users')
          .delete()
          .eq('organization_id', orgId);
        
        if (deleteUsersError) {
          console.error('OrganizationsIndex: Erro ao excluir relacionamentos de usuários:', deleteUsersError);
          throw deleteUsersError;
        }
      }

      // Excluir a organização
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (deleteError) {
        console.error('OrganizationsIndex: Erro ao excluir organização:', deleteError);
        throw deleteError;
      }

      // Atualizar a lista de organizações
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      addToast({
        title: 'Sucesso',
        message: 'Organização excluída com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('OrganizationsIndex: Erro ao excluir organização:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir a organização',
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

  // Filtrar e pesquisar organizações
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.description && org.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (org.contactEmail && org.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = 
      filterActive === 'all' || 
      (filterActive === 'active' && org.isActive) || 
      (filterActive === 'inactive' && !org.isActive);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizações</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerencie as organizações do sistema
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/organizations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
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
                placeholder="Pesquisar organizações..."
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
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
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
                    onClick={fetchOrganizations}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando organizações...</span>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <Building className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma organização encontrada</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterActive !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece criando sua primeira organização.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/organizations/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Organização
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Organização
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contato
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {org.logo ? (
                              <img src={org.logo} alt={org.name} className="h-10 w-10 object-cover" />
                            ) : (
                              <Building size={20} className="text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </div>
                            {org.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs truncate">
                                {org.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(org.contactEmail || org.contactPhone) ? (
                          <div>
                            {org.contactEmail && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                <Mail size={14} className="mr-1" />
                                <span>{org.contactEmail}</span>
                              </div>
                            )}
                            {org.contactPhone && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <Phone size={14} className="mr-1" />
                                <span>{org.contactPhone}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Sem contato
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {org.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/organizations/${org.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Visualizar"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/admin/organizations/${org.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>

                          {deleteConfirmation === org.id ? (
                            <>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Cancelar"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOrganization(org.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Confirmar exclusão"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteOrganization(org.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                            >
                              <Trash className="h-5 w-5" />
                            </button>
                          )}
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

export default OrganizationsIndex;