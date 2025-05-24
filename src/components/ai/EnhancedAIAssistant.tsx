import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { 
  X, Send, ChevronDown, User, Sparkles, Trash, Database, 
  AlertCircle, CheckCircle, Loader, BrainCircuit, Bot
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
  const [isTyping, setIsTyping] = useState(false);
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Rolar para o final das mensagens quando novas mensagens forem adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Efeito para evitar a mensagem de "não entendi" inicial
  useEffect(() => {
    // Verificar se já existe uma mensagem de boas-vindas
    const hasWelcomeMessage = aiMessages.some(
      msg => msg.role === 'assistant' && msg.id === 'welcome'
    );
    
    // Se não tiver mensagem de boas-vindas e não tiver enviado a mensagem inicial
    if (!hasWelcomeMessage && !initialMessageSent) {
      // Adicionar mensagem de boas-vindas personalizada
      addAIMessage({
        role: 'assistant',
        content: 'Olá! Sou o assistente AI avançado com capacidade de consultar e modificar dados. Como posso ajudar você hoje?',
      });
      
      setInitialMessageSent(true);
    }
  }, [aiMessages, addAIMessage, initialMessageSent]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsProcessing(true);
    setIsTyping(true);
    
    // Criar mensagem do usuário
    const userMessage: Omit<AIMessage, 'id' | 'timestamp'> = {
      role: 'user',
      content: message,
    };
    
    // Adicionar ao histórico de mensagens
    addAIMessage(userMessage);
    
    try {
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
      };
      
      // Chamar a função Edge
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Simular digitação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Adicionar resposta do assistente
      addAIMessage({
        role: 'assistant',
        content: result.response || 'Não foi possível processar sua solicitação.',
      });
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar mensagem de erro amigável
      addAIMessage({
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem. ${
          error instanceof Error ? error.message : 'Tente novamente mais tarde.'
        }`,
      });
    } finally {
      // Limpar o input e estados
      setMessage('');
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    clearAIMessages();
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex flex-col w-80 md:w-96 ${
        isMinimized ? 'h-12' : 'h-96'
      } bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300`}
    > 
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-indigo-600 text-white rounded-t-lg cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center">
          <Bot size={18} className="mr-2" />
          <h3 className="text-sm font-medium">Assistente AI Avançado</h3>
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
          {/* Chat Body */}
          <div 
            ref={chatBodyRef}
            className="flex-1 p-4 overflow-y-auto"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="space-y-4">
              {aiMessages.map((msg) => {
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
                            <BrainCircuit size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
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
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700">
                    <TypingIndicator />
                  </div>
                </div>
              )}
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
                placeholder={isProcessing ? "Processando..." : "Digite uma pergunta ou comando..."}
                className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 text-sm placeholder-gray-400 disabled:opacity-70"
                disabled={isProcessing}
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
                {isProcessing ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default EnhancedAIAssistant;