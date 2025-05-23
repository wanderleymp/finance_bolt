import React, { createContext, useContext, useState, useEffect } from 'react';
import { AIMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface UIContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  aiAssistantOpen: boolean;
  toggleAIAssistant: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  aiMessages: AIMessage[];
  addAIMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  clearAIMessages: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI deve ser usado dentro de um UIProvider');
  }
  return context;
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [aiMessages, setAIMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou seu assistente AI. Como posso ajudar você hoje?',
      timestamp: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    // Iniciar com o sidebar fechado em dispositivos móveis
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    // Executar na montagem do componente
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Limpar event listener
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Carregar preferência de tema do localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Aplicar tema
    document.documentElement.classList.toggle('dark', savedDarkMode);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleAIAssistant = () => {
    setAIAssistantOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const setDarkModeValue = (isDark: boolean) => {
    setDarkMode(isDark);
    localStorage.setItem('darkMode', String(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  };

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${uuidv4()}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const addAIMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    const newMessage: AIMessage = {
      ...message,
      id: `msg-${uuidv4()}`,
      timestamp: new Date().toISOString(),
    };
    
    setAIMessages((prev) => [...prev, newMessage]);

    // Se for mensagem do usuário, simular resposta do assistente após um pequeno delay
    if (message.role === 'user') {
      setTimeout(() => {
        const response: AIMessage = {
          id: `msg-${uuidv4()}`,
          role: 'assistant',
          content: getAIResponse(message.content),
          timestamp: new Date().toISOString(),
        };
        setAIMessages((prev) => [...prev, response]);
      }, 1500);
    }
  };

  const clearAIMessages = () => {
    setAIMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Olá! Sou seu assistente AI. Como posso ajudar você hoje?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Função simples para gerar respostas básicas do AI
  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde') || message.includes('boa noite')) {
      return 'Olá! Como posso ajudar você hoje?';
    }
    
    if (message.includes('ajuda') || message.includes('ajudar')) {
      return 'Posso ajudar com informações sobre sua conta, finanças, tarefas pendentes, e muito mais. Sobre o que você gostaria de saber?';
    }
    
    if (message.includes('financ') || message.includes('dinheiro') || message.includes('saldo') || message.includes('conta')) {
      return 'Seu saldo atual é R$ 12.450,00. Você tem 3 contas a pagar nos próximos dias, totalizando R$ 1.250,00.';
    }
    
    if (message.includes('tarefa') || message.includes('pendente') || message.includes('fazer')) {
      return 'Você tem 5 tarefas pendentes, sendo 2 de alta prioridade com prazo para hoje.';
    }
    
    if (message.includes('obrigado') || message.includes('valeu')) {
      return 'Por nada! Estou sempre à disposição para ajudar.';
    }
    
    return 'Desculpe, não entendi completamente. Pode reformular sua pergunta?';
  };

  const value = {
    sidebarOpen,
    toggleSidebar,
    aiAssistantOpen,
    toggleAIAssistant,
    darkMode,
    toggleDarkMode,
    setDarkMode: setDarkModeValue,
    toasts,
    addToast,
    removeToast,
    aiMessages,
    addAIMessage,
    clearAIMessages,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};