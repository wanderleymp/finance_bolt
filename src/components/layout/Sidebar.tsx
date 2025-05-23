import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useUI } from '../../contexts/UIContext';
import { useTenant } from '../../contexts/TenantContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  FileText, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  CreditCard,
  User,
  Mail,
  ChevronLeft,
  Building,
  Database,
  Server
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useUI();
  const { selectedTenant, selectedCompany } = useTenant();
  const { logout, user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Fechar o sidebar em telas pequenas quando o componente montar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && sidebarOpen) {
        toggleSidebar();
      }
    };
    
    handleResize(); // Executar imediatamente
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen, toggleSidebar]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    // Pequeno delay para evitar que o menu feche imediatamente
    // quando o mouse sai momentaneamente
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const expanded = sidebarOpen || isHovered;

  // Verificar se o usuário é super admin (aceita 'admin', 'superadmin', ou email específico)
  const isSuperAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.email === 'super@financeia.com.br';
  
  console.log("Sidebar - Usuário:", user);
  console.log("Sidebar - isSuperAdmin:", isSuperAdmin);

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          expanded ? 'w-64' : 'w-16'
        } ${sidebarOpen ? 'translate-x-0' : 'translate-x-0'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {expanded ? (
            <>
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">F</span>
                </div>
                <h2 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">
                  Finance AI
                </h2>
              </div>
              <button
                onClick={toggleSidebar}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white md:hidden"
              >
                <ChevronLeft size={20} />
              </button>
            </>
          ) : (
            <div className="flex-shrink-0 w-8 h-8 mx-auto bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
          )}
        </div>

        {/* Tenant/Company Info */}
        {expanded && selectedTenant && selectedCompany && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {selectedCompany.logo ? (
                  <img src={selectedCompany.logo} alt={selectedCompany.nomeFantasia} className="w-full h-full object-cover" />
                ) : (
                  <Building size={20} className="text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedCompany.nomeFantasia}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedTenant.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="mt-4 px-2 overflow-y-auto">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Dashboard"
          >
            <LayoutDashboard size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/financeiro"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Financeiro"
          >
            <CreditCard size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Financeiro</span>}
          </NavLink>

          <NavLink
            to="/documentos"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Documentos"
          >
            <FileText size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Documentos</span>}
          </NavLink>

          <NavLink
            to="/tarefas"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Tarefas"
          >
            <CheckSquare size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Tarefas</span>}
          </NavLink>

          <NavLink
            to="/relatorios"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Relatórios"
          >
            <BarChart3 size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Relatórios</span>}
          </NavLink>

          <NavLink
            to="/contatos"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Contatos"
          >
            <Users size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Contatos</span>}
          </NavLink>

          <NavLink
            to="/mensagens"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Mensagens"
          >
            <Mail size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Mensagens</span>}
          </NavLink>

          {/* Link para o Módulo SaaS Admin - apenas para super admins */}
          {isSuperAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
              title="SaaS Admin"
            >
              <Server size={20} />
              {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">SaaS Admin</span>}
            </NavLink>
          )}

          <hr className="my-4 border-gray-200 dark:border-gray-700" />

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Perfil"
          >
            <User size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Perfil</span>}
          </NavLink>

          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `flex items-center px-4 py-2 mt-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            title="Configurações"
          >
            <Settings size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Configurações</span>}
          </NavLink>

          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 mt-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
            {expanded && <span className="ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out">Sair</span>}
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;