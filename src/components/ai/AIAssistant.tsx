import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { X, Send, ChevronDown, Bot, User, Sparkles, Trash } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const { aiMessages, addAIMessage, clearAIMessages, toggleAIAssistant } = useUI();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  // Rolar para o final das mensagens quando novas mensagens forem adicionadas
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsSending(true);
    
    // Adicionar mensagem do usuário
    addAIMessage({
      role: 'user',
      content: message,
    });
    
    setMessage('');
    setIsSending(false);
  };

  const handleClearChat = () => {
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
          <h3 className="text-sm font-medium">Assistente AI</h3>
        </div>
        <div className="flex items-center space-x-2">
          {!isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearChat();
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
              toggleAIAssistant();
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
          >
            <div className="space-y-4">
              {aiMessages.map((msg) => (
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
              ))}
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
                placeholder="Digite uma mensagem..."
                className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 text-sm placeholder-gray-400"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !message.trim()}
                className={`p-2 ${
                  isSending || !message.trim()
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default AIAssistant;