import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Star, StarOff, Building, LogOut, Calendar, Clock, ArrowLeft, ChevronRight } from 'lucide-react';

const CompanySelectPage: React.FC = () => {
  const { selectedTenant, companies, loading, error, selectCompany, toggleCompanyFavorite, fetchCompanies } = useTenant();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Carregar empresas ao montar o componente
  useEffect(() => {
    if (selectedTenant) {
      fetchCompanies(selectedTenant.id);
    } else {
      navigate('/select-tenant');
    }
  }, [selectedTenant, fetchCompanies, navigate]);

  const handleSelectCompany = (companyId: string) => {
    selectCompany(companyId);
    navigate('/');
  };

  const handleBackToTenants = () => {
    navigate('/select-tenant');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrar empresas por pesquisa
  const filteredCompanies = companies.filter((company) =>
    company.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar empresas: matriz primeiro, depois favoritos, depois por último acesso
  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    if (a.isHeadquarters && !b.isHeadquarters) return -1;
    if (!a.isHeadquarters && b.isHeadquarters) return 1;
    
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    
    // Se ambos são matriz/filial e favoritos/não favoritos, ordenar por último acesso
    if (a.lastAccess && b.lastAccess) {
      return new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime();
    }
    
    return 0;
  });

  // Agrupar empresas: matrizes primeiro, depois filiais agrupadas por sua matriz
  const groupedCompanies: Record<string, typeof companies> = {};
  
  // Primeiro, adicionar todas as matrizes
  sortedCompanies.forEach((company) => {
    if (company.isHeadquarters) {
      groupedCompanies[company.id] = [company];
    }
  });
  
  // Depois, adicionar filiais às suas respectivas matrizes
  sortedCompanies.forEach((company) => {
    if (!company.isHeadquarters && company.parentId) {
      if (groupedCompanies[company.parentId]) {
        groupedCompanies[company.parentId].push(company);
      } else {
        // Se a matriz não estiver no grupo (pode acontecer por causa do filtro), criar um grupo separado
        groupedCompanies[company.id] = [company];
      }
    } else if (!company.isHeadquarters && !company.parentId) {
      // Empresas sem matriz ou relação
      if (!groupedCompanies[company.id]) {
        groupedCompanies[company.id] = [company];
      }
    }
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
          <div className="flex space-x-4">
            <button
              onClick={handleBackToTenants}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowLeft size={16} className="mr-1" />
              Voltar
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-100 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogOut size={16} className="mr-1" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Selecione uma Empresa
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            {selectedTenant ? (
              <>Escolha uma empresa do tenant <strong>{selectedTenant.name}</strong> para acessar.</>
            ) : (
              'Escolha uma empresa para acessar.'
            )}
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
              placeholder="Buscar por nome, razão social ou CNPJ..."
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
          <div className="space-y-8">
            {Object.keys(groupedCompanies).length > 0 ? (
              Object.values(groupedCompanies).map((companyGroup, index) => (
                <div key={index} className="space-y-4">
                  {/* Matriz */}
                  {companyGroup[0].isHeadquarters && (
                    <div
                      key={companyGroup[0].id}
                      className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      onClick={() => handleSelectCompany(companyGroup[0].id)}
                    >
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompanyFavorite(companyGroup[0].id);
                          }}
                          className={`p-1 rounded-full ${
                            companyGroup[0].isFavorite
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                          }`}
                        >
                          {companyGroup[0].isFavorite ? <Star size={20} /> : <StarOff size={20} />}
                        </button>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {companyGroup[0].logo ? (
                              <img src={companyGroup[0].logo} alt={companyGroup[0].nomeFantasia} className="h-12 w-12 object-cover" />
                            ) : (
                              <Building size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {companyGroup[0].nomeFantasia}
                              </h3>
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                Matriz
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {companyGroup[0].razaoSocial}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              CNPJ: {companyGroup[0].cnpj}
                            </p>
                          </div>
                        </div>
                        
                        {companyGroup[0].lastAccess && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Clock size={16} className="mr-1.5" />
                            <span>
                              Último acesso em {new Date(companyGroup[0].lastAccess).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleSelectCompany(companyGroup[0].id)}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Selecionar Empresa
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Filiais (se houver) */}
                  {companyGroup.length > 1 && companyGroup[0].isHeadquarters && (
                    <div className="ml-8 space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                        <ChevronRight size={16} className="mr-1" />
                        Filiais
                      </h4>
                      
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {companyGroup.slice(1).map((company) => (
                          <div
                            key={company.id}
                            className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                            onClick={() => handleSelectCompany(company.id)}
                          >
                            <div className="absolute top-4 right-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompanyFavorite(company.id);
                                }}
                                className={`p-1 rounded-full ${
                                  company.isFavorite
                                    ? 'text-yellow-500 hover:text-yellow-600'
                                    : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                                }`}
                              >
                                {company.isFavorite ? <Star size={20} /> : <StarOff size={20} />}
                              </button>
                            </div>
                            
                            <div className="p-4">
                              <div className="flex items-center mb-3">
                                <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  {company.logo ? (
                                    <img src={company.logo} alt={company.nomeFantasia} className="h-10 w-10 object-cover" />
                                  ) : (
                                    <Building size={20} className="text-gray-400" />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                                    {company.nomeFantasia}
                                  </h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    CNPJ: {company.cnpj}
                                  </p>
                                </div>
                              </div>
                              
                              {company.lastAccess && (
                                <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Clock size={14} className="mr-1" />
                                  <span>
                                    Último acesso: {new Date(company.lastAccess).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => handleSelectCompany(company.id)}
                                className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Selecionar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Empresas que não são matriz */}
                  {!companyGroup[0].isHeadquarters && (
                    <div
                      key={companyGroup[0].id}
                      className="relative bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                      onClick={() => handleSelectCompany(companyGroup[0].id)}
                    >
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompanyFavorite(companyGroup[0].id);
                          }}
                          className={`p-1 rounded-full ${
                            companyGroup[0].isFavorite
                              ? 'text-yellow-500 hover:text-yellow-600'
                              : 'text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400'
                          }`}
                        >
                          {companyGroup[0].isFavorite ? <Star size={20} /> : <StarOff size={20} />}
                        </button>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            {companyGroup[0].logo ? (
                              <img src={companyGroup[0].logo} alt={companyGroup[0].nomeFantasia} className="h-12 w-12 object-cover" />
                            ) : (
                              <Building size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {companyGroup[0].nomeFantasia}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {companyGroup[0].razaoSocial}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              CNPJ: {companyGroup[0].cnpj}
                            </p>
                          </div>
                        </div>
                        
                        {companyGroup[0].lastAccess && (
                          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Clock size={16} className="mr-1.5" />
                            <span>
                              Último acesso em {new Date(companyGroup[0].lastAccess).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => handleSelectCompany(companyGroup[0].id)}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Selecionar Empresa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Building size={48} className="mb-4" />
                <p className="text-lg font-medium">Nenhuma empresa encontrada</p>
                <p className="mt-1">Tente ajustar sua pesquisa ou contate o administrador</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CompanySelectPage;