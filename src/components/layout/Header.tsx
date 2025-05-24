import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useUI } from '../../contexts/UIContext';
import { 
  Menu, 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  User, 
  Settings, 
  LogOut, 
  MessageSquare,
  Database,
  Building,
  ChevronDown,
  X
} from 'lucide-react';
import { mockNotifications } from '../../data/mockData';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedTenant, selectedCompany, selectTenant } = useTenant();
  const { toggleSidebar, toggleAIAssistant, toggleEnhancedAIAssistant, darkMode, toggleDarkMode } = useUI();
  const navigate = useNavigate();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tenantsOpen, setTenantsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const tenantsMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      
      if (tenantsMenuRef.current && !tenantsMenuRef.current.contains(event.target as Node)) {
        setTenantsOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitchTenant = () => {
    navigate('/select-tenant');
  };

  const handleSwitchCompany = () => {
    navigate('/select-company');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          
          {/* Breadcrumbs - simplificado */}
          <div className="hidden md:flex ml-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Dashboard</span>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="hidden md:block max-w-md relative" ref={searchRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-white border-0 rounded-md focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600"
              placeholder="Pesquisar..."
              onClick={() => setSearchOpen(true)}
            />
          </div>
          
          {searchOpen && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2">
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                Digite para pesquisar...
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile search button */}
        <button 
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search size={20} />
        </button>
        
        {/* Mobile search dropdown */}
        {searchOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 md:hidden z-50" ref={searchRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-white border-0 rounded-md focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-600"
                placeholder="Pesquisar..."
                autoFocus
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                onClick={() => setSearchOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        
        {/* Right side */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          {/* Tenant/Company Selector */}
          <div className="relative" ref={tenantsMenuRef}>
            <button
              onClick={() => setTenantsOpen(!tenantsOpen)}
              className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title={selectedCompany?.nomeFantasia || 'Selecionar Empresa'}
            >
              <span className="hidden md:block mr-1 max-w-[100px] truncate">
                {selectedCompany?.nomeFantasia || 'Selecionar Empresa'}
              </span>
              <Building size={16} className="md:mr-1" />
              <ChevronDown size={14} className="hidden sm:block" />
            </button>
            
            {tenantsOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 z-50">
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  Empresa Atual
                </div>
                {selectedCompany && (
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium">{selectedCompany.nomeFantasia}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedCompany.cnpj}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleSwitchCompany}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Trocar Empresa
                </button>
                <button
                  onClick={handleSwitchTenant}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Trocar Tenant
                </button>
              </div>
            )}
          </div>
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* AI Assistant */}
          <button
            onClick={toggleAIAssistant}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Assistente AI"
          >
            <MessageSquare size={20} />
          </button>

          {/* Enhanced AI Assistant with CRUD */}
          <button
            onClick={toggleEnhancedAIAssistant}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Assistente AI com CRUD"
          >
            <Database size={20} />
          </button>
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none relative p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Notificações"
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50">
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notificações</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-500' :
                          notification.type === 'error' ? 'bg-red-100 text-red-500' :
                          notification.type === 'success' ? 'bg-green-100 text-green-500' :
                          'bg-blue-100 text-blue-500'
                        }`}>
                          <Bell size={16} />
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 text-center">
                  <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                    Ver todas
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title={user?.name || 'Usuário'}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <span className="hidden md:block ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || 'Usuário'}
              </span>
            </button>
            
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  {user?.email}
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/perfil');
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User size={16} className="mr-2" />
                  Perfil
                </button>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/configuracoes');
                  }}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings size={16} className="mr-2" />
                  Configurações
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} className="mr-2" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;