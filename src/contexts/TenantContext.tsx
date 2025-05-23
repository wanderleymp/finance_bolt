import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantState, Tenant, Company } from '../types';
import { useAuth } from './AuthContext';
import { mockTenants, mockCompanies } from '../data/mockData';

interface TenantContextType extends TenantState {
  selectTenant: (tenantId: string) => void;
  selectCompany: (companyId: string) => void;
  toggleTenantFavorite: (tenantId: string) => void;
  toggleCompanyFavorite: (companyId: string) => void;
  fetchTenants: () => Promise<void>;
  fetchCompanies: (tenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  const [state, setState] = useState<TenantState>({
    selectedTenant: null,
    selectedCompany: null,
    tenants: [],
    companies: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Carregar tenants independentemente de haver seleção prévia
      fetchTenants();
      
      // Tentar carregar seleção armazenada
      const storedTenant = localStorage.getItem('selectedTenant');
      const storedCompany = localStorage.getItem('selectedCompany');
      
      if (storedTenant) {
        try {
          const tenant = JSON.parse(storedTenant);
          setState((prev) => ({ ...prev, selectedTenant: tenant }));
          
          // Salvar o ID do último tenant usado
          localStorage.setItem('lastTenantId', tenant.id);
          
          // Carregar empresas deste tenant
          fetchCompanies(tenant.id);
          
          if (storedCompany) {
            const company = JSON.parse(storedCompany);
            setState((prev) => ({ ...prev, selectedCompany: company }));
            
            // Salvar o ID da última empresa usada
            localStorage.setItem('lastCompanyId', company.id);
          }
        } catch (error) {
          localStorage.removeItem('selectedTenant');
          localStorage.removeItem('selectedCompany');
        }
      }
    } else {
      // Limpar estado quando não estiver autenticado
      setState({
        selectedTenant: null,
        selectedCompany: null,
        tenants: [],
        companies: [],
        loading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  const fetchTenants = async () => {
    if (!isAuthenticated) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulação de API
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Dados mockados
      const tenants = mockTenants;
      
      setState((prev) => ({
        ...prev,
        tenants,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar tenants',
      }));
    }
  };

  const fetchCompanies = async (tenantId: string) => {
    if (!isAuthenticated || !tenantId) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulação de API
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Filtrando empresas pelo tenantId
      const companies = mockCompanies.filter((company) => company.tenantId === tenantId);
      
      setState((prev) => ({
        ...prev,
        companies,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar empresas',
      }));
    }
  };

  const selectTenant = (tenantId: string) => {
    const tenant = state.tenants.find((t) => t.id === tenantId);
    
    if (tenant) {
      // Atualizar último acesso
      const updatedTenant = {
        ...tenant,
        lastAccess: new Date().toISOString(),
      };
      
      setState((prev) => ({
        ...prev,
        selectedTenant: updatedTenant,
      }));
      
      localStorage.setItem('selectedTenant', JSON.stringify(updatedTenant));
      localStorage.setItem('lastTenantId', tenant.id);
      
      // Carregar empresas deste tenant
      fetchCompanies(tenantId);
    }
  };

  const selectCompany = (companyId: string) => {
    const company = state.companies.find((c) => c.id === companyId);
    
    if (company) {
      // Atualizar último acesso
      const updatedCompany = {
        ...company,
        lastAccess: new Date().toISOString(),
      };
      
      setState((prev) => ({
        ...prev,
        selectedCompany: updatedCompany,
      }));
      
      localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
      localStorage.setItem('lastCompanyId', company.id);
    }
  };

  const toggleTenantFavorite = (tenantId: string) => {
    setState((prev) => ({
      ...prev,
      tenants: prev.tenants.map((tenant) =>
        tenant.id === tenantId
          ? { ...tenant, isFavorite: !tenant.isFavorite }
          : tenant
      ),
    }));
    
    // Se o tenant selecionado for marcado/desmarcado como favorito
    if (state.selectedTenant?.id === tenantId) {
      const updatedTenant = {
        ...state.selectedTenant,
        isFavorite: !state.selectedTenant.isFavorite,
      };
      setState((prev) => ({ ...prev, selectedTenant: updatedTenant }));
      localStorage.setItem('selectedTenant', JSON.stringify(updatedTenant));
    }
  };

  const toggleCompanyFavorite = (companyId: string) => {
    setState((prev) => ({
      ...prev,
      companies: prev.companies.map((company) =>
        company.id === companyId
          ? { ...company, isFavorite: !company.isFavorite }
          : company
      ),
    }));
    
    // Se a empresa selecionada for marcada/desmarcada como favorita
    if (state.selectedCompany?.id === companyId) {
      const updatedCompany = {
        ...state.selectedCompany,
        isFavorite: !state.selectedCompany.isFavorite,
      };
      setState((prev) => ({ ...prev, selectedCompany: updatedCompany }));
      localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
    }
  };

  const value = {
    ...state,
    selectTenant,
    selectCompany,
    toggleTenantFavorite,
    toggleCompanyFavorite,
    fetchTenants,
    fetchCompanies,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};