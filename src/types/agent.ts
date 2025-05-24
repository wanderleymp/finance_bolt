// Tipos para o módulo de Agentes IA

// Template de Agente
export interface AIAgentTemplate {
  id: string;
  name: string;
  description?: string;
  type: string;
  isSystem: boolean;
  modelId?: string;
  parameters: {
    temperature?: number;
    topP?: number;
    [key: string]: any;
  };
  systemPrompt?: string;
  tools?: any[];
  personality?: {
    tone?: string;
    style?: string;
    expertise?: string;
    [key: string]: any;
  };
  icon?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Ferramenta de Agente
export interface AIAgentTool {
  id: string;
  code: string;
  name: string;
  description?: string;
  functionSchema: any;
  isSystem: boolean;
  tenantId?: string;
  requiresAuth: boolean;
  category?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Conversa com Agente
export interface AIAgentConversation {
  id: string;
  agentId: string;
  agent?: AIAgent;
  userId: string;
  tenantId?: string;
  title?: string;
  status: 'active' | 'archived' | 'deleted';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messages?: AIAgentMessage[];
}

// Mensagem de Conversa
export interface AIAgentMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content?: string;
  functionCall?: {
    name: string;
    arguments: any;
  };
  functionName?: string;
  functionArguments?: any;
  functionResult?: any;
  tokensUsed?: number;
  createdAt: string;
  feedback?: AIAgentFeedback;
}

// Feedback sobre Mensagem
export interface AIAgentFeedback {
  id: string;
  messageId: string;
  userId: string;
  rating: number;
  feedbackText?: string;
  createdAt: string;
}

// Base de Conhecimento
export interface AIKnowledgeBase {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  isSystem: boolean;
  embeddingModelId?: string;
  chunkSize: number;
  chunkOverlap: number;
  metadata?: Record<string, any>;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  documents?: AIKnowledgeDocument[];
}

// Documento em Base de Conhecimento
export interface AIKnowledgeDocument {
  id: string;
  knowledgeBaseId: string;
  title: string;
  content?: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  status: 'pending' | 'processing' | 'processed' | 'error';
  metadata?: Record<string, any>;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'error';
  chunksCount?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Chunk de Documento (para embeddings)
export interface AIDocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  tokensUsed?: number;
  chunkIndex: number;
  createdAt: string;
}

// Resultado de Busca Semântica
export interface SemanticSearchResult {
  documentId: string;
  documentTitle: string;
  chunkContent: string;
  similarity: number;
}

// Estatísticas de Uso de Agente
export interface AIAgentUsageStats {
  totalConversations: number;
  totalMessages: number;
  totalTokensUsed: number;
  averageRating?: number;
  topTools?: {
    toolName: string;
    usageCount: number;
  }[];
  usageByDay?: {
    date: string;
    conversations: number;
    messages: number;
    tokensUsed: number;
  }[];
}