import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminRedirect from '../../../components/admin/AdminRedirect';
import { ChevronLeft } from 'lucide-react';

const ModuleStorageMappingsIndex: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AdminRedirect>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/storage')}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Implementação Pendente</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            A interface de gerenciamento de mapeamentos entre módulos e armazenamento está em desenvolvimento. 
            Por favor, volte mais tarde.
          </p>
        </div>
      </div>
    </AdminRedirect>
  );
};

export default ModuleStorageMappingsIndex;