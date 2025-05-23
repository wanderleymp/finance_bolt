import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Star, StarOff, Building, LogOut, Calendar, Clock } from 'lucide-react';

const TenantSelectPage: React.FC = () => {
  const { tenants, loading, error, fetchTenants, selectTenant, toggleTenantFavorite } = useTenant();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carregar tenants ao montar o componente
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSelectTenant = (tenantId: string) => {
    selectTenant(tenantId);
    navigate('/select-company');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrar tenants por pesquisa
  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar tenants: favoritos primeiro, depois por último acesso
  const sortedTenants = [...filteredTenants].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Se ambos são favoritos ou não favoritos, ordenar por último acesso
    if (a.lastAccess && b.lastAccess) {
      return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime();
    }
    
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
              Finance AI
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-100 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogOut size={16} className="mr-1" />
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Selecione um Tenant
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Escolha o tenant que deseja acessar. Cada tenant pode conter múltiplas empresas.
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Buscar tenants..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                onClick={() => handleSelectTenant(tenant.id)}
              >
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTenantFavorite(tenant.id);
                    }}
                    className={`p-1 rounded-full ${
                      tenant.isFavorite
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                    }`}
                  >
                    {tenant.isFavorite ? <Star size={20} /> : <StarOff size={20} />}
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {tenant.logo ? (
                        <img src={tenant.logo} alt={tenant.name} className="h-12 w-12 object-cover" />
                      ) : (
                        <Building size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {tenant.name}
                      </h3>
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
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={16} className="mr-1.5" />
                    <span>
                      Criado em {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {tenant.lastAccess && (
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock size={16} className="mr-1.5" />
                      <span>
                        Último acesso em {new Date(tenant.lastAccess).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleSelectTenant(tenant.id)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Selecionar Tenant
                  </button>
                </div>
              </div>
            ))}
            
            {sortedTenants.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Building size={48} className="mb-4" />
                <p className="text-lg font-medium">Nenhum tenant encontrado</p>
                <p className="mt-1">Tente ajustar sua pesquisa ou contate o administrador</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TenantSelectPage;