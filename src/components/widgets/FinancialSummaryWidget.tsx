import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Transaction } from '../../types';

interface FinancialSummaryWidgetProps {
  data: {
    income: number;
    expense: number;
    balance: number;
    transactions: Transaction[];
  };
}

const FinancialSummaryWidget: React.FC<FinancialSummaryWidgetProps> = ({ data }) => {
  // Filtrar para mostrar apenas as transações mais recentes
  const recentTransactions = [...data.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Resumo Financeiro
          </h2>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Receitas</p>
              <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-2 text-xl font-semibold text-green-700 dark:text-green-300">
              {data.income.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Despesas</p>
              <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="mt-2 text-xl font-semibold text-red-700 dark:text-red-300">
              {data.expense.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Saldo</p>
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className={`mt-2 text-xl font-semibold ${
              data.balance >= 0
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`}>
              {data.balance.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Transações Recentes
          </h3>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    <DollarSign size={16} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')} • {transaction.category}
                    </p>
                  </div>
                </div>
                <div className={`text-sm font-medium ${
                  transaction.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
              Ver todas as transações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryWidget;