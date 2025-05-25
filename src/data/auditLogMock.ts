// Mock para registro de auditoria de acessos
export interface AccessLog {
  id: string;
  userId: string;
  action: string;
  permissionAttempted?: string;
  wasGranted: boolean;
  resource?: string;
  timestamp: string;
}

export const accessLogs: AccessLog[] = [];

export function logAccess({ userId, action, permissionAttempted, wasGranted, resource }: Partial<AccessLog>) {
  accessLogs.push({
    id: `log-${Date.now()}`,
    userId: userId || 'unknown',
    action: action || 'unknown',
    permissionAttempted,
    wasGranted: !!wasGranted,
    resource,
    timestamp: new Date().toISOString(),
  });
}
