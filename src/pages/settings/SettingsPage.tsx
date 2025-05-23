import React, { useState } from 'react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/4 bg-gray-50 p-4 md:p-8 border-r">
            <nav className="space-y-2">
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('general')}
              >
                Geral
              </button>
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'company' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('company')}
              >
                Empresa
              </button>
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('users')}
              >
                Usuários
              </button>
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'notifications' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notificações
              </button>
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'billing' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('billing')}
              >
                Faturamento
              </button>
              <button 
                className={`w-full text-left px-4 py-2 rounded-md font-medium ${activeTab === 'security' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('security')}
              >
                Segurança
              </button>
            </nav>
          </div>
          
          <div className="md:w-3/4 p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Configurações Gerais</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <select className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">Inglês (EUA)</option>
                      <option value="es">Espanhol</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuso Horário</label>
                    <select className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
                      <option value="America/New_York">América/Nova York (GMT-5)</option>
                      <option value="Europe/London">Europa/Londres (GMT+0)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato de Data</label>
                    <select className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="darkMode" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="darkMode" className="ml-2 block text-sm text-gray-700">
                      Ativar modo escuro
                    </label>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'company' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Configurações da Empresa</h2>
                
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Empresa Exemplo Ltda."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="12.345.678/0001-90"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue="Av. Paulista, 1000, São Paulo - SP"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="contato@empresa.com.br"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <input 
                        type="tel" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue="(11) 3456-7890"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition mr-3">
                      Cancelar
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Outros conteúdos de abas seriam renderizados aqui */}
            {(activeTab !== 'general' && activeTab !== 'company') && (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-600">Conteúdo para a aba "{
                  activeTab === 'users' ? 'Usuários' : 
                  activeTab === 'notifications' ? 'Notificações' : 
                  activeTab === 'billing' ? 'Faturamento' : 'Segurança'
                }" em desenvolvimento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;