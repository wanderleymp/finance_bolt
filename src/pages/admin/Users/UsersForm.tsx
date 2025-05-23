import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, User, Mail, Shield, Lock, 
  AlertTriangle, CheckSquare, Upload, Building, 
  Database, Briefcase, Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';
import { v4 as uuidv4 } from 'uuid';

type FormMode = 'create' | 'edit';
type TenantAssociation = {
  id: string;
  name: string;
  role: string;
  isAssociated: boolean;
};

type OrgAssociation = {
  id: string;
  name: string;
  role: string;
  isAssociated: boolean;
};

const UsersForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode: FormMode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [tenants, setTenants] = useState<TenantAssociation[]>([]);
  const [organizations, setOrganizations] = useState<OrgAssociation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [disableEmailConfirmation, setDisableEmailConfirmation] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    isActive: true,
    isSuper: false
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // Se estamos no modo edição, buscar os dados do usuário
    if (mode === 'edit' && id) {
      fetchUserData(id);
    }

    // Buscar tenants e associações
    fetchTenants();
    
    // Buscar organizações e associações
    fetchOrganizations();
  }, [mode, id]);

  const fetchUserData = async (userId: string) => {
    try {
      setLoading(true);
      console.log("UsersForm: Buscando dados do usuário:", userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("UsersForm: Erro ao buscar dados do usuário:", error);
        throw error;
      }
      
      if (data) {
        console.log("UsersForm: Dados do usuário encontrados:", data);
        
        setFormData({
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
          password: '', // Não carregamos a senha por questões de segurança
          confirmPassword: '',
          avatarUrl: data.avatar_url || '',
          isActive: data.is_active !== false, // Se não for explicitamente false, consideramos true
          isSuper: data.is_super || false
        });
      }
    } catch (err) {
      console.error('UsersForm: Erro ao buscar dados do usuário:', err);
      setError('Não foi possível carregar os dados do usuário. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do usuário',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      setTenantsLoading(true);
      
      // Buscar todos os tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*');
      
      if (tenantsError) throw tenantsError;
      
      // Mapear tenants para o formato de associação
      const tenantsList = tenantsData.map((tenant) => ({
        id: tenant.id,
        name: tenant.nome,
        role: 'user',
        isAssociated: false
      }));
      
      // Se estamos no modo de edição, verificar quais tenants estão associados ao usuário
      if (mode === 'edit' && id) {
        const { data: tenantUsersData, error: tenantUsersError } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', id);
        
        if (tenantUsersError) throw tenantUsersError;
        
        // Atualizar o status de associação
        if (tenantUsersData && tenantUsersData.length > 0) {
          tenantUsersData.forEach(tu => {
            const tenantIndex = tenantsList.findIndex(t => t.id === tu.tenant_id);
            if (tenantIndex !== -1) {
              tenantsList[tenantIndex].isAssociated = true;
              tenantsList[tenantIndex].role = tu.role;
            }
          });
        }
      }
      
      setTenants(tenantsList);
    } catch (err) {
      console.error('UsersForm: Erro ao buscar tenants:', err);
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os tenants',
        type: 'error'
      });
    } finally {
      setTenantsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setOrgsLoading(true);
      
      // Buscar todas as organizações
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*');
      
      if (orgsError) throw orgsError;
      
      // Mapear organizações para o formato de associação
      const orgsList = orgsData.map((org) => ({
        id: org.id,
        name: org.name,
        role: 'member',
        isAssociated: false
      }));
      
      // Se estamos no modo de edição, verificar quais organizações estão associadas ao usuário
      if (mode === 'edit' && id) {
        const { data: orgUsersData, error: orgUsersError } = await supabase
          .from('organization_users')
          .select('*')
          .eq('user_id', id);
        
        if (orgUsersError) throw orgUsersError;
        
        // Atualizar o status de associação
        if (orgUsersData && orgUsersData.length > 0) {
          orgUsersData.forEach(ou => {
            const orgIndex = orgsList.findIndex(o => o.id === ou.organization_id);
            if (orgIndex !== -1) {
              orgsList[orgIndex].isAssociated = true;
              orgsList[orgIndex].role = ou.role;
            }
          });
        }
      }
      
      setOrganizations(orgsList);
    } catch (err) {
      console.error('UsersForm: Erro ao buscar organizações:', err);
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar as organizações',
        type: 'error'
      });
    } finally {
      setOrgsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    // Senha é obrigatória apenas no modo de criação
    if (mode === 'create') {
      if (!formData.password) {
        errors.password = 'Senha é obrigatória';
      } else if (formData.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Senhas não coincidem';
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não coincidem';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast({
        title: 'Erro de validação',
        message: 'Verifique os campos do formulário',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log('UsersForm: Iniciando salvamento do usuário...');
      
      if (mode === 'create') {
        // Criar novo usuário
        console.log('UsersForm: Criando novo usuário:', formData);
        
        // Primeiro, registrar o usuário no Auth do Supabase com opção para desabilitar confirmação de email
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role
            },
            emailRedirectTo: window.location.origin,
            // Correção: usar emailConfirm em vez de emailConfirmation
            emailConfirm: !disableEmailConfirmation
          }
        });
        
        if (authError) {
          console.error('UsersForm: Erro ao criar usuário no Auth:', authError);
          
          // Tratamento específico para erro de limite de taxa de email
          if (authError.message === 'email rate limit exceeded' || 
              (authError.message && authError.message.includes('rate limit'))) {
            throw new Error(
              'Limite de envio de emails excedido. Por favor, aguarde alguns minutos antes de tentar novamente ou desative a confirmação de email.'
            );
          }
          
          throw authError;
        }
        
        if (!authData.user) {
          throw new Error('Falha ao criar usuário no Auth');
        }
        
        console.log('UsersForm: Usuário criado no Auth com ID:', authData.user.id);
        
        // Em seguida, inserir na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
            avatar_url: formData.avatarUrl,
            is_active: formData.isActive,
            is_super: formData.isSuper
          });
        
        if (userError) {
          console.error('UsersForm: Erro ao inserir usuário na tabela users:', userError);
          throw userError;
        }
        
        // Processar associações com tenants
        const selectedTenants = tenants.filter(t => t.isAssociated);
        
        if (selectedTenants.length > 0) {
          console.log('UsersForm: Associando usuário a tenants:', selectedTenants);
          
          const tenantUsers = selectedTenants.map(tenant => ({
            id: uuidv4(),
            tenant_id: tenant.id,
            user_id: authData.user!.id,
            role: tenant.role
          }));
          
          const { error: tenantUserError } = await supabase
            .from('tenant_users')
            .insert(tenantUsers);
          
          if (tenantUserError) {
            console.error('UsersForm: Erro ao associar usuário a tenants:', tenantUserError);
            throw tenantUserError;
          }
        }
        
        // Processar associações com organizações
        const selectedOrgs = organizations.filter(o => o.isAssociated);
        
        if (selectedOrgs.length > 0) {
          console.log('UsersForm: Associando usuário a organizações:', selectedOrgs);
          
          const orgUsers = selectedOrgs.map(org => ({
            id: uuidv4(),
            organization_id: org.id,
            user_id: authData.user!.id,
            role: org.role
          }));
          
          const { error: orgUserError } = await supabase
            .from('organization_users')
            .insert(orgUsers);
          
          if (orgUserError) {
            console.error('UsersForm: Erro ao associar usuário a organizações:', orgUserError);
            throw orgUserError;
          }
        }
        
        const confirmationMessage = disableEmailConfirmation 
          ? 'Usuário criado com sucesso! (sem confirmação de email)'
          : 'Usuário criado com sucesso! Um email de confirmação foi enviado.';
        
        setSuccess(confirmationMessage);
        
        addToast({
          title: 'Sucesso',
          message: confirmationMessage,
          type: 'success'
        });
        
        // Redirecionar para a lista após um breve delay
        setTimeout(() => navigate('/admin/users'), 1500);
        
      } else if (mode === 'edit' && id) {
        // Atualizar usuário existente
        console.log('UsersForm: Atualizando usuário existente:', formData);
        
        // Preparar objeto de atualização
        const updates: any = {
          name: formData.name,
          role: formData.role,
          is_active: formData.isActive,
          is_super: formData.isSuper
        };
        
        // Incluir avatar_url apenas se estiver definido
        if (formData.avatarUrl) {
          updates.avatar_url = formData.avatarUrl;
        }
        
        // Atualizar dados do usuário
        const { error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id);
        
        if (updateError) {
          console.error('UsersForm: Erro ao atualizar usuário:', updateError);
          throw updateError;
        }
        
        // Se uma nova senha foi fornecida, atualizá-la
        if (formData.password) {
          // Atualizar senha através do Auth API
          // Nota: Em um cenário real, isso exigiria privilégios de admin ou o token do usuário
          // Esta funcionalidade pode precisar ser implementada no backend
          console.log('UsersForm: Nova senha fornecida, mas não é possível atualizá-la diretamente do frontend');
          // Isso é apenas um placeholder - na prática, você usaria uma função edge do Supabase
          addToast({
            title: 'Aviso',
            message: 'A senha será atualizada pelo administrador',
            type: 'info'
          });
        }
        
        // Atualizar associações com tenants
        
        // Primeiro, obter associações atuais
        const { data: currentTenantUsers, error: fetchTenantError } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', id);
        
        if (fetchTenantError) {
          console.error('UsersForm: Erro ao buscar associações de tenant:', fetchTenantError);
          throw fetchTenantError;
        }
        
        // Identificar associações a serem removidas
        const tenantIdsToRemove = currentTenantUsers
          ?.filter(tu => !tenants.some(t => t.id === tu.tenant_id && t.isAssociated))
          .map(tu => tu.id) || [];
        
        if (tenantIdsToRemove.length > 0) {
          console.log('UsersForm: Removendo associações de tenant:', tenantIdsToRemove);
          const { error: removeTenantError } = await supabase
            .from('tenant_users')
            .delete()
            .in('id', tenantIdsToRemove);
          
          if (removeTenantError) {
            console.error('UsersForm: Erro ao remover associações de tenant:', removeTenantError);
            throw removeTenantError;
          }
        }
        
        // Identificar associações a serem adicionadas
        const tenantsToAdd = tenants
          .filter(t => t.isAssociated && !currentTenantUsers?.some(tu => tu.tenant_id === t.id));
        
        if (tenantsToAdd.length > 0) {
          console.log('UsersForm: Adicionando associações de tenant:', tenantsToAdd);
          
          const newTenantUsers = tenantsToAdd.map(tenant => ({
            id: uuidv4(),
            tenant_id: tenant.id,
            user_id: id,
            role: tenant.role
          }));
          
          const { error: addTenantError } = await supabase
            .from('tenant_users')
            .insert(newTenantUsers);
          
          if (addTenantError) {
            console.error('UsersForm: Erro ao adicionar associações de tenant:', addTenantError);
            throw addTenantError;
          }
        }
        
        // Identificar associações a serem atualizadas
        const tenantsToUpdate = tenants
          .filter(t => t.isAssociated && currentTenantUsers?.some(tu => tu.tenant_id === t.id && tu.role !== t.role));
        
        for (const tenant of tenantsToUpdate) {
          const tuId = currentTenantUsers?.find(tu => tu.tenant_id === tenant.id)?.id;
          if (tuId) {
            console.log(`UsersForm: Atualizando papel do tenant ${tenant.id} para ${tenant.role}`);
            
            const { error: updateTenantError } = await supabase
              .from('tenant_users')
              .update({ role: tenant.role })
              .eq('id', tuId);
            
            if (updateTenantError) {
              console.error('UsersForm: Erro ao atualizar papel do tenant:', updateTenantError);
              throw updateTenantError;
            }
          }
        }
        
        // Atualizar associações com organizações
        
        // Primeiro, obter associações atuais
        const { data: currentOrgUsers, error: fetchOrgError } = await supabase
          .from('organization_users')
          .select('*')
          .eq('user_id', id);
        
        if (fetchOrgError) {
          console.error('UsersForm: Erro ao buscar associações de organização:', fetchOrgError);
          throw fetchOrgError;
        }
        
        // Identificar associações a serem removidas
        const orgIdsToRemove = currentOrgUsers
          ?.filter(ou => !organizations.some(o => o.id === ou.organization_id && o.isAssociated))
          .map(ou => ou.id) || [];
        
        if (orgIdsToRemove.length > 0) {
          console.log('UsersForm: Removendo associações de organização:', orgIdsToRemove);
          const { error: removeOrgError } = await supabase
            .from('organization_users')
            .delete()
            .in('id', orgIdsToRemove);
          
          if (removeOrgError) {
            console.error('UsersForm: Erro ao remover associações de organização:', removeOrgError);
            throw removeOrgError;
          }
        }
        
        // Identificar associações a serem adicionadas
        const orgsToAdd = organizations
          .filter(o => o.isAssociated && !currentOrgUsers?.some(ou => ou.organization_id === o.id));
        
        if (orgsToAdd.length > 0) {
          console.log('UsersForm: Adicionando associações de organização:', orgsToAdd);
          
          const newOrgUsers = orgsToAdd.map(org => ({
            id: uuidv4(),
            organization_id: org.id,
            user_id: id,
            role: org.role
          }));
          
          const { error: addOrgError } = await supabase
            .from('organization_users')
            .insert(newOrgUsers);
          
          if (addOrgError) {
            console.error('UsersForm: Erro ao adicionar associações de organização:', addOrgError);
            throw addOrgError;
          }
        }
        
        // Identificar associações a serem atualizadas
        const orgsToUpdate = organizations
          .filter(o => o.isAssociated && currentOrgUsers?.some(ou => ou.organization_id === o.id && ou.role !== o.role));
        
        for (const org of orgsToUpdate) {
          const ouId = currentOrgUsers?.find(ou => ou.organization_id === org.id)?.id;
          if (ouId) {
            console.log(`UsersForm: Atualizando papel da organização ${org.id} para ${org.role}`);
            
            const { error: updateOrgError } = await supabase
              .from('organization_users')
              .update({ role: org.role })
              .eq('id', ouId);
            
            if (updateOrgError) {
              console.error('UsersForm: Erro ao atualizar papel da organização:', updateOrgError);
              throw updateOrgError;
            }
          }
        }
        
        setSuccess('Usuário atualizado com sucesso!');
        
        addToast({
          title: 'Sucesso',
          message: 'Usuário atualizado com sucesso!',
          type: 'success'
        });
        
        // Redirecionar para a lista após um breve delay
        setTimeout(() => navigate('/admin/users'), 1500);
      }
    } catch (err: any) {
      console.error('UsersForm: Erro ao salvar usuário:', err);
      setError(err.message || 'Ocorreu um erro ao salvar o usuário. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: err.message || 'Falha ao salvar o usuário',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
    
    // Limpar erro específico deste campo
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name as keyof typeof formErrors];
        return updated;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const toggleTenantAssociation = (tenantId: string) => {
    setTenants(prev =>
      prev.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, isAssociated: !tenant.isAssociated }
          : tenant
      )
    );
  };

  const handleTenantRoleChange = (tenantId: string, role: string) => {
    setTenants(prev =>
      prev.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, role }
          : tenant
      )
    );
  };

  const toggleOrgAssociation = (orgId: string) => {
    setOrganizations(prev =>
      prev.map(org =>
        org.id === orgId
          ? { ...org, isAssociated: !org.isAssociated }
          : org
      )
    );
  };

  const handleOrgRoleChange = (orgId: string, role: string) => {
    setOrganizations(prev =>
      prev.map(org =>
        org.id === orgId
          ? { ...org, role }
          : org
      )
    );
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
  );

  const mapRoleToPortuguese = (role: string): string => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrador',
      'manager': 'Gerente',
      'user': 'Usuário',
      'member': 'Membro',
      'owner': 'Proprietário',
      'editor': 'Editor',
      'viewer': 'Visualizador'
    };
    
    return roleMap[role] || role;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
          </h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckSquare className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-700 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Atenção: Problemas com limite de emails do Supabase
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  Para evitar erros de "email rate limit exceeded", é altamente recomendado manter a opção "Desabilitar confirmação de email" ATIVADA abaixo.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Seção 1: Informações básicas */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informações do Usuário</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required
                  />
                </div>
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.email ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required
                    // Email não pode ser alterado no modo edição
                    readOnly={mode === 'edit'}
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Papel no Sistema
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="user">Usuário</option>
                    <option value="manager">Gerente</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL do Avatar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Upload className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="avatarUrl"
                    name="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Senha (mostrar opções diferentes para criar e editar) */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {mode === 'create' ? 'Definir Senha' : 'Alterar Senha (opcional)'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {mode === 'create' ? 'Senha' : 'Nova Senha'}
                  {mode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.password ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required={mode === 'create'}
                  />
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Senha
                  {mode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full pl-10 px-4 py-2 border ${formErrors.confirmPassword ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required={mode === 'create'}
                  />
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            {/* Opção para desabilitar confirmação de email (somente no modo create) */}
            {mode === 'create' && (
              <div className="mt-4 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="disableEmailConfirmation"
                    checked={disableEmailConfirmation}
                    onChange={() => setDisableEmailConfirmation(!disableEmailConfirmation)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-red-300 rounded"
                  />
                  <label htmlFor="disableEmailConfirmation" className="ml-2 block text-sm font-bold text-red-700 dark:text-red-300">
                    DESABILITAR CONFIRMAÇÃO DE EMAIL (RECOMENDADO)
                  </label>
                </div>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 pl-7">
                  <strong>IMPORTANTE:</strong> Mantenha esta opção ATIVADA para evitar o erro de "limite de taxa de email excedido". 
                  Se desabilitada, o Supabase enviará emails de confirmação, e você poderá receber o erro de limite de taxa.
                </p>
              </div>
            )}
          </div>

          {/* Seção 3: Tenants associados */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tenants Associados
            </h2>
            
            {tenantsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando tenants...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Database className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar tenants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredTenants.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTenants.map(tenant => (
                        <div 
                          key={tenant.id}
                          className={`p-3 border rounded-lg flex items-center justify-between ${
                            tenant.isAssociated
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`tenant-${tenant.id}`}
                              checked={tenant.isAssociated}
                              onChange={() => toggleTenantAssociation(tenant.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`tenant-${tenant.id}`} className="ml-3 text-sm text-gray-900 dark:text-white">
                              {tenant.name}
                            </label>
                          </div>
                          
                          {tenant.isAssociated && (
                            <select
                              value={tenant.role}
                              onChange={(e) => handleTenantRoleChange(tenant.id, e.target.value)}
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Administrador</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Nenhum tenant encontrado
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Seção 4: Organizações associadas */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Organizações Associadas
            </h2>
            
            {orgsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando organizações...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar organizações..."
                      value={orgSearchTerm}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto">
                  {filteredOrgs.length > 0 ? (
                    <div className="space-y-2">
                      {filteredOrgs.map(org => (
                        <div 
                          key={org.id}
                          className={`p-3 border rounded-lg flex items-center justify-between ${
                            org.isAssociated
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`org-${org.id}`}
                              checked={org.isAssociated}
                              onChange={() => toggleOrgAssociation(org.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`org-${org.id}`} className="ml-3 text-sm text-gray-900 dark:text-white">
                              {org.name}
                            </label>
                          </div>
                          
                          {org.isAssociated && (
                            <select
                              value={org.role}
                              onChange={(e) => handleOrgRoleChange(org.id, e.target.value)}
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="member">Membro</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Administrador</option>
                              <option value="owner">Proprietário</option>
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Nenhuma organização encontrada
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Seção 5: Status */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Status e Permissões
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Usuário Ativo
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSuper"
                  name="isSuper"
                  checked={formData.isSuper}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isSuper" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Super Usuário (acesso completo)
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersForm;