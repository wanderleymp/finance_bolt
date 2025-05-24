// Provedor de LLM
export interface LLMProvider {
  id: string;
  code: string;
  name: string;
  description?: string;
  apiEndpoint?: string;
  authMethod: 'api_key' | 'oauth2' | 'none';
  status: 'active' | 'inactive' | 'maintenance';
  rateLimitRequests?: number;
  rateLimitTokens?: number;
  rateLimitPeriod?: string;
  icon?: string;
  documentationUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Modelo de LLM
export interface LLMModel {
  id: string;
  providerId: string;
  provider?: LLMProvider;
  code: string;
  name: string;
  description?: string;
  contextWindow: number;
  maxTokens: number;
  inputPricePer1kTokens: number;
  outputPricePer1kTokens: number;
  supportsFunctions: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  specialization?: string[];
  performanceRating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Credencial de Provedor
export interface LLMProviderCredential {
  id: string;
  providerId: string;
  provider?: LLMProvider;
  name: string;
  description?: string;
  credentials: Record<string, any>;
  isSystem: boolean;
  tenantId?: string;
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  lastTestAt?: string;
  testStatus?: 'success' | 'error' | 'pending';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Configurações de LLM por Tenant
export interface TenantLLMSettings {
  id: string;
  tenantId: string;
  defaultProviderId?: string;
  defaultProvider?: LLMProvider;
  defaultModelId?: string;
  defaultModel?: LLMModel;
  fallbackModelId?: string;
  fallbackModel?: LLMModel;
  useSystemCredentials: boolean;
  credentialId?: string;
  credential?: LLMProviderCredential;
  defaultParameters: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configurações de Orçamento
export interface LLMBudgetSettings {
  id: string;
  tenantId: string;
  monthlyBudget: number;
  dailyLimit?: number;
  tokenLimitPerHour?: number;
  tokenLimitPerDay?: number;
  alertThresholdPercent: number;
  actionOnLimitReached: 'alert' | 'block' | 'fallback';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Log de Uso de LLM
export interface LLMUsageLog {
  id: string;
  tenantId?: string;
  userId?: string;
  providerId?: string;
  provider?: LLMProvider;
  modelId?: string;
  model?: LLMModel;
  requestId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  durationMs?: number;
  status: 'success' | 'error' | 'rate_limited' | 'cancelled';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Agente IA
export interface AIAgent {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  type: string;
  isSystem: boolean;
  modelId?: string;
  model?: LLMModel;
  fallbackModelId?: string;
  fallbackModel?: LLMModel;
  parameters: {
    temperature?: number;
    topP?: number;
    [key: string]: any;
  };
  systemPrompt?: string;
  tools?: any[];
  knowledgeBaseIds?: string[];
  personality?: {
    tone?: string;
    style?: string;
    expertise?: string;
    [key: string]: any;
  };
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Resultado de Teste de Conexão
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  statusCode?: number;
  responseTimeMs?: number;
  details?: Record<string, any>;
}

// Verificação de Limites de Orçamento
export interface BudgetLimitCheck {
  hasLimits: boolean;
  monthlyBudget?: number;
  currentMonthUsage?: number;
  monthlyBudgetPercent?: number;
  dailyLimit?: number;
  currentDayUsage?: number;
  dailyLimitPercent?: number;
  tokenLimitPerHour?: number;
  currentHourTokens?: number;
  tokenLimitPercent?: number;
  limitExceeded?: boolean;
  limitType?: 'monthly_budget' | 'daily_limit' | 'token_limit_per_hour';
  action?: 'alert' | 'block' | 'fallback';
  alert?: boolean;
  alertType?: string;
  alertMessage?: string;
}