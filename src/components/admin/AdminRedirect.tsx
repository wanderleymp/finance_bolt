import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

interface AdminRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const AdminRedirect: React.FC<AdminRedirectProps> = ({ children, redirectTo = '/' }) => {
  const navigate = useNavigate();
  const { addToast } = useUI();
  const { isAuthenticated } = useAuth();

  // Verificar se o usuário está autenticado
  if (!isAuthenticated) {
    // Remover o redirecionamento automático aqui para evitar loops
    // O redirecionamento é feito em AppRoutes.tsx
    return null;
  }

  // Todos os usuários autenticados são permitidos
  return <>{children}</>;
};

export default AdminRedirect;