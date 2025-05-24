import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, Settings, BarChart2, 
  Server, Database, Shield, Building, Menu, ChevronLeft, BrainCircuit,
  ChevronRight, Activity, Calendar, LogOut, Key, HardDrive
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';

const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();

  const adminLinks = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/admin/tenants', icon: <Database size={20} />, label: 'Tenants' },
    { path: '/admin/organizations', icon: <Building size={20} />, label: 'Organizações' },
    { path: '/admin/plans', icon: <Package size={20} />, label: 'Planos' },
    { path: '/admin/modules', icon: <Server size={20} />, label: 'Módulos' },
    { path: '/admin/users', icon: <Users size={20} />, label: 'Usuários' },
    { path: '/admin/audit-logs', icon: <Activity size={20} />, label: 'Logs de Auditoria' },
    { path: '/admin/llm', icon: <BrainCircuit size={20} />, label: 'LLM Manager' },
    { path: '/admin/reports', icon: <BarChart2 size={20} />, label: 'Relatórios' },
    { path: '/admin/subscriptions', icon: <Calendar size={20} />, label: 'Assinaturas' },
    { path: '/admin/credentials', icon: <Key size={20} />, label: 'Credenciais' },
    { path: '/admin/storage', icon: <HardDrive size={20} />, label: 'Armazenamento' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Configurações' },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-indigo-700 dark:bg-indigo-900 transition-all duration-300 ease-in-out ${
          sidebarExpanded ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-600 dark:border-indigo-800">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 bg-white rounded-md flex items-center justify-center">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className={`ml-2 text-white font-semibold transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                Painel Admin
              </h2>
            </div>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="text-indigo-300 hover:text-white"
            >
              {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`${
                    location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
                      ? 'bg-indigo-800 dark:bg-indigo-950 text-white'
                      : 'text-indigo-100 hover:bg-indigo-600 dark:hover:bg-indigo-800'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <div className="mr-3 flex-shrink-0">{link.icon}</div>
                  <span className={`${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-opacity duration-300`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-indigo-600 dark:border-indigo-800 p-4 mt-auto">
              <button
                onClick={logout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-indigo-100 rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-800 group transition-colors"
              >
                <LogOut size={20} className="mr-3 flex-shrink-0" />
                <span className={`${sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'} transition-opacity duration-300`}>
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-64' : 'ml-16'}`}>
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;