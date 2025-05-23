import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Página não encontrada</h2>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Desculpe, não conseguimos encontrar a página que você está procurando.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Home size={16} className="mr-1.5" />
            Voltar ao Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;