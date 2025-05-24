import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { useUI } from '../contexts/UIContext';

// Layout
import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import TenantSelectPage from '../pages/auth/TenantSelectPage';
import CompanySelectPage from '../pages/auth/CompanySelectPage';

// Main Pages
import DashboardPage from '../pages/DashboardPage';
import FinancialPage from '../pages/financial/FinancialPage';
import TransactionsPage from '../pages/financial/TransactionsPage';
import DocumentsPage from '../pages/documents/DocumentsPage';
import TasksPage from '../pages/tasks/TasksPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import TenantsIndex from '../pages/admin/Tenants/TenantsIndex';
import TenantDetail from '../pages/admin/Tenants/TenantDetail';
import NewTenant from '../pages/admin/Tenants/NewTenant';
import EditTenant from '../pages/admin/Tenants/EditTenant';
import PlansIndex from '../pages/admin/Plans/PlansIndex';
import NewPlan from '../pages/admin/Plans/NewPlan';
import EditPlan from '../pages/admin/Plans/EditPlan';
import ModulesIndex from '../pages/admin/Modules/ModulesIndex';
import NewModule from '../pages/admin/Modules/NewModule';
import EditModule from '../pages/admin/Modules/EditModule';
import OrganizationsIndex from '../pages/admin/Organizations/OrganizationsIndex';
import NewOrganization from '../pages/admin/Organizations/NewOrganization';
import EditOrganization from '../pages/admin/Organizations/EditOrganization';
import OrganizationDetail from '../pages/admin/Organizations/OrganizationDetail';
import UsersIndex from '../pages/admin/Users/UsersIndex';
import NewUser from '../pages/admin/Users/NewUser';
import EditUser from '../pages/admin/Users/EditUser';
import UserDetail from '../pages/admin/Users/UserDetail';
import AuditLogsIndex from '../pages/admin/AuditLogs/AuditLogsIndex';

// Credentials & Storage Pages
import SystemCredentialsIndex from '../pages/admin/Credentials/SystemCredentialsIndex';
import NewSystemCredential from '../pages/admin/Credentials/NewSystemCredential';
import EditSystemCredential from '../pages/admin/Credentials/EditSystemCredential';
import SystemCredentialDetail from '../pages/admin/Credentials/SystemCredentialDetail';
import TenantCredentialsIndex from '../pages/admin/Credentials/TenantCredentialsIndex';
import StorageConfigsIndex from '../pages/admin/Storage/StorageConfigsIndex';
import NewStorageConfig from '../pages/admin/Storage/NewStorageConfig';
import EditStorageConfig from '../pages/admin/Storage/EditStorageConfig';
import StorageConfigDetail from '../pages/admin/Storage/StorageConfigDetail';
import ModuleStorageMappingsIndex from '../pages/admin/Storage/ModuleStorageMappingsIndex';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { tenants, companies, selectTenant, selectCompany } = useTenant();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para rastrear se já mostrou a mensagem
  const [redirectMessageShown, setRedirectMessageShown] = React.useState(false);
  
  useEffect(() => {
    // Se não estiver autenticado e não estiver carregando, redirecionar para login
    if (!isAuthenticated && !loading) {
      console.log("ProtectedRoute: Usuário não autenticado, redirecionando para login");
      
      if (!redirectMessageShown) {
        addToast({
          title: 'Login necessário',
          message: 'Você precisa estar logado para acessar esta página',
          type: 'info'
        });
        setRedirectMessageShown(true);
      }
      
      navigate('/login', { 
        state: { redirectTo: location.pathname },
        replace: true
      });
      return;
    }

    // Selecionar tenant/company automaticamente apenas se ainda não estiver selecionado
    if (
      isAuthenticated &&
      user &&
      tenants.length > 0 &&
      (!user.tenantId || !tenants.some(t => t.id === user.tenantId))
    ) {
      const savedTenantId = localStorage.getItem('lastTenantId');
      const tenantToSelect = savedTenantId 
        ? tenants.find(t => t.id === savedTenantId) || tenants[0]
        : tenants[0];
      selectTenant(tenantToSelect.id);

      const tenantCompanies = companies.filter(c => c.tenantId === tenantToSelect.id);
      if (
        tenantCompanies.length > 0 &&
        (!user.companyId || !tenantCompanies.some(c => c.id === user.companyId))
      ) {
        const savedCompanyId = localStorage.getItem('lastCompanyId');
        const companyToSelect = savedCompanyId 
          ? tenantCompanies.find(c => c.id === savedCompanyId) || tenantCompanies[0]
          : tenantCompanies[0];
        selectCompany(companyToSelect.id);
      }
    }
  }, [isAuthenticated, loading, user, tenants, companies, navigate, location.pathname, addToast, redirectMessageShown]); // Removido selectTenant e selectCompany das dependências para evitar loop

  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return null; // O redirecionamento já foi feito no useEffect
  }
  
  return <>{children}</>;
};

