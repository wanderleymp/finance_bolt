import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, Edit, Trash, UserPlus, Eye, 
  Shield, User, UserCheck, Mail, Check, X, Calendar,
  AlertTriangle
} from 'lucide-react';
import { User as UserType } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const UsersIndex: React.FC = () => {
  const { addToast } = useUI();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('UsersIndex: Carregando usuários...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('UsersIndex: Erro ao buscar usuários:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`UsersIndex: ${data.length} usuários encontrados`);
        
        const formattedUsers: UserType[] = data.map(user => ({
          id: user.id,
          name: user.name || '',
          email: user.email,
          avatar: user.avatar_url || undefined,
          role: user.role as any,
          lastLogin: user.last_login || undefined
        }));
        
        setUsers(formattedUsers);
      } else {
        console.log('UsersIndex: Nenhum usuário encontrado');
      }
    } catch (err) {
      console.error('UsersIndex: Erro ao carregar usuários:', err);
      setError('Não foi possível carregar os usuários. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar usuários',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Se não estiver no modo de confirmação para este usuário, solicitar confirmação
    if (deleteConfirmation !== userId) {
      setDeleteConfirmation(userId);
      return;
    }

    // Se chegou aqui, é porque confirmou a exclusão
    try {
      setLoading(true);
      console.log('UsersIndex: Excluindo usuário:', userId);

      // Remover associações com tenants
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .delete()
        .eq('user_id', userId);
      
      if (tenantUserError) {
        console.error('UsersIndex: Erro ao remover associações com tenants:', tenantUserError);
        throw tenantUserError;
      }

      // Remover associações com organizações
      const { error: orgUserError } = await supabase
        .from('organization_users')
        .delete()
        .eq('user_id', userId);
      
      if (orgUserError) {
        console.error('UsersIndex: Erro ao remover associações com organizações:', orgUserError);
        throw orgUserError;
      }

      // Excluir o usuário da tabela users
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.error('UsersIndex: Erro ao excluir usuário da tabela users:', userError);
        throw userError;
      }

      // Excluir o usuário da autenticação (isso pode requerer função do servidor ou serviço de admin)
      // Esta é uma operação mais complexa e normalmente não está disponível via cliente
      // No Supabase, normalmente seria feito via função Edge ou Admin API

      // Atualizar a lista de usuários
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      addToast({
        title: 'Sucesso',
        message: 'Usuário excluído com sucesso',
        type: 'success'
      });
    } catch (err) {
      console.error('UsersIndex: Erro ao excluir usuário:', err);
      
      addToast({
        title: 'Erro na exclusão',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o usuário',
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

  // Filtrar e pesquisar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      filterRole === 'all' || 
      user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Tradução de papéis
  const translateRole = (role: string): string => {
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

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gerenciar usuários do sistema e suas permissões
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/admin/users/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
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
                placeholder="Pesquisar usuários..."
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
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Todos os Perfis</option>
                <option value="user">Usuários</option>
                <option value="manager">Gerentes</option>
                <option value="admin">Administradores</option>
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
                    onClick={fetchUsers}
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
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando usuários...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <User className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {searchTerm || filterRole !== 'all'
                ? 'Tente ajustar seus filtros de pesquisa.'
                : 'Comece criando seu primeiro usuário.'}
            </p>
            <div className="mt-6">
              <Link
                to="/admin/users/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
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
                      Usuário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="h-10 w-10 object-cover" />
                            ) : (
                              <User size={20} className="text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || 'Sem nome'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <Mail size={14} className="mr-1" />
                          <span>{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' || user.role === 'superadmin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {translateRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin ? (
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>
                              {new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/admin/users/${user.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Visualizar"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/admin/users/${user.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>

                          {deleteConfirmation === user.id ? (
                            <>
                              <button
                                onClick={cancelDelete}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                title="Cancelar"
                              >
                                <X className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Confirmar exclusão"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                              disabled={user.role === 'superadmin'} // Não permitir excluir superadmin
                            >
                              <Trash className={`h-5 w-5 ${user.role === 'superadmin' ? 'opacity-50 cursor-not-allowed' : ''}`} />
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

export default UsersIndex;