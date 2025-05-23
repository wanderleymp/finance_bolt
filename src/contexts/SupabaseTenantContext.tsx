import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantState, Tenant, Company } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface SupabaseTenantContextType extends TenantState {
  selectTenant: (tenantId: string) => void;
  selectCompany: (companyId: string) => void;
  toggleTenantFavorite: (tenantId: string) => void;
  toggleCompanyFavorite: (companyId: string) => void;
  fetchTenants: () => Promise<void>;
  fetchCompanies: (tenantId: string) => Promise<void>;
}

const SupabaseTenantContext = createContext<SupabaseTenantContextType | undefined>(undefined);

export const useSupabaseTenant = () => {
  const context = useContext(SupabaseTenantContext);
  if (!context) {
    throw new Error('useSupabaseTenant deve ser usado dentro de um SupabaseTenantProvider');
  }
  return context;
};

export const SupabaseTenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
  const [state, setState] = useState<TenantState>({
    selectedTenant: null,
    selectedCompany: null,
    tenants: [],
    companies: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      // Carregar dados do localStorage
      const storedTenant = localStorage.getItem('selectedTenant');
      const storedCompany = localStorage.getItem('selectedCompany');
      
      if (storedTenant) {
        try {
          const tenant = JSON.parse(storedTenant);
          setState((prev) => ({ ...prev, selectedTenant: tenant }));
          fetchCompanies(tenant.id);
          
          if (storedCompany) {
            const company = JSON.parse(storedCompany);
            setState((prev) => ({ ...prev, selectedCompany: company }));
          }
        } catch (error) {
          localStorage.removeItem('selectedTenant');
          localStorage.removeItem('selectedCompany');
        }
      } else {
        fetchTenants();
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
  }, [isAuthenticated, user]);

  const fetchTenants = async () => {
    if (!isAuthenticated || !user) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Buscar tenants aos quais o usuário tem acesso
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          tenant:tenants (
            id, 
            name, 
            plan, 
            logo, 
            created_at, 
            is_active, 
            is_favorite, 
            last_access
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Transformar o resultado no formato correto
      const tenants: Tenant[] = data.map(item => ({
        id: item.tenant.id,
        name: item.tenant.name,
        plan: item.tenant.plan,
        logo: item.tenant.logo || undefined,
        createdAt: item.tenant.created_at,
        isActive: item.tenant.is_active,
        isFavorite: item.tenant.is_favorite || false,
        lastAccess: item.tenant.last_access || undefined,
      }));
      
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
    if (!isAuthenticated || !user || !tenantId) return;
    
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      // Buscar empresas do tenant
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;

      // Transformar o resultado no formato correto
      const companies: Company[] = data.map(item => ({
        id: item.id,
        tenantId: item.tenant_id,
        cnpj: item.cnpj,
        razaoSocial: item.razao_social,
        nomeFantasia: item.nome_fantasia,
        isHeadquarters: item.is_headquarters,
        parentId: item.parent_id || undefined,
        logo: item.logo || undefined,
        isFavorite: item.is_favorite || false,
        lastAccess: item.last_access || undefined,
      }));
      
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
      
      // Atualizar no Supabase
      supabase
        .from('tenants')
        .update({ last_access: updatedTenant.lastAccess })
        .eq('id', tenantId)
        .then(() => {
          setState((prev) => ({
            ...prev,
            selectedTenant: updatedTenant,
            selectedCompany: null,
          }));
          
          localStorage.setItem('selectedTenant', JSON.stringify(updatedTenant));
          localStorage.removeItem('selectedCompany');
          
          // Carregar empresas deste tenant
          fetchCompanies(tenantId);
        })
        .catch(console.error);
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
      
      // Atualizar no Supabase
      supabase
        .from('companies')
        .update({ last_access: updatedCompany.lastAccess })
        .eq('id', companyId)
        .then(() => {
          setState((prev) => ({
            ...prev,
            selectedCompany: updatedCompany,
          }));
          
          localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
        })
        .catch(console.error);
    }
  };

  const toggleTenantFavorite = (tenantId: string) => {
    const tenant = state.tenants.find((t) => t.id === tenantId);
    
    if (tenant) {
      const isFavorite = !tenant.isFavorite;
      
      // Atualizar no Supabase
      supabase
        .from('tenants')
        .update({ is_favorite: isFavorite })
        .eq('id', tenantId)
        .then(() => {
          setState((prev) => ({
            ...prev,
            tenants: prev.tenants.map((t) =>
              t.id === tenantId
                ? { ...t, isFavorite }
                : t
            ),
          }));
          
          // Se o tenant selecionado for marcado/desmarcado como favorito
          if (state.selectedTenant?.id === tenantId) {
            const updatedTenant = {
              ...state.selectedTenant,
              isFavorite,
            };
            setState((prev) => ({ ...prev, selectedTenant: updatedTenant }));
            localStorage.setItem('selectedTenant', JSON.stringify(updatedTenant));
          }
        })
        .catch(console.error);
    }
  };

  const toggleCompanyFavorite = (companyId: string) => {
    const company = state.companies.find((c) => c.id === companyId);
    
    if (company) {
      const isFavorite = !company.isFavorite;
      
      // Atualizar no Supabase
      supabase
        .from('companies')
        .update({ is_favorite: isFavorite })
        .eq('id', companyId)
        .then(() => {
          setState((prev) => ({
            ...prev,
            companies: prev.companies.map((c) =>
              c.id === companyId
                ? { ...c, isFavorite }
                : c
            ),
          }));
          
          // Se a empresa selecionada for marcada/desmarcada como favorita
          if (state.selectedCompany?.id === companyId) {
            const updatedCompany = {
              ...state.selectedCompany,
              isFavorite,
            };
            setState((prev) => ({ ...prev, selectedCompany: updatedCompany }));
            localStorage.setItem('selectedCompany', JSON.stringify(updatedCompany));
          }
        })
        .catch(console.error);
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

  return <SupabaseTenantContext.Provider value={value}>{children}</SupabaseTenantContext.Provider>;
};