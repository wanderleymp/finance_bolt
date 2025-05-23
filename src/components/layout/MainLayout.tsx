import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistant from '../ai/AIAssistant';
import { useUI } from '../../contexts/UIContext';

const MainLayout: React.FC = () => {
  const { sidebarOpen, aiAssistantOpen } = useUI();
  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Efeito para detectar o hover no sidebar
  useEffect(() => {
    const sidebarElement = document.querySelector('aside');
    
    if (sidebarElement) {
      const handleMouseEnter = () => setSidebarHovered(true);
      const handleMouseLeave = () => setSidebarHovered(false);
      
      sidebarElement.addEventListener('mouseenter', handleMouseEnter);
      sidebarElement.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        sidebarElement.removeEventListener('mouseenter', handleMouseEnter);
        sidebarElement.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  // Calculando a margem esquerda dinamicamente
  const leftMargin = sidebarOpen ? 'ml-64' : (sidebarHovered ? 'ml-64' : 'ml-16');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${leftMargin}`}
        style={{ transition: 'margin-left 0.3s ease' }}
      >
        <Header />
        
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* AI Assistant */}
      {aiAssistantOpen && <AIAssistant />}
    </div>
  );
};

export default MainLayout;