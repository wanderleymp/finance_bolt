import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, ChevronLeft, Key, Search, Filter,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { Tenant } from '../../../types';
import { supabase } from '../../../lib/supabase';
import { useUI } from '../../../contexts/UIContext';

const TenantCredentialsIndex: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { addToast } = useUI();
  
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    if (tenantId) {
      fetchTenantData(tenantId);
    }
  }, [tenantId]);

  const fetchTenantData = async (id: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('TenantCredentialsIndex: Erro ao buscar tenant:', error);
        throw error;
      }
      
      if (data) {
        setTenant({
          id: data.id,
          name: data.nome,
          plan: data.plano as any,
          logo: data.logo,
          isActive: data.ativo,
          createdAt: data.createdAt,
          status: data.status
        });
      }
    } catch (err) {
      console.error('TenantCredentialsIndex: Erro ao carregar tenant:', err);
      
      addToast({
        title: 'Erro',
        message: 'Falha ao carregar dados do tenant',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center">
          <Link
            to="/admin/tenants"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Key className="h-6 w-6 mr-2 text-indigo-600 dark:text-indigo-400" />
              Credenciais do Tenant
            </h1>
            {tenant && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tenant.name}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Carregando...</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
            <Key className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Implementação Pendente</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Esta tela está em desenvolvimento. Retorne mais tarde para gerenciar as credenciais específicas do tenant.
            </p>
          </div>
        )}
      </div>
    </AdminRedirect>
  );
};

export default TenantCredentialsIndex;