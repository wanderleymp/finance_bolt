import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Building, Mail, Phone, MapPin,
  AlertTriangle, CheckSquare, Globe, Database, Search
} from 'lucide-react';
import { Organization, Tenant } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const OrganizationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para seleção de tenant
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [showTenantSearch, setShowTenantSearch] = useState(false);
  
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    logo: string;
    isActive: boolean;
    contactEmail: string;
    contactPhone: string;
    address: string;
  }>({
    name: '',
    description: '',
    logo: '',
    isActive: true,
    contactEmail: '',
    contactPhone: '',
    address: ''
  });
  
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    contactEmail?: string;
    tenantId?: string;
  }>({});

  useEffect(() => {
    fetchTenants();
    
    if (mode === 'edit' && id) {
      fetchOrganizationData(id);
    }
  }, [mode, id]);

  // Buscar todos os tenants disponíveis
  const fetchTenants = async () => {
    try {
      setLoadingTenants(true);
      console.log('OrganizationForm: Carregando tenants...');
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('nome');
      
      if (error) {
        console.error('OrganizationForm: Erro ao buscar tenants:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        console.log(`OrganizationForm: ${data.length} tenants encontrados`);
        
        const formattedTenants: Tenant[] = data.map(tenant => ({
          id: tenant.id,
          name: tenant.nome,
          plan: tenant.plano as any,
          status: tenant.status,
          isActive: tenant.ativo,
          createdAt: tenant.createdAt,
          lastAccess: tenant.last_access,
        }));
        
        setTenants(formattedTenants);
        
        // Se só houver um tenant, selecioná-lo automaticamente
        if (formattedTenants.length === 1 && !selectedTenantId) {
          setSelectedTenantId(formattedTenants[0].id);
        }
      } else {
        console.log('OrganizationForm: Nenhum tenant encontrado');
        
        addToast({
          title: 'Atenção',
          message: 'Nenhum tenant encontrado. Crie um tenant primeiro.',
          type: 'warning'
        });
      }
    } catch (err) {
      console.error('OrganizationForm: Erro ao carregar tenants:', err);
      
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os tenants disponíveis.',
        type: 'error'
      });
    } finally {
      setLoadingTenants(false);
    }
  };

  const fetchOrganizationData = async (orgId: string) => {
    try {
      setLoading(true);
      console.log('OrganizationForm: Buscando dados da organização:', orgId);
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (error) {
        console.error('OrganizationForm: Erro ao buscar dados da organização:', error);
        throw error;
      }
      
      if (data) {
        console.log('OrganizationForm: Dados da organização encontrados:', data);
        setFormData({
          name: data.name,
          description: data.description || '',
          logo: data.logo || '',
          isActive: data.is_active,
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || '',
          address: data.address || ''
        });
        
        // Definir o tenant_id da organização
        setSelectedTenantId(data.tenant_id);
      }
    } catch (err) {
      console.error('OrganizationForm: Erro ao buscar dados da organização:', err);
      setError('Não foi possível carregar os dados da organização. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da organização',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: {
      name?: string;
      contactEmail?: string;
      tenantId?: string;
    } = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Email inválido';
    }
    
    if (!selectedTenantId) {
      errors.tenantId = 'Tenant é obrigatório';
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
      console.log('OrganizationForm: Iniciando salvamento da organização...');
      
      if (mode === 'create') {
        // Criar nova organização
        console.log('OrganizationForm: Criando nova organização:', formData);
        console.log('OrganizationForm: Tenant selecionado:', selectedTenantId);
        
        const { data, error } = await supabase
          .from('organizations')
          .insert([{
            tenant_id: selectedTenantId,
            name: formData.name,
            description: formData.description || null,
            logo: formData.logo || null,
            is_active: formData.isActive,
            contact_email: formData.contactEmail || null,
            contact_phone: formData.contactPhone || null,
            address: formData.address || null
          }])
          .select()
          .single();
        
        if (error) {
          console.error('OrganizationForm: Erro ao criar organização:', error);
          throw error;
        }
        
        console.log('OrganizationForm: Organização criada com sucesso:', data);
        
        setSuccess('Organização criada com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Organização criada com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/organizations'), 1500);
      } else if (mode === 'edit' && id) {
        // Atualizar organização existente
        console.log('OrganizationForm: Atualizando organização existente:', formData);
        
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            description: formData.description || null,
            logo: formData.logo || null,
            is_active: formData.isActive,
            contact_email: formData.contactEmail || null,
            contact_phone: formData.contactPhone || null,
            address: formData.address || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (error) {
          console.error('OrganizationForm: Erro ao atualizar organização:', error);
          throw error;
        }
        
        console.log('OrganizationForm: Organização atualizada com sucesso');
        
        setSuccess('Organização atualizada com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Organização atualizada com sucesso!',
          type: 'success'
        });
        
        setTimeout(() => navigate('/admin/organizations'), 1500);
      }
    } catch (err: any) {
      console.error('OrganizationForm: Erro ao salvar organização:', err);
      setError(err.message || 'Ocorreu um erro ao salvar a organização. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: err.message || 'Falha ao salvar a organização',
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

  const handleTenantSelect = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowTenantSearch(false);
    setTenantSearchTerm('');
    
    // Limpar erro de tenant
    if (formErrors.tenantId) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated.tenantId;
        return updated;
      });
    }
  };

  // Filtrar tenants baseado na busca
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase())
  );

  // Encontrar o tenant selecionado
  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/organizations')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Nova Organização' : 'Editar Organização'}
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

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tenant Selector */}
          <div className="mb-6">
            <label htmlFor="tenant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Database className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={selectedTenant ? selectedTenant.name : 'Selecione um tenant...'}
                  onClick={() => mode === 'create' && setShowTenantSearch(!showTenantSearch)}
                  className={`w-full pl-10 pr-10 py-2 cursor-pointer border ${
                    formErrors.tenantId ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  disabled={mode === 'edit'} // Desabilitar edição de tenant
                />
                {mode === 'create' && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <ChevronLeft size={18} className={`transform transition-transform ${showTenantSearch ? 'rotate-90' : '-rotate-90'} text-gray-400`} />
                  </div>
                )}
              </div>
              
              {/* Dropdown de busca de tenants */}
              {showTenantSearch && mode === 'create' && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <div className="p-2 border-b border-gray-300 dark:border-gray-600">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar tenant..."
                        value={tenantSearchTerm}
                        onChange={(e) => setTenantSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {loadingTenants ? (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500 mr-2"></div>
                        Carregando tenants...
                      </div>
                    ) : filteredTenants.length > 0 ? (
                      filteredTenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            selectedTenantId === tenant.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                          }`}
                          onClick={() => handleTenantSelect(tenant.id)}
                        >
                          <div className="flex items-center">
                            <Database size={16} className="mr-2 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {tenant.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {tenant.status} • {tenant.plan}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Nenhum tenant encontrado
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {formErrors.tenantId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.tenantId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
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
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de Contato
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className={`w-full pl-10 px-4 py-2 border ${formErrors.contactEmail ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                />
              </div>
              {formErrors.contactEmail && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.contactEmail}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone de Contato
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="logo"
                  name="logo"
                  value={formData.logo}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Breve descrição da organização..."
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Endereço
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Endereço completo da organização"
                />
              </div>
            </div>

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
                Organização ativa
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/organizations')}
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
              {loading ? 'Salvando...' : 'Salvar Organização'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationForm;