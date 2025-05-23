import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { TenantProvider } from './contexts/TenantContext';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/Toaster';
import { supabase } from './lib/supabase';

// Supabase providers
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { SupabaseTenantProvider } from './contexts/SupabaseTenantContext';

function App() {
  // Verificar se as credenciais do Supabase estão configuradas
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('AVISO: Variáveis de ambiente do Supabase não encontradas.');
      console.info('Por favor, conecte-se ao Supabase usando o botão no canto superior direito ou configure as variáveis de ambiente.');
    }
  }, []);

  // Verificar se estamos usando o mock ou o Supabase real
  const useSupabaseAuth = import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

  return (
    <Router>
      <UIProvider>
        {useSupabaseAuth ? (
          // Usando autenticação real do Supabase
          <SupabaseAuthProvider>
            <SupabaseTenantProvider>
              <AppRoutes />
              <Toaster />
            </SupabaseTenantProvider>
          </SupabaseAuthProvider>
        ) : (
          // Usando AuthProvider mock para desenvolvimento
          <AuthProvider>
            <TenantProvider>
              <AppRoutes />
              <Toaster />
            </TenantProvider>
          </AuthProvider>
        )}
      </UIProvider>
    </Router>
  );
}

export default App;