import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { 
  X, Send, ChevronDown, Bot, User, Sparkles, Trash, Database, 
  AlertCircle, CheckCircle, Loader2, HelpCircle, List, Plus, 
  Search, Filter, ArrowRight, BrainCircuit, Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { AIMessage } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// Componente para efeito de digitação
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex space-x-2 items-center px-3 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">Assistente está digitando...</span>
    </div>
  );
};

// Componente para exibir resultados de operações CRUD
const CommandResult: React.FC<{
  result: {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  };
  command?: {
    entity: string;
    operation: string;
  };
}> = ({ result, command = { entity: '', operation: '' } }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!result) return null;
  
  // Renderizar dados em formato tabular para comandos de leitura/listagem
  const renderDataTable = () => {
    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhum dado para exibir</p>;
    }
    
    // Obter cabeçalhos da tabela do primeiro item
    const headers = Object.keys(result.data[0]);
    
    return (
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              {headers.map(header => (
                <th 
                  key={header}
                  className="px-2 py-1 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {result.data.map((row: any, rowIndex: number) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {headers.map(header => (
                  <td 
                    key={`${rowIndex}-${header}`}
                    className="px-2 py-1 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300"
                  >
                    {typeof row[header] === 'object' 
                      ? JSON.stringify(row[header]) 
                      : String(row[header] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className={`mt-2 p-2 rounded-md ${
      result.success 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {result.success ? (
            <CheckCircle size={16} className="text-green-500 dark:text-green-400 mr-2" />
          ) : (
            <AlertCircle size={16} className="text-red-500 dark:text-red-400 mr-2" />
          )}
          <span className={`text-sm font-medium ${
            result.success 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-red-700 dark:text-red-300'
          }`}>
            {result.message || (result.success ? 'Operação bem-sucedida' : 'Erro na operação')}
          </span>
        </div>
        
        {result.data && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {expanded ? (
              <ChevronDown size={16} className="transform rotate-180" />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        )}
      </div>
      
      {result.error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{result.error}</p>
      )}
      
      {expanded && result.data && (
        <div className="mt-2">
          {['read', 'list'].includes(command.operation) ? (
            renderDataTable()
          ) : (
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

// Componente para exibir a interpretação do comando
const CommandInterpretation: React.FC<{ 
  functionCall: {
    name: string;
    arguments: any;
  } 
}> = ({ functionCall }) => {
  if (!functionCall || !functionCall.arguments) {
    return (
      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <div className="flex items-center">
          <HelpCircle size={16} className="text-yellow-500 dark:text-yellow-400 mr-2" />
          <span className="text-sm text-yellow-700 dark:text-yellow-300">
            Não consegui entender completamente seu comando. Tente ser mais específico.
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
      <div className="flex items-start">
        <Database size={16} className="text-blue-500 dark:text-blue-400 mr-2" />
        <div>
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {functionCall.name === 'query_database' ? (
              <>
                Interpretei como: {functionCall.arguments.operation.toUpperCase()} {functionCall.arguments.entity}
                {functionCall.arguments.id ? ` com ID ${functionCall.arguments.id}` : ''}
              </>
            ) : (
              <>Buscando informações sobre {functionCall.arguments.entity}</>
            )}
          </span>
          {functionCall.arguments.filters && Object.keys(functionCall.arguments.filters).length > 0 && (
            <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Filtros: {JSON.stringify(functionCall.arguments.filters)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal do assistente AI aprimorado
const EnhancedAIAssistant: React.FC = () => {
  const { aiMessages, addAIMessage, clearAIMessages, toggleEnhancedAIAssistant } = useUI();
  const { user } = useAuth();
  const { selectedTenant, selectedCompany } = useTenant();
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEntitySelector, setShowEntitySelector] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [initialized, setInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Mensagem de boas-vindas inicial
  useEffect(() => {
    if (!initialized) {
      // Limpar mensagens anteriores
      clearAIMessages();
      
      // Adicionar mensagem de boas-vindas
      addAIMessage({
        role: 'assistant',
        content: `Olá! Sou o assistente AI avançado com capacidades de consulta ao banco de dados.

Posso ajudar você a:

• Listar dados (ex: "listar todas as transações")
• Criar registros (ex: "criar nova tarefa")
• Buscar informações (ex: "buscar tenant com id X")
• Atualizar dados (ex: "atualizar usuário com id X")
• Excluir registros (ex: "excluir transação com id X")

Experimente perguntar "quais tenants temos?" ou "listar todas as empresas".`
      });
    }
  }, [initialized, addAIMessage, clearAIMessages]);

  // Rolar para o final das mensagens quando novas mensagens forem adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsProcessing(true);
    
    // Mostrar indicador de digitação imediatamente
    setIsTyping(true);
    
    // Criar e adicionar mensagem do usuário
    const userMessageId = `user-${uuidv4()}`;
    const userMessage: AIMessage = {
      id: userMessageId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Adicionar mensagem do usuário diretamente ao estado
    const newAIMessage = (msg: AIMessage) => {
      aiMessages.push(msg);
      // Forçar atualização da UI
      setIsTyping(prev => prev);
    };
    
    newAIMessage(userMessage);

    // Atualizar histórico de conversa para o LLM
    const updatedHistory = [...conversationHistory, {
      role: userMessage.role,
      content: userMessage.content
    }];
    setConversationHistory(updatedHistory);
    
    try {
      // Adicionar indicador de digitação como mensagem temporária
      const processingMessageId = `typing-${uuidv4()}`;
      const typingMessage: AIMessage = {
        id: processingMessageId,
        role: 'system',
        content: 'processing',
        timestamp: new Date().toISOString(),
      };
      
      newAIMessage(typingMessage);
      
      // Obter URL da função Edge
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;
      
      if (!apiUrl) {
        throw new Error('URL do Supabase não configurada');
      }
      
      // Preparar cabeçalhos com chave anônima
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Chave anônima do Supabase não configurada');
      }
      
      // Preparar dados para enviar
      const requestData = {
        message,
        userId: user?.id,
        tenantId: selectedTenant?.id || null,
        companyId: selectedCompany?.id || null,
        conversationHistory: updatedHistory,
      };
      
      // Chamar a função Edge com timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestData),
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Erro na requisição: ${response.status} ${response.statusText}` +
            (errorData.error ? `\nDetalhes: ${errorData.error}` : '')
          );
        }
        
        const result = await response.json();
        
        // Se houver uma chamada de função, mostrar a interpretação
        if (result.functionCall) {
          // Remover indicador de digitação
          const updatedMessages = aiMessages.filter(msg => msg.id !== processingMessageId);
          while (aiMessages.length > 0) aiMessages.pop();
          updatedMessages.forEach(msg => aiMessages.push(msg));
          
          // Adicionar interpretação do comando
          const interpretationMessage: AIMessage = {
            id: `interpretation-${uuidv4()}`,
            role: 'system',
            content: JSON.stringify({ 
              type: 'command_interpretation',
              functionCall: result.functionCall
            }),
            timestamp: new Date().toISOString(),
          };
          
          newAIMessage(interpretationMessage);
          
          // Pequeno delay para simular processamento
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Se houver um resultado da função, mostrar
          if (result.functionCall.result) {
            const resultMessage: AIMessage = {
              id: `result-${uuidv4()}`,
              role: 'system',
              content: JSON.stringify({ 
                type: 'command_result',
                result: result.functionCall.result,
                command: {
                  entity: result.functionCall.arguments.entity,
                  operation: result.functionCall.arguments.operation
                }
              }),
              timestamp: new Date().toISOString(),
            };
            
            newAIMessage(resultMessage);
          }
        }
        else {
          // Remover indicador de digitação
          const updatedMessages = aiMessages.filter(msg => msg.id !== processingMessageId);
          while (aiMessages.length > 0) aiMessages.pop();
          updatedMessages.forEach(msg => aiMessages.push(msg));
        }
        
        // Adicionar resposta do assistente após um pequeno delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const assistantMessage: AIMessage = {
          id: `assistant-${uuidv4()}`,
          role: 'assistant',
          content: result.response || 'Não foi possível processar sua solicitação.',
          timestamp: new Date().toISOString(),
        };
        
        newAIMessage(assistantMessage);
        
        // Atualizar histórico de conversa
        setConversationHistory([...updatedHistory, {
          role: assistantMessage.role,
          content: assistantMessage.content
        }]);
        
      } catch (fetchError) {
        throw new Error(
          fetchError instanceof Error 
            ? `Erro na comunicação com o servidor: ${fetchError.message}`
            : 'Erro desconhecido na comunicação com o servidor'
        );
      }
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Remover indicador de digitação
      const updatedMessages = aiMessages.filter(msg => msg.content !== 'processing');
      while (aiMessages.length > 0) aiMessages.pop();
      updatedMessages.forEach(msg => aiMessages.push(msg));
      
      // Adicionar mensagem de erro amigável
      const errorMessage: AIMessage = {
        id: `error-${uuidv4()}`,
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem. ${
          error instanceof Error 
            ? error.message.includes('configurada')
              ? 'Por favor, verifique as configurações do sistema.'
              : error.message
            : 'Tente novamente mais tarde.'
        }`,
        timestamp: new Date().toISOString(),
      };
      
      newAIMessage(errorMessage);
    } finally {
      // Limpar o input e estados
      setMessage('');
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  // Função para limpar mensagens de processamento
  const setAIMessages = (updater: (prev: AIMessage[]) => AIMessage[]) => {
    // Esta função é um mock para simular a atualização das mensagens
    // Em uma implementação real, você teria uma função no contexto UI
    const currentMessages = aiMessages;
    const updatedMessages = updater(currentMessages);
    
    // Aqui você chamaria uma função do contexto para atualizar as mensagens
    // Por enquanto, apenas para demonstração
    console.log('Mensagens atualizadas:', updatedMessages);
  };

  const handleQuickCommand = (entity: string, action: string) => {
    setMessage(`${action} ${entity}`);
  };

  const clearChat = () => {
    clearAIMessages();
    setConversationHistory([]);
  };

  // Renderizar mensagem especial para interpretações de comando e resultados
  const renderSpecialMessage = (content: string) => {
    try {
      // Ignorar mensagens de processamento
      if (content === 'processing') {
        return <TypingIndicator />;
      }
      
      const data = JSON.parse(content);
      
      if (data.type === 'command_interpretation') {
        return <CommandInterpretation functionCall={data.functionCall} />;
      }
      
      if (data.type === 'command_result') {
        return <CommandResult result={data.result} command={data.command} />;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col w-80 md:w-96 ${
        isMinimized ? 'h-12' : 'h-[32rem]'
      } bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300`}
    > 
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-indigo-600 text-white rounded-t-lg cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center">
          <BrainCircuit size={18} />
          <h3 className="text-sm font-medium ml-2">Assistente AI Avançado</h3>
        </div> 
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearChat();
              }}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-indigo-500"
              title="Limpar conversa"
            >
              <Trash size={16} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-indigo-500"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            <ChevronDown size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleEnhancedAIAssistant();
            }}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-indigo-500"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {/* Informações sobre o contexto */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start">
              <Info size={16} className="text-blue-500 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {selectedTenant 
                  ? `Conectado ao tenant: ${selectedTenant.name}${selectedCompany ? ` • Empresa: ${selectedCompany.nomeFantasia}` : ''}`
                  : 'Nenhum tenant selecionado. Algumas operações podem estar limitadas.'
                }
              </p>
            </div>
          </div>
          
          {/* Entidades disponíveis */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Entidades disponíveis para consulta
              </span>
              <button
                onClick={() => setShowEntitySelector(!showEntitySelector)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showEntitySelector ? <ChevronDown size={16} className="transform rotate-180" /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {showEntitySelector && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {['transactions', 'tasks', 'users', 'companies', 'organizations', 'tenants'].map(entity => (
                  <button
                    key={entity}
                    onClick={() => {
                      setSelectedEntity(entity);
                      setShowEntitySelector(false);
                    }}
                    className={`px-2 py-1 text-xs rounded-md ${
                      selectedEntity === entity
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500'
                    }`}
                  >
                    {entity === 'transactions' ? 'Transações' :
                      entity === 'tasks' ? 'Tarefas' :
                      entity === 'users' ? 'Usuários' :
                      entity === 'companies' ? 'Empresas' :
                      entity === 'organizations' ? 'Organizações' :
                      entity === 'tenants' ? 'Tenants' :
                      entity}
                  </button>
                ))}
              </div>
            )}
            
            {selectedEntity && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => handleQuickCommand(selectedEntity, 'Criar novo')}
                  className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-md"
                >
                  <Plus size={12} className="mr-1" />
                  Criar
                </button>
                <button
                  onClick={() => handleQuickCommand(selectedEntity, 'Listar todos os')}
                  className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md"
                >
                  <List size={12} className="mr-1" />
                  Listar
                </button>
                <button
                  onClick={() => handleQuickCommand(selectedEntity, 'Buscar')}
                  className="flex items-center px-2 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-md"
                >
                  <Search size={12} className="mr-1" />
                  Buscar
                </button>
              </div>
            )}
          </div>
          
          {/* Chat Body */}
          <div 
            ref={chatBodyRef}
            className="flex-1 p-4 overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="space-y-4">
              {aiMessages.map((msg) => {
                // Verificar se é uma mensagem especial do sistema
                const isSystemMessage = msg.role === 'system';
                
                // Tentar renderizar mensagem especial
                if (isSystemMessage) {
                  const specialContent = renderSpecialMessage(msg.content);
                  if (specialContent) {
                    return (
                      <div key={msg.id}>
                        {specialContent}
                      </div>
                    );
                  }
                  // Se não for uma mensagem especial reconhecida, não exibir
                  return null;
                }
                
                // Renderizar mensagens normais
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.role === 'assistant'
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {msg.role === 'assistant' ? (
                          <div className="flex items-center">
                            <Sparkles size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                              Assistente
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <User size={14} className="mr-1 text-white/80" />
                            <span className="text-xs font-medium text-white/80">
                              Você
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="text-right mt-1">
                        <span className="text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-2 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isProcessing ? "Processando..." : "Digite um comando ou pergunta..."}
                className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 disabled:opacity-70"
                disabled={isProcessing}
                autoFocus
              />
              <button
                type="submit"
                disabled={isProcessing || !message.trim()}
                className={`p-2 ${
                  isProcessing || !message.trim()
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                }`}
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            
            {/* Sugestões de comandos */}
            <div className="mt-2 flex flex-wrap gap-1">
              <button
                onClick={() => setMessage("Listar todas as transações")}
                disabled={isProcessing || isTyping}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark: