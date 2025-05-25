// Tipos para RBAC (controle de acesso baseado em papéis)

export interface Permission {
  id: string;
  code: string; // Ex: 'financial:transactions:create'
  name: string;
  description: string;
  module: string; // Ex: 'financial', 'documents', etc.
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // Lista de códigos de permissões
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  tenantId?: string;
  companyId?: string;
  constraints?: Record<string, any>;
}
