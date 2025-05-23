import React from 'react';

const FinancialPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Financeiro</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-700">Bem-vindo à página de gerenciamento financeiro. Aqui você poderá visualizar seu resumo financeiro, transações e outras informações importantes.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800">Receitas</h3>
            <p className="text-2xl font-bold text-blue-600">R$ 0,00</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h3 className="font-semibold text-red-800">Despesas</h3>
            <p className="text-2xl font-bold text-red-600">R$ 0,00</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="font-semibold text-green-800">Saldo</h3>
            <p className="text-2xl font-bold text-green-600">R$ 0,00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialPage;