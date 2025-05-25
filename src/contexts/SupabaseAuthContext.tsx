import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthState } from '../types';
import { useUI } from './UIContext';

interface SupabaseAuthContextType extends AuthState {
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  permissions: string[];
  roles: string[];
  hasPermission: (permissionCode: string) => boolean;
  hasRole: (roleId: string) => boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth deve ser usado dentro de um SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useUI();
  
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });

  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  // Função para buscar roles e permissões do usuário no Supabase
  const resolveUserRBAC = async (userId: string) => {
    // Buscar roles do usuário
    const { data: userRolesData, error: userRolesError } = await supabase
      .from('user_roles')
      .select('role_id, role:roles(id, name, description, is_system, role_permissions(permission_id, permission:permissions(code)))')
      .eq('user_id', userId);
    if (userRolesError) {
      setUserRoles([]);
      setUserPermissions([]);
      return;
    }
    // Extrair roles
    const rolesFound = userRolesData.map((ur: any) => ur.role_id);
    setUserRoles(rolesFound);
    // Extrair permissões
    const perms = userRolesData
      .flatMap((ur: any) => ur.role.role_permissions?.map((rp: any) => rp.permission?.code) || [])
      .filter(Boolean);
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
    // Verificar sessão atual
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleAuthChange(event, session);
      }
    );

    // Carregar sessão inicial
    const loadSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        const userData = await fetchUserProfile(session.user);
        setState({
          isAuthenticated: true,
          user: userData,
          loading: false,
          error: null,
        });
        if (userData?.id) await resolveUserRBAC(userData.id);
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error?.message || null,
        });
        setUserPermissions([]);
        setUserRoles([]);
      }
    };

    loadSession();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Buscar perfil do usuário no banco
  const fetchUserProfile = async (authUser: User) => {
    // Buscar os dados do usuário da tabela 'users'
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar perfil do usuário:', error);
      // Se não encontrar o perfil, criar um com dados básicos
      const newUserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: (authUser.user_metadata?.name as string) || authUser.email?.split('@')[0] || '',
        avatar: undefined,
        role: 'user' as 'user',
        lastLogin: new Date().toISOString(),
      };



      await supabase.from('users').insert([{
        ...newUserProfile,
        last_login: newUserProfile.lastLogin,
      }]);
      return newUserProfile;
    }

    // Atualizar último login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authUser.id);

    // Garantir que role seja válida
    let validRole: 'admin' | 'manager' | 'user' | 'superadmin' = 'user';
    if (['admin', 'manager', 'user', 'superadmin'].includes(data.role)) {
      validRole = data.role;
    }
    return {
      id: data.id,
      name: data.name ?? '',
      email: data.email,
      avatar: data.avatar_url ?? undefined,
      role: validRole,
      lastLogin: data.last_login,
    };
  };

  const handleAuthChange = async (event: string, session: Session | null) => {
    if (event === 'SIGNED_IN' && session) {
      const userData = await fetchUserProfile(session.user);
      setState({
        isAuthenticated: true,
        user: userData,
        loading: false,
        error: null,
      });
      if (userData?.id) await resolveUserRBAC(userData.id);
      
      addToast({
        title: 'Login bem-sucedido',
        message: 'Bem-vindo de volta ao Finance AI.',
        type: 'success',
      });
    } else if (event === 'SIGNED_OUT') {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      
      addToast({
        title: 'Logout realizado',
        message: 'Você saiu do sistema com sucesso.',
        type: 'info',
      });
    }
  };

  const signIn = async (email: string, password: string, remember = false) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      if (data.user) {
        const userData = await fetchUserProfile(data.user);
        setState({
          isAuthenticated: true,
          user: userData,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: (error as AuthError).message || 'Falha ao fazer login',
      });
      setUserPermissions([]);
      setUserRoles([]);
      
      addToast({
        title: 'Erro ao fazer login',
        message: (error as AuthError).message || 'Credenciais inválidas',
        type: 'error',
      });
    }
  };

  const signOut = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      
      addToast({
        title: 'Erro ao sair',
        message: error.message,
        type: 'error',
      });
    } else {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      
      // Limpar localStorage e sessionStorage
      localStorage.removeItem('selectedTenant');
      localStorage.removeItem('selectedCompany');
      localStorage.removeItem('lastTenantId');
      localStorage.removeItem('lastCompanyId');
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });
      
      if (error) throw error;

      if (data.user) {
        // Criar perfil do usuário
        await supabase.from('users').insert([
          {
            id: data.user.id,
            email: email,
            name: name,
            role: 'user',
            last_login: new Date().toISOString(),
          },
        ]);

        // Note: O usuário ainda não estará autenticado imediatamente após o registro
        // já que o Supabase, por padrão, requer confirmação de email
        setState({
          isAuthenticated: false, // Mudará para true após confirmação de email e login
          user: null,
          loading: false,
          error: null,
        });
        
        addToast({
          title: 'Cadastro realizado',
          message: 'Sua conta foi criada com sucesso! Faça login para continuar.',
          type: 'success',
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: (error as AuthError).message || 'Falha ao registrar',
      });
      
      addToast({
        title: 'Erro no cadastro',
        message: (error as AuthError).message || 'Ocorreu um erro ao criar sua conta',
        type: 'error',
      });
    }
  };

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setState((prev) => ({ ...prev, loading: false }));
      
      addToast({
        title: 'Email enviado',
        message: 'Instruções para redefinição de senha foram enviadas para o seu email',
        type: 'success',
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (error as AuthError).message || 'Falha ao redefinir senha',
      }));
      
      addToast({
        title: 'Erro ao enviar email',
        message: (error as AuthError).message || 'Não foi possível enviar o email de redefinição',
        type: 'error',
      });
    }
  };

  const value = {
    ...state,
    login: signIn,
    logout: signOut,
    register: signUp,
    resetPassword,
    permissions: userPermissions,
    roles: userRoles,
    hasPermission,
    hasRole,
  };


  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};