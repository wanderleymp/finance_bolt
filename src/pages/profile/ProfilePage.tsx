import React from 'react';

const ProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Perfil</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 bg-gray-50 p-8 border-r">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">JD</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold">João da Silva</h2>
              <p className="text-gray-600">Administrador</p>
              
              <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full">
                Alterar Foto
              </button>
            </div>
            
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Informações de Contato</h3>
              <p className="mb-1"><span className="font-medium">Email:</span> joao.silva@exemplo.com</p>
              <p className="mb-1"><span className="font-medium">Telefone:</span> (11) 98765-4321</p>
              <p><span className="font-medium">Cargo:</span> Gerente Financeiro</p>
            </div>
          </div>
          
          <div className="md:w-2/3 p-8">
            <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
            
            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="João"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="da Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="joao.silva@exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input 
                    type="tel" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="(11) 98765-4321"
                  />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-4 mt-8">Alterar Senha</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;