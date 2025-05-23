import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import PlanForm from './PlanForm';

const NewPlan: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('Usuário não autenticado. Redirecionando para login...');
        navigate('/login', { 
          state: { 
            redirectTo: '/admin/plans/new',
            message: 'Faça login para acessar esta página'
          } 
        });
      } else {
        // Verificar se o usuário é admin
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (error || data?.role !== 'admin') {
          console.log('Usuário não é administrador. Redirecionando...');
          navigate('/');
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  return <PlanForm />;
};

export default NewPlan;