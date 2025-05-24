import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Carrega as variáveis de ambiente do Supabase para o cliente admin
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Verifica se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Erro: Variáveis de ambiente do Supabase Admin não estão definidas!\n' +
    'Para operações administrativas, é necessário configurar:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Cria e exporta o cliente Supabase Admin com a service role key
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Função para atualizar um módulo ignorando as políticas RLS
export const updateModuleBypassRLS = async (
  moduleId: string, 
  updateData: Record<string, any>
) => {
  if (!moduleId) {
    throw new Error('ID do módulo não fornecido');
  }

  // Verificar se o módulo existe
  const { data: existingModule, error: fetchError } = await supabaseAdmin
    .from('saas_modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (fetchError) {
    console.error('Erro ao verificar existência do módulo:', fetchError);
    throw new Error(`Erro ao verificar existência do módulo: ${fetchError.message}`);
  }

  if (!existingModule) {
    throw new Error('Módulo não encontrado');
  }

  // Atualizar o módulo usando o cliente admin (ignora RLS)
  const { data, error } = await supabaseAdmin
    .from('saas_modules')
    .update(updateData)
    .eq('id', moduleId)
    .select();

  if (error) {
    console.error('Erro ao atualizar módulo (admin):', error);
    throw error;
  }

  return { data, error };
};