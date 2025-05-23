import React, { useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useUI();

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        removeToast(toasts[0].id);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-xs sm:max-w-sm md:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start p-4 rounded-lg shadow-lg border ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
              : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          } animate-enter transform transition-all duration-300 hover:translate-x-[-3px]`}
        >
          <div
            className={`flex-shrink-0 w-6 h-6 flex items-center justify-center ${
              toast.type === 'success'
                ? 'text-green-500 dark:text-green-400'
                : toast.type === 'error'
                ? 'text-red-500 dark:text-red-400'
                : toast.type === 'warning'
                ? 'text-yellow-500 dark:text-yellow-400'
                : 'text-blue-500 dark:text-blue-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} />
            ) : toast.type === 'error' ? (
              <AlertCircle size={18} />
            ) : toast.type === 'warning' ? (
              <AlertTriangle size={18} />
            ) : (
              <Info size={18} />
            )}
          </div>
          <div className="ml-3 flex-1">
            <h3
              className={`text-sm font-medium ${
                toast.type === 'success'
                  ? 'text-green-800 dark:text-green-200'
                  : toast.type === 'error'
                  ? 'text-red-800 dark:text-red-200'
                  : toast.type === 'warning'
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}
            >
              {toast.title}
            </h3>
            <div
              className={`mt-1 text-sm ${
                toast.type === 'success'
                  ? 'text-green-700 dark:text-green-300'
                  : toast.type === 'error'
                  ? 'text-red-700 dark:text-red-300'
                  : toast.type === 'warning'
                  ? 'text-yellow-700 dark:text-yellow-300'
                  : 'text-blue-700 dark:text-blue-300'
              }`}
            >
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toaster;