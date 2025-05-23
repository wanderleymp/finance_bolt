import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Carrega as variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não estão definidas!');
  console.error('Por favor, conecte-se ao Supabase usando o botão "Connect to Supabase" no canto superior direito.');
}

// Cria e exporta o cliente Supabase
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Função para verificar se o usuário atual é administrador
export const isUserAdmin = async () => {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Verificação direta para superadmin
    if (user.email === 'super@financeia.com.br') {
      console.log("Super admin detectado pelo email:", user.email);
      return true;
    }
    
    // Buscar o papel do usuário na tabela users
    const { data, error } = await supabase
      .from('users')
      .select('role, is_super')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Erro ao verificar papel do usuário:', error);
      return false;
    }
    
    const isAdmin = data.role === 'admin' || 
                    data.role === 'superadmin' || 
                    data.is_super === true;
    
    console.log(`Verificação de admin para ${user.email}: ${isAdmin ? 'É admin' : 'Não é admin'}`);
    return isAdmin;
  } catch (error) {
    console.error('Erro ao verificar se o usuário é administrador:', error);
    return false;
  }
};

// Função para verificar permissões baseada em localStorage/sessionStorage
export const checkUserPermissions = () => {
  // Verificar se há um usuário no localStorage ou sessionStorage
  const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!storedUser) return false;
  
  try {
    const user = JSON.parse(storedUser);
    
    // Verificação direta para super@financeia.com.br
    if (user.email === 'super@financeia.com.br') {
      console.log("Super admin detectado no storage pelo email:", user.email);
      return true;
    }
    
    const isAdmin = user.role === 'admin' || 
                    user.role === 'superadmin' || 
                    user.is_super === true;
    
    console.log(`Verificação de admin (storage) para ${user.email}: ${isAdmin ? 'É admin' : 'Não é admin'}`);
    return isAdmin;
  } catch (error) {
    console.error('Erro ao verificar permissões do usuário armazenado:', error);
    return false;
  }
};

// Função para obter o token de autenticação atual
export const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};