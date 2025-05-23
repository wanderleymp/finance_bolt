import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, X, ChevronLeft, Key, AlertTriangle, CheckSquare,
  ExternalLink, Eye, EyeOff, HelpCircle, Package, Cloud, 
  Mail, Database, MessageCircle, FileText, Scale, Settings,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { CredentialProvider } from '../../../types';
import { useUI } from '../../../contexts/UIContext';

interface FieldConfig {
  type: string;
  label: string;
  required: boolean;
  default?: any;
  options?: any[];
  help?: string;
}

const SystemCredentialForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const mode = id ? 'edit' : 'create';
  const { addToast } = useUI();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para o formulário
  const [providers, setProviders] = useState<CredentialProvider[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: '',
    authType: '',
    expiresAt: '',
    isActive: true,
    credentials: {} as Record<string, any>
  });
  
  // Estados para controle de UI
  const [selectedProvider, setSelectedProvider] = useState<CredentialProvider | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [formStep, setFormStep] = useState<number>(1); // 1: Provedor, 2: Tipo de Auth, 3: Detalhes

  // Primeiro carrega os provedores
  useEffect(() => {
    fetchProviders();
  }, []);

  // Depois carrega os dados da credencial (se for edição)
  useEffect(() => {
    // Buscar dados da credencial SOMENTE após os provedores serem carregados
    if (mode === 'edit' && id && providersLoaded) {
      console.log("SystemCredentialForm: Provedores carregados, buscando dados da credencial para edição");
      fetchCredentialData(id);
    }
  }, [mode, id, providersLoaded]);

  // Buscar provedores disponíveis
  const fetchProviders = async () => {
    try {
      console.log('SystemCredentialForm: Buscando provedores...');
      
      const { data, error } = await supabase
        .from('credential_providers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('SystemCredentialForm: Erro ao buscar provedores:', error);
        throw error;
      }
      
      if (data) {
        const formattedProviders: CredentialProvider[] = data.map(provider => ({
          code: provider.code,
          name: provider.name,
          description: provider.description || '',
          icon: provider.icon || '',
          authTypes: provider.auth_types,
          fields: provider.fields,
          helpUrl: provider.help_url,
          isActive: provider.is_active
        }));
        
        setProviders(formattedProviders);
        setProvidersLoaded(true);
        console.log('SystemCredentialForm: Provedores carregados:', formattedProviders);
      }
    } catch (err) {
      console.error('SystemCredentialForm: Erro ao carregar provedores:', err);
      
      addToast({
        title: 'Erro',
        message: 'Não foi possível carregar os provedores de credenciais',
        type: 'error'
      });
    }
  };

  // Buscar dados da credencial para edição
  const fetchCredentialData = async (credentialId: string) => {
    try {
      setLoading(true);
      console.log('SystemCredentialForm: Buscando dados da credencial:', credentialId);
      
      const { data, error } = await supabase
        .from('system_credentials')
        .select('*')
        .eq('id', credentialId)
        .single();
      
      if (error) {
        console.error('SystemCredentialForm: Erro ao buscar credencial:', error);
        throw error;
      }
      
      if (data) {
        console.log('SystemCredentialForm: Credencial encontrada:', data);
        
        // Primeiro encontrar o provedor
        const provider = providers.find(p => p.code === data.provider);
        if (!provider) {
          console.error('SystemCredentialForm: Provedor não encontrado:', data.provider);
          throw new Error(`Provedor "${data.provider}" não encontrado`);
        }

        // Definir o provedor selecionado
        setSelectedProvider(provider);
        
        // Atualizar estado do formulário
        setFormData({
          name: data.name,
          description: data.description || '',
          provider: data.provider,
          authType: data.auth_type,
          expiresAt: data.expires_at ? new Date(data.expires_at).toISOString().substring(0, 10) : '',
          isActive: data.is_active,
          credentials: data.credentials || {}
        });
        
        console.log("SystemCredentialForm: Dados carregados com sucesso:", {
          name: data.name,
          description: data.description || '',
          provider: data.provider,
          authType: data.auth_type,
          expiresAt: data.expires_at ? new Date(data.expires_at).toISOString().substring(0, 10) : '',
          isActive: data.is_active,
          credentials: data.credentials || {}
        });
        
        // Ir direto para o passo 3 (formulário de detalhes)
        setFormStep(3);
      }
    } catch (err) {
      console.error('SystemCredentialForm: Erro ao buscar dados da credencial:', err);
      setError('Não foi possível carregar os dados da credencial. Por favor, tente novamente.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da credencial',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Selecionar provedor
  const selectProvider = (providerCode: string) => {
    const provider = providers.find(p => p.code === providerCode);
    
    if (provider) {
      setSelectedProvider(provider);
      setFormData(prev => ({
        ...prev,
        provider: providerCode,
        authType: provider.authTypes.length === 1 ? provider.authTypes[0] : '',
        credentials: {}
      }));
      
      // Se só tiver um tipo de autenticação, pula para o próximo passo
      if (provider.authTypes.length === 1) {
        setFormStep(3);
      } else {
        setFormStep(2); // Ir para seleção de tipo de autenticação
      }
    }
  };

  // Selecionar tipo de autenticação
  const selectAuthType = (authType: string) => {
    setFormData(prev => ({
      ...prev,
      authType,
      credentials: {}
    }));
    
    setFormStep(3); // Ir para o formulário de detalhes
  };

  // Voltar para o passo anterior
  const goBack = () => {
    if (formStep > 1) {
      setFormStep(prev => prev - 1);
    }
  };

  // Alternar visibilidade de campo sensível
  const toggleFieldVisibility = (fieldName: string) => {
    setHiddenFields(prev => 
      prev.includes(fieldName)
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validar campos básicos
    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.provider) {
      errors.provider = 'Selecione um provedor';
    }
    
    if (!formData.authType) {
      errors.authType = 'Selecione um tipo de autenticação';
    }
    
    // Validar campos específicos do provedor e tipo de autenticação
    if (selectedProvider && formData.authType) {
      const fields = selectedProvider.fields[formData.authType];
      
      for (const [key, config] of Object.entries(fields)) {
        const fieldConfig = config as FieldConfig;
        
        if (fieldConfig.required && !formData.credentials[key]) {
          errors[`credentials.${key}`] = `${fieldConfig.label} é obrigatório`;
        }
        
        // Validações específicas por tipo
        if (formData.credentials[key]) {
          if (fieldConfig.type === 'email' && !/\S+@\S+\.\S+/.test(formData.credentials[key])) {
            errors[`credentials.${key}`] = 'Email inválido';
          }
          
          if (fieldConfig.type === 'number' && isNaN(Number(formData.credentials[key]))) {
            errors[`credentials.${key}`] = 'Valor numérico inválido';
          }
        }
      }
    }
    
    // Validar data de expiração
    if (formData.expiresAt) {
      const expiryDate = new Date(formData.expiresAt);
      const now = new Date();
      
      if (expiryDate < now) {
        errors.expiresAt = 'A data de expiração não pode estar no passado';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Salvar credencial
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
      // Preparar os dados para salvar
      const credentialData = {
        name: formData.name,
        description: formData.description || null,
        provider: formData.provider,
        auth_type: formData.authType,
        credentials: formData.credentials,
        is_active: formData.isActive,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        updated_at: new Date().toISOString()
      };
      
      if (mode === 'create') {
        // Criar nova credencial
        const { data, error } = await supabase
          .from('system_credentials')
          .insert([credentialData])
          .select()
          .single();
        
        if (error) throw error;
        
        console.log('Credencial criada com sucesso:', data);
        
        setSuccess('Credencial criada com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Credencial criada com sucesso!',
          type: 'success'
        });
        
        // Redirecionar para a página de detalhes
        setTimeout(() => navigate(`/admin/credentials/${data.id}`), 1500);
      } else if (id) {
        // Atualizar credencial existente
        const { error } = await supabase
          .from('system_credentials')
          .update(credentialData)
          .eq('id', id);
        
        if (error) throw error;
        
        console.log('Credencial atualizada com sucesso');
        
        setSuccess('Credencial atualizada com sucesso!');
        addToast({
          title: 'Sucesso',
          message: 'Credencial atualizada com sucesso!',
          type: 'success'
        });
        
        // Redirecionar para a página de detalhes
        setTimeout(() => navigate(`/admin/credentials/${id}`), 1500);
      }
    } catch (err) {
      console.error('Erro ao salvar credencial:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a credencial');
      
      addToast({
        title: 'Erro',
        message: err instanceof Error ? err.message : 'Falha ao salvar credencial',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar valor de campo
  const updateCredentialField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [field]: value
      }
    }));
    
    // Limpar erro específico deste campo
    if (formErrors[`credentials.${field}`]) {
      setFormErrors(prev => {
        const { [`credentials.${field}`]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Helper function to get a Lucide icon by name
  const getLucideIcon = (iconName: string) => {
    if (!iconName) return <Key size={20} />;
    
    // Map of available icons
    const iconMap: Record<string, JSX.Element> = {
      'key': <Key size={20} />,
      'mail': <Mail size={20} />,
      'database': <Database size={20} />,
      'cloud': <Cloud size={20} />,
      'package': <Package size={20} />,
      'message-circle': <MessageCircle size={20} />,
      'file-text': <FileText size={20} />,
      'scale': <Scale size={20} />,
      'settings': <Settings size={20} />,
      'check': <Check size={20} />
    };
    
    // Return the icon if it exists in our map, otherwise return Key icon as default
    return iconMap[iconName] || <Key size={20} />;
  };

  // Renderizar campos de formulário com base no provedor e tipo de autenticação
  const renderCredentialFields = () => {
    if (!selectedProvider || !formData.authType) {
      return null;
    }
    
    const authFields = selectedProvider.fields[formData.authType];
    if (!authFields) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
          <p className="text-yellow-600 dark:text-yellow-400">
            Tipo de autenticação não configurado para este provedor
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {Object.entries(authFields).map(([fieldName, config]) => {
          const fieldConfig = config as FieldConfig;
          const isHidden = hiddenFields.includes(fieldName);
          const fieldError = formErrors[`credentials.${fieldName}`];
          
          // Renderizar campo com base no tipo
          if (fieldConfig.type === 'password') {
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={isHidden ? 'password' : 'text'}
                    value={formData.credentials[fieldName] || ''}
                    onChange={(e) => updateCredentialField(fieldName, e.target.value)}
                    className={`w-full pr-10 px-4 py-2 border ${
                      fieldError ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required={fieldConfig.required}
                  />
                  <button
                    type="button"
                    onClick={() => toggleFieldVisibility(fieldName)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {isHidden ? (
                      <EyeOff size={16} className="text-gray-400" />
                    ) : (
                      <Eye size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
                {fieldConfig.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldConfig.help}</p>
                )}
              </div>
            );
          } else if (fieldConfig.type === 'select') {
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.credentials[fieldName] || (fieldConfig.default || '')}
                  onChange={(e) => updateCredentialField(fieldName, e.target.value)}
                  className={`w-full px-4 py-2 border ${
                    fieldError ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required={fieldConfig.required}
                >
                  <option value="">Selecione...</option>
                  {fieldConfig.options?.map((option: any) => (
                    <option key={option.value || option} value={option.value || option}>
                      {option.label || option}
                    </option>
                  ))}
                </select>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
                {fieldConfig.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldConfig.help}</p>
                )}
              </div>
            );
          } else if (fieldConfig.type === 'textarea') {
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.credentials[fieldName] || ''}
                  onChange={(e) => updateCredentialField(fieldName, e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-2 border ${
                    fieldError ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required={fieldConfig.required}
                ></textarea>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
                {fieldConfig.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldConfig.help}</p>
                )}
              </div>
            );
          } else if (fieldConfig.type === 'multi-select') {
            // Garantir que o valor é sempre um array
            const currentValue = Array.isArray(formData.credentials[fieldName]) 
              ? formData.credentials[fieldName] 
              : [];
            
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                <div className="mt-1 space-y-2">
                  {fieldConfig.options?.map((option: any) => {
                    const optionValue = option.value || option;
                    const isChecked = currentValue.includes(optionValue);
                    
                    return (
                      <div key={optionValue} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${fieldName}-${optionValue}`}
                          checked={isChecked}
                          onChange={() => {
                            const newValue = isChecked
                              ? currentValue.filter((v: string) => v !== optionValue)
                              : [...currentValue, optionValue];
                            
                            updateCredentialField(fieldName, newValue);
                          }}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`${fieldName}-${optionValue}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          {option.label || option}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
                {fieldConfig.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldConfig.help}</p>
                )}
              </div>
            );
          } else if (fieldConfig.type === 'boolean') {
            return (
              <div key={fieldName} className="flex items-center">
                <input
                  type="checkbox"
                  id={fieldName}
                  checked={formData.credentials[fieldName] || false}
                  onChange={(e) => updateCredentialField(fieldName, e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor={fieldName} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
              </div>
            );
          } else {
            // Texto, número, email, etc.
            return (
              <div key={fieldName}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fieldConfig.label} {fieldConfig.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={fieldConfig.type}
                  value={formData.credentials[fieldName] || ''}
                  onChange={(e) => updateCredentialField(fieldName, e.target.value)}
                  className={`w-full px-4 py-2 border ${
                    fieldError ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                  } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  required={fieldConfig.required}
                />
                {fieldError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldError}</p>
                )}
                {fieldConfig.help && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{fieldConfig.help}</p>
                )}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/credentials')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Nova Credencial' : 'Editar Credencial'}
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
          {/* Step 1: Selecionar Provedor */}
          {formStep === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Selecione o Provedor
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers
                  .filter(p => p.isActive)
                  .map(provider => (
                    <div
                      key={provider.code}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.provider === provider.code
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      onClick={() => selectProvider(provider.code)}
                    >
                      <div className="flex items-center mb-2">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          {getLucideIcon(provider.icon)}
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {provider.name}
                          </h3>
                        </div>
                      </div>
                      
                      {provider.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {provider.description}
                        </p>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Métodos de Autenticação: </span>
                        {provider.authTypes.map(type => {
                          switch (type) {
                            case 'oauth2':
                              return 'OAuth 2.0';
                            case 'api_key':
                              return 'API Key';
                            case 'password':
                              return 'Usuário/Senha';
                            case 'service_account':
                              return 'Conta de Serviço';
                            default:
                              return type;
                          }
                        }).join(', ')}
                      </div>
                      
                      {provider.helpUrl && (
                        <div className="mt-2">
                          <a
                            href={provider.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <HelpCircle size={12} className="mr-1" />
                            Como obter credenciais
                            <ExternalLink size={10} className="ml-1" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              
              {formErrors.provider && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formErrors.provider}</p>
              )}
              
              {providers.length === 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mt-4">
                  <p className="text-yellow-700 dark:text-yellow-300">Nenhum provedor disponível.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Selecionar Tipo de Autenticação */}
          {formStep === 2 && selectedProvider && (
            <div>
              <div className="flex items-center mb-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tipo de Autenticação para {selectedProvider.name}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProvider.authTypes.map(authType => (
                  <div
                    key={authType}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.authType === authType
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                    onClick={() => selectAuthType(authType)}
                  >
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Key size={16} />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {authType === 'oauth2' ? 'OAuth 2.0' :
                            authType === 'api_key' ? 'API Key' :
                            authType === 'password' ? 'Usuário/Senha' :
                            authType === 'service_account' ? 'Conta de Serviço' :
                            authType}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {formErrors.authType && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{formErrors.authType}</p>
              )}
            </div>
          )}

          {/* Step 3: Detalhes da Credencial */}
          {formStep === 3 && selectedProvider && formData.authType && (
            <div>
              {formStep > 1 && (
                <div className="flex items-center mb-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Detalhes da Credencial
                  </h2>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2 border ${
                      formErrors.name ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                    required
                    placeholder={`${selectedProvider.name} - ${formData.authType}`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Data de Expiração
                  </label>
                  <input
                    type="date"
                    id="expiresAt"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className={`w-full px-4 py-2 border ${
                      formErrors.expiresAt ? 'border-red-300 dark:border-red-700' : 'border-gray-300 dark:border-gray-600'
                    } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  />
                  {formErrors.expiresAt && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.expiresAt}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Deixe em branco para credenciais sem expiração
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Breve descrição do uso desta credencial"
                  />
                </div>
              </div>
              
              {/* Campos específicos do provedor e tipo de autenticação */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Configuração para {selectedProvider.name} ({formData.authType})
                </h3>
                
                {renderCredentialFields()}
                
                {selectedProvider.helpUrl && (
                  <div className="mt-4">
                    <a
                      href={selectedProvider.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
                    >
                      <HelpCircle size={14} className="mr-1" />
                      Documentação de ajuda
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Credencial ativa
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <button
              type="button"
              onClick={() => navigate('/admin/credentials')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            
            {formStep === 3 && (
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Credencial'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemCredentialForm;