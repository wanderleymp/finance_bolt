import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, User } from '../types';
import { mockUsers } from '../data/mockData';
import { permissions as rbacPermissions, roles as rbacRoles, userRoles as rbacUserRoles } from '../data/rbacMock';
import { Permission, Role, UserRole } from '../types/rbac';
import { supabase } from '../lib/supabase';
import { useUI } from './UIContext';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  permissions: string[];
  roles: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useUI();
  
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Função para buscar roles e permissões do usuário
  const resolveUserRBAC = (userId: string) => {
    // Busca todos os userRoles do usuário
    const rolesFound = rbacUserRoles.filter(ur => ur.userId === userId).map(ur => ur.roleId);
    setUserRoles(rolesFound);
    // Busca todas as permissões dos roles
    const perms = rolesFound
      .map(roleId => rbacRoles.find(r => r.id === roleId))
      .filter(Boolean)
      .flatMap(role => (role ? role.permissions : []));
    setUserPermissions(Array.from(new Set(perms)));
  };

  // Funções utilitárias
  const hasPermission = (permissionCode: string) => {
    return userPermissions.includes(permissionCode) || userRoles.includes('superadmin');
  };
  const hasRole = (roleId: string) => {
    return userRoles.includes(roleId);
  };


  useEffect(() => {
    // Verificar se há um usuário no localStorage ou sessionStorage
    const loadUserFromStorage = () => {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          console.log("Usuário carregado do armazenamento:", user);
          setState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null,
          });
          resolveUserRBAC(user.id);
        } catch (error) {
          console.error("Erro ao analisar usuário do armazenamento:", error);
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          setState(prev => ({ ...prev, loading: false }));
        }
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    
    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string, remember = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Adicionar super usuário aos mockUsers para permitir login
      const superUser: User = {
        id: 'super-admin',
        name: 'Super Admin',
        email: 'super@financeia.com.br',
        role: 'superadmin',
        lastLogin: new Date().toISOString(),
      };
      
      let user = mockUsers.find(u => u.email === email);
      
      // Verificar se é o super usuário
      if (email === 'super@financeia.com.br' && password === 'super123') {
        console.log("Login como super usuário");
        user = superUser;
      } else if (!user || password !== 'senha123') {
        console.log("Credenciais inválidas");
        throw new Error('Credenciais inválidas');
      }
      
      // Atualizar último login
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString(),
      };
      
      console.log("Login bem sucedido:", updatedUser);
      
      // Armazenar usuário no storage
      if (remember) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Exibir toast de sucesso
      addToast({
        title: 'Login realizado com sucesso',
        message: `Bem-vindo ${updatedUser.name}!`,
        type: 'success'
      });
      
      setState({
        isAuthenticated: true,
        user: updatedUser,
        loading: false,
        error: null,
      });
      resolveUserRBAC(updatedUser.id);
    } catch (error) {
      console.error("Erro no login:", error);
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login',
      });
      setUserPermissions([]);
      setUserRoles([]);
      
      // Exibir toast de erro
      addToast({
        title: 'Falha no login',
        message: error instanceof Error ? error.message : 'Credenciais inválidas',
        type: 'error'
      });
    }
  };

  const logout = async () => {
    // Fazer logout do Supabase
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao fazer logout do Supabase:', err);
    }
    
    // Limpar armazenamento local
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    localStorage.removeItem('selectedTenant');
    localStorage.removeItem('selectedCompany');
    localStorage.removeItem('lastTenantId');
    localStorage.removeItem('lastCompanyId');
    
    // Exibir toast de logout
    addToast({
      title: 'Logout realizado',
      message: 'Você saiu do sistema com sucesso',
      type: 'info'
    });
    
    setState({
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    });
    setUserPermissions([]);
    setUserRoles([]);
  };

  const register = async (name: string, email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se já existe usuário com este email
      const userExists = mockUsers.some(u => u.email === email);
      
      if (userExists) {
        throw new Error('Email já está em uso');
      }
      
      // Criar novo usuário (na vida real, seria feito pelo backend)
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role: 'user',
        lastLogin: new Date().toISOString(),
      };
      
      // Exibir toast de sucesso
      addToast({
        title: 'Conta criada com sucesso',
        message: 'Seu cadastro foi realizado. Bem-vindo ao sistema!',
        type: 'success'
      });
      
      setState({
        isAuthenticated: true,
        user: newUser,
        loading: false,
        error: null,
      });
      resolveUserRBAC(newUser.id);
      
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar',
      }));
      
      // Exibir toast de erro
      addToast({
        title: 'Erro no cadastro',
        message: error instanceof Error ? error.message : 'Não foi possível completar o cadastro',
        type: 'error'
      });
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Simulação de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Email não encontrado');
      }
      
      // Em uma aplicação real, enviaria um email com link para redefinir senha
      
      // Exibir toast de sucesso
      addToast({
        title: 'Instruções enviadas',
        message: 'Verifique seu email para redefinir sua senha',
        type: 'success'
      });
      
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao redefinir senha',
      }));
      
      // Exibir toast de erro
      addToast({
        title: 'Erro na redefinição de senha',
        message: error instanceof Error ? error.message : 'Não foi possível processar sua solicitação',
        type: 'error'
      });
    }
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    resetPassword,
    permissions: userPermissions,
    roles: userRoles,
    hasPermission,
    hasRole,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};