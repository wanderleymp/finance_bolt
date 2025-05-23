import React, { useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { mockWidgets, mockTransactions, mockTasks, mockNotifications } from '../data/mockData';
import FinancialSummaryWidget from '../components/widgets/FinancialSummaryWidget';
import TasksWidget from '../components/widgets/TasksWidget';
import NotificationsWidget from '../components/widgets/NotificationsWidget';
import ActivitiesWidget from '../components/widgets/ActivitiesWidget';
import ChartWidget from '../components/widgets/ChartWidget';
import { Gauge, Plus, PlusCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { selectedCompany } = useTenant();
  const [widgets, setWidgets] = useState(mockWidgets);
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  
  // Filtrar transações por empresa
  const companyTransactions = mockTransactions.filter(
    (tx) => tx.companyId === selectedCompany?.id
  );
  
  // Calcular resumo financeiro
  const financialSummary = {
    totalIncome: companyTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalExpense: companyTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0),
    balance: 0,
    period: 'month' as const,
  };
  
  financialSummary.balance = financialSummary.totalIncome - financialSummary.totalExpense;

  const handleAddWidget = (type: string) => {
    // Função para adicionar novo widget (simulada)
    setIsAddingWidget(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visão geral da sua empresa
          </p>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsAddingWidget(!isAddingWidget)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle size={16} className="mr-1.5" />
            Adicionar Widget
          </button>
          
          {isAddingWidget && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {['financial', 'tasks', 'notifications', 'activities', 'calendar', 'messages', 'chart'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAddWidget(type)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    role="menuitem"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center space-x-4 border border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <Gauge className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Receitas (mês)</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {financialSummary.totalIncome.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center space-x-4 border border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <Gauge className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Despesas (mês)</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {financialSummary.totalExpense.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center space-x-4 border border-gray-200 dark:border-gray-700">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo (mês)</p>
            <p className={`text-2xl font-semibold ${
              financialSummary.balance >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {financialSummary.balance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialSummaryWidget 
            data={{
              income: financialSummary.totalIncome,
              expense: financialSummary.totalExpense,
              balance: financialSummary.balance,
              transactions: companyTransactions,
            }}
          />
        </div>
        
        <div>
          <TasksWidget data={mockTasks} />
        </div>
        
        <div>
          <NotificationsWidget data={mockNotifications} />
        </div>
        
        <div>
          <ActivitiesWidget />
        </div>
        
        <div className="lg:col-span-3">
          <ChartWidget 
            title="Fluxo de Caixa"
            data={{
              labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
              datasets: [
                {
                  label: 'Receitas',
                  data: [12000, 15000, 10000, 18000, 14000, 16000],
                  color: '#4CAF50',
                },
                {
                  label: 'Despesas',
                  data: [8000, 9000, 11000, 12000, 9500, 10200],
                  color: '#F44336',
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;