import React from 'react';
import { Activity, DollarSign, FileText, CheckSquare, Clock } from 'lucide-react';

const ActivitiesWidget: React.FC = () => {
  const activities = [
    {
      id: 'act1',
      type: 'transaction',
      title: 'Pagamento Recebido',
      description: 'Cliente XYZ pagou R$ 5.000,00',
      timestamp: '2023-05-15T10:30:00Z',
    },
    {
      id: 'act2',
      type: 'task',
      title: 'Tarefa Concluída',
      description: 'Resolver pendências bancárias',
      timestamp: '2023-05-15T09:15:00Z',
    },
    {
      id: 'act3',
      type: 'document',
      title: 'Documento Atualizado',
      description: 'Contrato de serviço foi revisado',
      timestamp: '2023-05-14T16:45:00Z',
    },
    {
      id: 'act4',
      type: 'transaction',
      title: 'Pagamento Enviado',
      description: 'Aluguel do escritório - R$ 3.500,00',
      timestamp: '2023-05-14T14:20:00Z',
    },
    {
      id: 'act5',
      type: 'document',
      title: 'Documento Criado',
      description: 'Proposta comercial para cliente ABC',
      timestamp: '2023-05-13T11:30:00Z',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign size={16} className="text-green-500 dark:text-green-400" />;
      case 'document':
        return <FileText size={16} className="text-blue-500 dark:text-blue-400" />;
      case 'task':
        return <CheckSquare size={16} className="text-purple-500 dark:text-purple-400" />;
      default:
        return <Activity size={16} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'document':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'task':
        return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours} h atrás`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Atividades Recentes
          </h2>
        </div>
        
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-8">
                <div className={`absolute left-0 mt-1.5 w-8 h-8 rounded-full flex items-center justify-center border ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
            Ver todas as atividades
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivitiesWidget;