import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Key, AlertTriangle, CheckCircle, AlertCircle, Clock,
  RefreshCcw, Edit, Download, Clipboard, Copy, Check, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { SystemCredential, CredentialProvider, CredentialTestLog } from '../../../types';
import { useUI } from '../../../contexts/UIContext';

const SystemCredentialDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useUI();

  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<SystemCredential | null>(null);
  const [provider, setProvider] = useState<CredentialProvider | null>(null);
  const [testLogs, setTestLogs] = useState<CredentialTestLog[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCredentialData(id);
    } else {
      navigate('/admin/credentials');
    }
  }, [id, navigate]);

  const fetchCredentialData = async (credentialId: string) => {
    try {
      setLoading(true);
      
      // Buscar dados da credencial
      const { data, error } = await supabase
        .from('system_credentials')
        .select('*')
        .eq('id', credentialId)
        .single();
      
      if (error) {
        console.error('SystemCredentialDetail: Erro ao buscar credencial:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Credencial não encontrada');
      }
      
      console.log('SystemCredentialDetail: Credencial encontrada:', data);
      
      // Formatar credencial
      const formattedCredential: SystemCredential = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        provider: data.provider,
        authType: data.auth_type,
        credentials: data.credentials,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        expiresAt: data.expires_at,
        lastUsedAt: data.last_used_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by,
        metadata: data.metadata,
        
        // Simulação de status para demo - em produção viria do banco
        testStatus: Math.random() > 0.2 ? 'success' : 'error',
        lastTestDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
      setCredential(formattedCredential);
      
      // Buscar informações do provedor
      const { data: providerData, error: providerError } = await supabase
        .from('credential_providers')
        .select('*')
        .eq('code', data.provider)
        .single();
      
      if (providerError) {
        console.error('SystemCredentialDetail: Erro ao buscar provedor:', providerError);
        // Não falhar se não encontrar o provedor
      } else if (providerData) {
        setProvider({
          code: providerData.code,
          name: providerData.name,
          description: providerData.description,
          icon: providerData.icon,
          authTypes: providerData.auth_types,
          fields: providerData.fields,
          helpUrl: providerData.help_url,
          isActive: providerData.is_active
        });
      }
      
      // Buscar logs de teste (simulação para demo)
      generateMockTestLogs(credentialId);
    } catch (err) {
      console.error('SystemCredentialDetail: Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados da credencial.');
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados da credencial',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar logs de teste fictícios para demonstração
  const generateMockTestLogs = (credentialId: string) => {
    const mockLogs: CredentialTestLog[] = [];
    
    // Gerar entre 3 e 10 logs
    const logsCount = Math.floor(Math.random() * 7) + 3;
    
    for (let i = 0; i < logsCount; i++) {
      const success = Math.random() > 0.3;
      const daysAgo = i * 2; // Cada log é de 2 dias atrás do anterior
      
      mockLogs.push({
        id: `mock-${i}`,
        credentialId,
        credentialType: 'system',
        testResult: success,
        errorMessage: success ? undefined : getRandomErrorMessage(),
        executedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        executedBy: undefined,
        responseTime: Math.floor(Math.random() * 1000) + 200, // 200ms a 1200ms
        details: {
          method: 'GET',
          endpoint: getRandomEndpoint(),
          statusCode: success ? 200 : getRandomErrorCode()
        }
      });
    }
    
    setTestLogs(mockLogs);
  };

  const getRandomErrorMessage = (): string => {
    const errors = [
      'Falha na autenticação: credenciais inválidas',
      'Timeout na conexão com o servidor',
      'Permissão negada. Verifique os escopos de autorização',
      'Token expirado. Por favor, renove o token',
      'Erro de servidor (500)',
      'Serviço indisponível no momento',
      'Resposta malformada do servidor'
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  };

  const getRandomErrorCode = (): number => {
    const codes = [400, 401, 403, 404, 429, 500, 502, 503];
    return codes[Math.floor(Math.random() * codes.length)];
  };

  const getRandomEndpoint = (): string => {
    const endpoints = [
      'api/v1/users',
      'api/v2/auth/validate',
      'oauth2/token',
      'v1/drive/files',
      'mail/messages',
      'calendar/events',
      'v3/contacts'
    ];
    
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  };

  const testCredential = async () => {
    try {
      setTestLoading(true);
      
      // Simulação de teste - em uma aplicação real, chamaríamos uma API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult = Math.random() > 0.2;
      
      // Atualizar status do teste
      if (credential) {
        setCredential({
          ...credential,
          testStatus: testResult ? 'success' : 'error',
          lastTestDate: new Date().toISOString()
        });
      }
      
      // Adicionar novo log de teste
      const newLog: CredentialTestLog = {
        id: `mock-new-${Date.now()}`,
        credentialId: id || '',
        credentialType: 'system',
        testResult,
        errorMessage: testResult ? undefined : getRandomErrorMessage(),
        executedAt: new Date().toISOString(),
        executedBy: undefined,
        responseTime: Math.floor(Math.random() * 800) + 200,
        details: {
          method: 'GET',
          endpoint: getRandomEndpoint(),
          statusCode: testResult ? 200 : getRandomErrorCode()
        }
      };
      
      setTestLogs([newLog, ...testLogs]);
      
      addToast({
        title: testResult ? 'Teste bem-sucedido' : 'Falha no teste',
        message: testResult
          ? 'A credencial está funcionando corretamente'
          : newLog.errorMessage || 'O teste da credencial falhou',
        type: testResult ? 'success' : 'error'
      });
    } catch (err) {
      console.error('SystemCredentialDetail: Erro ao testar credencial:', err);
      
      addToast({
        title: 'Erro no teste',
        message: 'Ocorreu um erro ao executar o teste',
        type: 'error'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const toggleFieldVisibility = (field: string) => {
    setHiddenFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const copyToClipboard = (field: string, value: string) => {
    navigator.clipboard.writeText(value)
      .then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        
        addToast({
          title: 'Copiado',
          message: 'Valor copiado para a área de transferência',
          type: 'success'
        });
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        addToast({
          title: 'Erro',
          message: 'Não foi possível copiar o valor',
          type: 'error'
        });
      });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCredentialExpired = (): boolean => {
    if (!credential?.expiresAt) return false;
    return new Date(credential.expiresAt) < new Date();
  };

  const isCredentialExpiringCritical = (): boolean => {
    if (!credential?.expiresAt) return false;
    
    const expireDate = new Date(credential.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  // Verificar se uma credencial expira em breve (30 dias)
  const isCredentialExpiringWarning = (): boolean => {
    if (!credential?.expiresAt) return false;
    
    const expireDate = new Date(credential.expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    return daysUntilExpiry > 7 && daysUntilExpiry <= 30;
  };

  const getAuthTypeLabel = (authType: string): string => {
    switch (authType) {
      case 'oauth2':
        return 'OAuth 2.0';
      case 'api_key':
        return 'API Key';
      case 'password':
        return 'Usuário/Senha';
      case 'service_account':
        return 'Conta de Serviço';
      default:
        return authType;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Carregando dados da credencial...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !credential) {
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
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-300">{error || 'Credencial não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/credentials')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={testCredential}
            disabled={testLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testLoading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                Testando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Testar Conexão
              </>
            )}
          </button>
          
          <Link
            to={`/admin/credentials/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Credencial
          </Link>
        </div>
      </div>

      {/* Header com informações principais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                  isCredentialExpired()
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : credential.testStatus === 'error'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : isCredentialExpiringCritical()
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Key size={24} />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {credential.name}
                </h1>
                <div className="mt-1 flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {provider?.name || credential.provider} • {getAuthTypeLabel(credential.authType)}
                  </span>
                  
                  {credential.isActive ? (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      Ativo
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      Inativo
                    </span>
                  )}
                  
                  {isCredentialExpired() && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      Expirada
                    </span>
                  )}
                  
                  {credential.testStatus === 'success' ? (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      <CheckCircle size={12} className="mr-1" />
                      Funcionando
                    </span>
                  ) : credential.testStatus === 'error' ? (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      <AlertCircle size={12} className="mr-1" />
                      Erro
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      <Clock size={12} className="mr-1" />
                      Não testada
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {credential.description && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {credential.description}
            </p>
          </div>
        )}
        
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Criada em</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(credential.createdAt)}
              </dd>
            </div>
            
            {credential.expiresAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Expira em</dt>
                <dd className={`mt-1 text-sm ${
                  isCredentialExpired()
                    ? 'text-red-600 dark:text-red-400'
                    : isCredentialExpiringCritical()
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : isCredentialExpiringWarning()
                    ? 'text-yellow-500 dark:text-yellow-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {formatDate(credential.expiresAt)}
                </dd>
              </div>
            )}
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Último teste</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {credential.lastTestDate ? formatDate(credential.lastTestDate) : 'Nunca testada'}
              </dd>
            </div>
            
            {credential.lastUsedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Último uso</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(credential.lastUsedAt)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Grid com informações detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detalhes da credencial */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <Key className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Detalhes da Credencial
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Renderizar campos da credencial */}
                {credential.credentials && Object.entries(credential.credentials).map(([key, value]) => {
                  const isSecret = key.includes('secret') || 
                                  key.includes('password') || 
                                  key.includes('key') ||
                                  key.includes('token');
                  
                  const isHidden = hiddenFields.includes(key);
                  const isCopied = copiedField === key;
                  
                  // Se for um objeto ou array, exibir como JSON formatado
                  const isObject = typeof value === 'object' && value !== null;
                  const displayValue = isObject
                    ? JSON.stringify(value, null, 2)
                    : String(value);
                  
                  return (
                    <div key={key} className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
                        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                          {key}
                        </span>
                        <div className="flex space-x-1">
                          {isSecret && (
                            <button
                              onClick={() => toggleFieldVisibility(key)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                            >
                              {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(key, displayValue)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        {isObject ? (
                          <pre className={`text-xs overflow-x-auto p-2 bg-gray-50 dark:bg-gray-800 rounded ${
                            isSecret && isHidden ? 'filter blur-sm' : ''
                          }`}>
                            {displayValue}
                          </pre>
                        ) : (
                          <div className={`break-words text-sm text-gray-800 dark:text-gray-200 ${
                            isSecret && isHidden ? 'filter blur-sm' : ''
                          }`}>
                            {displayValue}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Histórico de testes */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <RefreshCcw className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Histórico de Testes
              </h2>
              
              <button
                onClick={testCredential}
                disabled={testLoading}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                {testLoading ? (
                  <div className="animate-spin h-3 w-3 mr-1 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                ) : (
                  <RefreshCcw className="h-3 w-3 mr-1" />
                )}
                Testar
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {testLogs.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {testLogs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {log.testResult ? (
                            <CheckCircle size={16} className="text-green-500 dark:text-green-400" />
                          ) : (
                            <AlertCircle size={16} className="text-red-500 dark:text-red-400" />
                          )}
                          <span className={`ml-1 text-sm font-medium ${
                            log.testResult 
                              ? 'text-green-700 dark:text-green-400' 
                              : 'text-red-700 dark:text-red-400'
                          }`}>
                            {log.testResult ? 'Sucesso' : 'Falha'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(log.executedAt)}
                        </span>
                      </div>
                      
                      {log.details && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded mb-2">
                          <div>
                            <span className="font-medium">Método:</span> {log.details.method}
                          </div>
                          <div>
                            <span className="font-medium">Endpoint:</span> {log.details.endpoint}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            <span className={log.details.statusCode === 200 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {log.details.statusCode}
                            </span>
                          </div>
                          {log.responseTime !== undefined && (
                            <div>
                              <span className="font-medium">Tempo:</span>{' '}
                              <span className={log.responseTime > 1000 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                                {log.responseTime}ms
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {log.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <RefreshCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum teste realizado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemCredentialDetail;