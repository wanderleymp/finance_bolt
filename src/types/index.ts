// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user' | 'superadmin';
  lastLogin?: string;
  isSuper?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  logo?: string;
  createdAt: string;
  isActive: boolean;
  isFavorite?: boolean;
  lastAccess?: string;
  status?: string;
  userLimit?: number;
  storageLimit?: number;
  customOptions?: Record<string, any>;
  theme?: string;
  enabledFeatures?: string[];
  languages?: string[];
  slug?: string;
}

export interface Company {
  id: string;
  tenantId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  isHeadquarters: boolean;
  parentId?: string;
  logo?: string;
  isFavorite?: boolean;
  lastAccess?: string;
}

export interface TenantState {
  selectedTenant: Tenant | null;
  selectedCompany: Company | null;
  tenants: Tenant[];
  companies: Company[];
  loading: boolean;
  error: string | null;
}

// Organization Types
export interface Organization {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface OrganizationUser {
  id: string;
  organizationId: string;
  userId: string;
  role: 'admin' | 'manager' | 'member' | 'owner' | 'editor';
  createdAt: string;
  user?: User;
}

// SaaS Types
export interface SaaSPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  userLimit: number;
  storageLimit: number;
  isRecommended: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: SaaSModule[];
}

export interface SaaSModule {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  price: number;
  isCore: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantModule {
  id: string;
  tenantId: string;
  moduleId: string;
  module?: SaaSModule;
  activationDate: string;
  expirationDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  planId: string;
  plan?: SaaSPlan;
  status: 'active' | 'inactive' | 'pending' | 'cancelled' | 'expired';
  startDate: string;
  renewalDate?: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  paymentMethod?: string;
  isAutoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  user?: User;
  tenantId?: string;
  tenant?: Tenant;
  entityType: string;
  entityId?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Credential Types
export interface CredentialProvider {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  authTypes: string[];
  fields: Record<string, any>;
  helpUrl?: string;
  isActive: boolean;
}

export interface SystemCredential {
  id: string;
  name: string;
  description?: string;
  provider: string;
  authType: string;
  credentials: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  metadata?: Record<string, any>;
  testStatus?: 'success' | 'error' | 'pending' | 'unknown';
  lastTestDate?: string;
}

export interface TenantCredential extends SystemCredential {
  tenantId: string;
  overrideSystem: boolean;
  systemCredentialId?: string;
}

export interface CredentialTestLog {
  id: string;
  credentialId: string;
  credentialType: 'system' | 'tenant';
  testResult: boolean;
  errorMessage?: string;
  executedAt: string;
  executedBy?: string;
  responseTime?: number;
  details?: Record<string, any>;
}

// Storage Types
export interface StorageProvider {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  credentialProviders: string[];
  settingsSchema: Record<string, any>;
  features: string[];
  helpUrl?: string;
  isActive: boolean;
}

export interface StorageConfig {
  id: string;
  name: string;
  description?: string;
  provider: string;
  configType: 'system' | 'tenant';
  tenantId?: string;
  credentialId?: string;
  settings: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  spaceUsed?: number;
  spaceLimit?: number;
  lastSyncAt?: string;
  stats?: StorageStats;
}

export interface StorageStats {
  filesCount: number;
  totalSize: number;
  lastUpload?: string;
  uploadCount?: number;
  downloadCount?: number;
  availableSpace?: number;
  usedPercentage?: number;
}

export interface SystemModule {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  storageEnabled: boolean;
  requiredFeatures?: string[];
}

export interface ModuleStorageMapping {
  id: string;
  moduleCode: string;
  storageConfigId: string;
  tenantId?: string;
  priority: number;
  settings?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  module?: SystemModule;
  storageConfig?: StorageConfig;
}

// Widget Types
export interface Widget {
  id: string;
  type: 'financial' | 'tasks' | 'notifications' | 'activities' | 'calendar' | 'messages' | 'chart' | 'tenant-stats' | 'revenue' | 'subscription';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data?: any;
  settings?: any;
}

// Financial Types
export interface Transaction {
  id: string;
  companyId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: 'day' | 'week' | 'month' | 'year';
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// Message Types
export interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  read: boolean;
}

// AI Assistant Types
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  functionCall?: {
    name: string;
    arguments: any;
    result?: any;
  };
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  title: string;
  createdAt: string;
  updatedAt: string;
}

// SaaS Analytics
export interface SaaSMetrics {
  activeTenantsCount: number;
  totalRevenue: number;
  revenueGrowth: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  userGrowth: number;
  churnRate: number;
  moduleUsageStats: {
    moduleName: string;
    count: number;
    percentage: number;
  }[];
  subscriptionStatusSummary: {
    status: string;
    count: number;
    percentage: number;
  }[];
  revenueByPlan: {
    planName: string;
    revenue: number;
    percentage: number;
  }[];
}