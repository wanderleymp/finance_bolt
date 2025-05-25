import React, { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedProps {
  permission?: string;
  role?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

const Protected: React.FC<ProtectedProps> = ({ permission, role, children, fallback = null }) => {
  const { hasPermission, hasRole } = useAuth();

  if (permission && !hasPermission(permission)) return <>{fallback}</>;
  if (role && !hasRole(role)) return <>{fallback}</>;

  return <>{children}</>;
};

export default Protected;
