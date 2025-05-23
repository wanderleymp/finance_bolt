import React, { useState } from 'react';

const TasksPage: React.FC = () => {
  const initialTasks = [
    { id: 1, title: 'Revisar contrato', priority: 'Alta', status: 'Pendente', dueDate: '25/05/2025' },
    { id: 2, title: 'Preparar relatório mensal', priority: 'Média', status: 'Em progresso', dueDate: '30/05/2025' },
    { id: 3, title: 'Reunião com cliente', priority: 'Alta', status: 'Pendente', dueDate: '22/05/2025' },
    { id: 4, title: 'Atualizar documentação', priority: 'Baixa', status: 'Concluída', dueDate: '15/05/2025' },
  ];

  const [tasks] = useState(initialTasks);
  const [filter, setFilter] = useState('all');

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => 
        filter === 'pendente' ? task.status === 'Pendente' : 
        filter === 'progresso' ? task.status === 'Em progresso' : 
        filter === 'concluida' ? task.status === 'Concluída' : true
      );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tarefas</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center border-b">
          <h2 className="text-lg font-semibold mb-3 sm:mb-0">Lista de Tarefas</h2>
          
          <div className="flex space-x-2">
            <div className="relative">
              <select 
                className="pl-3 pr-8 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todas</option>
                <option value="pendente">Pendentes</option>
                <option value="progresso">Em Progresso</option>
                <option value="concluida">Concluídas</option>
              </select>
            </div>
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Nova Tarefa
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarefa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Limite
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                      task.priority === 'Média' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'Pendente' ? 'bg-gray-100 text-gray-800' : 
                      task.status === 'Em progresso' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                    <button className="text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;