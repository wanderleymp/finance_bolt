import { Permission, Role, UserRole } from '../types/rbac';

export const permissions: Permission[] = [
  { id: '1', code: 'financial:transactions:create', name: 'Criar transações', description: 'Pode criar transações financeiras', module: 'financial' },
  { id: '2', code: 'financial:transactions:read', name: 'Ver transações', description: 'Pode visualizar transações financeiras', module: 'financial' },
  { id: '3', code: 'financial:transactions:update', name: 'Editar transações', description: 'Pode editar transações financeiras', module: 'financial' },
  { id: '4', code: 'financial:transactions:delete', name: 'Excluir transações', description: 'Pode excluir transações financeiras', module: 'financial' },
  { id: '5', code: 'admin:users:manage', name: 'Gerenciar usuários', description: 'Pode gerenciar usuários do sistema', module: 'admin' },
  { id: '6', code: 'documents:read', name: 'Ver documentos', description: 'Pode visualizar documentos', module: 'documents' },
  { id: '7', code: 'documents:upload', name: 'Upload de documentos', description: 'Pode enviar documentos', module: 'documents' },
  { id: '8', code: 'settings:edit', name: 'Editar configurações', description: 'Pode editar configurações do sistema', module: 'settings' },
];

export const roles: Role[] = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    description: 'Acesso total ao sistema',
    isSystem: true,
    permissions: permissions.map(p => p.code),
  },
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Administra um tenant',
    isSystem: true,
    permissions: [
      'financial:transactions:create',
      'financial:transactions:read',
      'financial:transactions:update',
      'financial:transactions:delete',
      'admin:users:manage',
      'documents:read',
      'documents:upload',
      'settings:edit',
    ],
  },
  {
    id: 'user',
    name: 'Usuário',
    description: 'Usuário comum',
    isSystem: true,
    permissions: [
      'financial:transactions:create',
      'financial:transactions:read',
      'documents:read',
      'documents:upload',
    ],
  },
];

export const userRoles: UserRole[] = [
  { id: 'ur1', userId: 'super-admin', roleId: 'superadmin' },
  { id: 'ur2', userId: 'admin-1', roleId: 'admin', tenantId: 'tenant-1' },
  { id: 'ur3', userId: 'user-1', roleId: 'user', tenantId: 'tenant-1' },
];
