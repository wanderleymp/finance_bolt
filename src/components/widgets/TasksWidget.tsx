import React from 'react';
import { CheckSquare, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Task } from '../../types';

interface TasksWidgetProps {
  data: Task[];
}

const TasksWidget: React.FC<TasksWidgetProps> = ({ data }) => {
  // Filtrar para mostrar apenas tarefas pendentes
  const pendingTasks = data.filter((task) => task.status !== 'done');
  
  // Ordenar por prioridade e depois por data
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    
    return 0;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Tarefas Pendentes
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
            {pendingTasks.length}
          </span>
        </div>
        
        {sortedTasks.length > 0 ? (
          <div className="space-y-3">
            {sortedTasks.map((task) => (
              <div 
                key={task.id}
                className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                
                {task.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs">
                  {task.dueDate && (
                    <div className={`flex items-center mr-3 ${
                      isOverdue(task.dueDate) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {isOverdue(task.dueDate) ? (
                        <AlertCircle size={12} className="mr-1" />
                      ) : (
                        <Calendar size={12} className="mr-1" />
                      )}
                      <span>
                        {isOverdue(task.dueDate) ? 'Atrasada: ' : 'Prazo: '}
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Clock size={12} className="mr-1" />
                    <span>
                      {task.status === 'in_progress' ? 'Em andamento' : 'A fazer'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-500 dark:text-gray-400">
            <CheckSquare size={32} className="mb-2" />
            <p>Sem tarefas pendentes</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
            Ver todas as tarefas
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksWidget;