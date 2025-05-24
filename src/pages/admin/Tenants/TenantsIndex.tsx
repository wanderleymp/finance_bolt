import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { 
  Plus, Search, Filter, MoreHorizontal, Edit, Trash, Eye, Zap, 
  Check, X, Building, UploadCloud, Download, Briefcase
} from 'lucide-react';
import { Tenant } from '../../../types';
import { supabase } from '../../../lib/supabase';

// Restante do código existente (não alterado)...

const TenantsIndex: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('tenants').select('*');
      if (error) {
        setError('Erro ao buscar tenants');
        setTenants([]);
      } else {
        // Mapeia para garantir os campos esperados
        setTenants((data || []).map((t: any) => ({
          id: t.id,
          nome: t.nome || t.name,
          status: t.status,
          ativo: t.ativo,
        })));
        setError(null);
      }
      setLoading(false);
    };
    fetchTenants();
  }, []);

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Tenants</h1>
<p className="text-sm text-gray-500 dark:text-gray-400">
  Gerencie todos os tenants da plataforma SaaS
</p>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-2">
            <Link
              to="/admin/tenants/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Tenant
            </Link>
            
            
          </div>
        </div>

        {loading ? (
  <div>Carregando...</div>
) : error ? (
  <div className="text-red-500">{error}</div>
) : tenants.length === 0 ? (
  <div className="text-gray-500">Nenhum tenant cadastrado.</div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {tenants.map((tenant) => (
      <div
        key={tenant.id}
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 flex flex-col transition-transform duration-200 hover:scale-[1.025] hover:shadow-2xl group"
      >
        <div className="flex items-center mb-4">
          {/* Avatar com inicial */}
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-2xl font-bold text-indigo-700 dark:text-indigo-200 mr-4 shadow-sm">
            {(tenant.nome || tenant.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">{tenant.nome || tenant.name}</h2>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tenant.status === 'ativo' || tenant.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            >
              {tenant.status === 'ativo' || tenant.ativo ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {tenant.status === 'ativo' || tenant.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Link
            to={`/admin/tenants/${tenant.id}`}
            className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-600 transition"
            title="Detalhes"
            aria-label="Detalhes"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <Link
            to={`/admin/tenants/${tenant.id}/edit`}
            className="inline-flex items-center justify-center p-2 rounded-full bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-transparent hover:border-blue-200 dark:hover:border-blue-600 transition"
            title="Editar"
            aria-label="Editar"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>
      </div>
    ))}
  </div>
)}
      </div>
    </AdminRedirect>
  );
};

export default TenantsIndex;