// Admin Route Wrapper - apenas verifica autenticação, a verificação de admin é feita pelo AdminRedirect
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estado para rastrear se já mostrou a mensagem
  const [redirectMessageShown, setRedirectMessageShown] = React.useState(false);
  
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      console.log("AdminRoute: Usuário não autenticado, redirecionando para login");
      
      if (!redirectMessageShown) {
        addToast({
          title: 'Login necessário',
          message: 'Você precisa estar logado para acessar esta página',
          type: 'info'
        });
        setRedirectMessageShown(true);
      }
      
      navigate('/login', { 
        state: { redirectTo: location.pathname },
        replace: true
      });
    }
  }, [isAuthenticated, loading, navigate, location.pathname, addToast, redirectMessageShown]);
  
  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }
  
  if (!isAuthenticated) {
    return null; // O redirecionamento já foi feito no useEffect
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Routes - acessíveis para todos */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      {/* Rotas para seleção de tenant/empresa - precisam de autenticação */}
      <Route path="/select-tenant" element={
        <ProtectedRoute>
          <TenantSelectPage />
        </ProtectedRoute>
      } />
      <Route path="/select-company" element={
        <ProtectedRoute>
          <CompanySelectPage />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - AdminRedirect cuida da verificação de permissões */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<TenantsIndex />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="tenants/new" element={<NewTenant />} />
        <Route path="tenants/:id/edit" element={<EditTenant />} />
        <Route path="plans" element={<PlansIndex />} />
        <Route path="plans/new" element={<NewPlan />} />
        <Route path="plans/:id/edit" element={<EditPlan />} />
        <Route path="modules" element={<ModulesIndex />} />
        <Route path="modules/new" element={<NewModule />} />
        <Route path="modules/:id/edit" element={<EditModule />} />
        <Route path="organizations" element={<OrganizationsIndex />} />
        <Route path="organizations/new" element={<NewOrganization />} />
        <Route path="organizations/:id" element={<OrganizationDetail />} />
        <Route path="organizations/:id/edit" element={<EditOrganization />} />
        <Route path="users" element={<UsersIndex />} />
        <Route path="users/new" element={<NewUser />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="users/:id/edit" element={<EditUser />} />
        <Route path="audit-logs" element={<AuditLogsIndex />} />
        
        {/* Rotas para gerenciamento de credenciais e armazenamento */}
        <Route path="credentials" element={<SystemCredentialsIndex />} />
        <Route path="credentials/new" element={<NewSystemCredential />} />
        <Route path="credentials/:id" element={<SystemCredentialDetail />} />
        <Route path="credentials/:id/edit" element={<EditSystemCredential />} />
        <Route path="tenants/:tenantId/credentials" element={<TenantCredentialsIndex />} />
        <Route path="storage" element={<StorageConfigsIndex />} />
        <Route path="storage/new" element={<NewStorageConfig />} />
        <Route path="storage/:id" element={<StorageConfigDetail />} />
        <Route path="storage/:id/edit" element={<EditStorageConfig />} />
        <Route path="storage/mappings" element={<ModuleStorageMappingsIndex />} />
      </Route>

      {/* Main App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="financeiro" element={<FinancialPage />} />
        <Route path="financeiro/transacoes" element={<TransactionsPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="tarefas" element={<TasksPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;