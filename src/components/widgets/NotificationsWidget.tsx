import React from 'react';
import { Bell, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Notification } from '../../types';

interface NotificationsWidgetProps {
  data: Notification[];
}

const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({ data }) => {
  // Ordenar notificações por data (mais recentes primeiro) e se foram lidas
  const sortedNotifications = [...data].sort((a, b) => {
    // Primeiro critério: não lidas primeiro
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    
    // Segundo critério: data mais recente primeiro
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500 dark:text-yellow-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500 dark:text-red-400" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-500 dark:text-green-400" />;
      default:
        return <Info size={16} className="text-blue-500 dark:text-blue-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Bell className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Notificações
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
            {data.filter(n => !n.read).length} novas
          </span>
        </div>
        
        {sortedNotifications.length > 0 ? (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-3 rounded-lg transition-colors cursor-pointer border ${
                  !notification.read
                    ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50'
                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        !notification.read
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notification.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500 dark:text-gray-400">
            <Bell size={32} className="mb-2" />
            <p>Sem notificações</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
            Ver todas as notificações
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsWidget;