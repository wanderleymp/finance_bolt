import React from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';

// Tipos de comandos suportados
export type CommandType = 'create' | 'read' | 'update' | 'delete' | 'list' | 'help' | 'unknown';

// Entidades suportadas
export type EntityType = 'transaction' | 'task' | 'user' | 'company' | 'tenant' | 'organization' | 'unknown';

// Interface para comandos processados
export interface ProcessedCommand {
  type: CommandType;
  entity: EntityType;
  filters?: Record<string, any>;
  data?: Record<string, any>;
  id?: string;
  rawText: string;
}

// Mapeamento de entidades para tabelas do Supabase
const ENTITY_TABLE_MAP: Record<EntityType, string> = {
  transaction: 'transactions',
  task: 'tasks',
  user: 'users',
  company: 'companies',
  tenant: 'tenants',
  organization: 'organizations',
  unknown: ''
};

// Função para processar comandos em linguagem natural
export const processCommand = (text: string): ProcessedCommand => {
  const lowerText = text.toLowerCase();
  
  // Identificar tipo de comando
  let type: CommandType = 'unknown';
  if (lowerText.includes('cria') || lowerText.includes('nova') || lowerText.includes('adiciona') || lowerText.includes('cadastra')) {
    type = 'create';
  } else if (lowerText.includes('busca') || lowerText.includes('encontra') || lowerText.includes('procura') || lowerText.includes('mostra')) {
    type = 'read';
  } else if (lowerText.includes('atualiza') || lowerText.includes('altera') || lowerText.includes('modifica') || lowerText.includes('edita')) {
    type = 'update';
  } else if (lowerText.includes('deleta') || lowerText.includes('remove') || lowerText.includes('exclui') || lowerText.includes('apaga')) {
    type = 'delete';
  } else if (lowerText.includes('lista') || lowerText.includes('todos') || lowerText.includes('todas') || lowerText.includes('exibe')) {
    type = 'list';
  } else if (lowerText.includes('ajuda') || lowerText.includes('help') || lowerText.includes('como')) {
    type = 'help';
  }
  
  // Identificar entidade
  let entity: EntityType = 'unknown';
  if (lowerText.includes('transação') || lowerText.includes('transacao') || lowerText.includes('pagamento') || lowerText.includes('recebimento')) {
    entity = 'transaction';
  } else if (lowerText.includes('tarefa') || lowerText.includes('task') || lowerText.includes('atividade')) {
    entity = 'task';
  } else if (lowerText.includes('usuário') || lowerText.includes('usuario') || lowerText.includes('user')) {
    entity = 'user';
  } else if (lowerText.includes('empresa') || lowerText.includes('company')) {
    entity = 'company';
  } else if (lowerText.includes('tenant') || lowerText.includes('cliente')) {
    entity = 'tenant';
  } else if (lowerText.includes('organização') || lowerText.includes('organizacao') || lowerText.includes('organization')) {
    entity = 'organization';
  }
  
  // Extrair filtros e dados (implementação básica)
  const filters: Record<string, any> = {};
  const data: Record<string, any> = {};
  
  // Extrair ID se mencionado
  const idMatch = lowerText.match(/id\s*[=:]\s*(\w+)/) || lowerText.match(/com\s+id\s+(\w+)/);
  const id = idMatch ? idMatch[1] : undefined;
  
  return {
    type,
    entity,
    filters,
    data,
    id,
    rawText: text
  };
};

// Hook para executar comandos CRUD
export const useCommandExecutor = () => {
  const { user } = useAuth();
  const { selectedTenant, selectedCompany } = useTenant();
  
  // Verificar permissões do usuário para a operação
  const checkPermissions = (command: ProcessedCommand): boolean => {
    // Implementação básica - verificar se o usuário está autenticado
    if (!user) return false;
    
    // Verificar se o tenant está selecionado para operações que exigem contexto
    if (['create', 'update', 'delete'].includes(command.type) && !selectedTenant) {
      return false;
    }
    
    // Regras específicas por entidade e tipo de operação podem ser adicionadas aqui
    
    return true;
  };
  
  // Executar o comando no banco de dados
  const executeCommand = async (command: ProcessedCommand): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> => {
    try {
      // Verificar permissões
      if (!checkPermissions(command)) {
        return {
          success: false,
          error: 'Você não tem permissão para executar esta operação'
        };
      }
      
      // Obter tabela correspondente à entidade
      const table = ENTITY_TABLE_MAP[command.entity];
      if (!table) {
        return {
          success: false,
          error: `Entidade "${command.entity}" não suportada`
        };
      }
      
      // Executar operação com base no tipo de comando
      switch (command.type) {
        case 'create':
          // Adicionar tenant_id e company_id quando aplicável
          const createData = { ...command.data };
          if (['transaction', 'task', 'organization'].includes(command.entity)) {
            if (selectedTenant) createData.tenant_id = selectedTenant.id;
          }
          if (command.entity === 'transaction' && selectedCompany) {
            createData.company_id = selectedCompany.id;
          }
          
          const { data: createdData, error: createError } = await supabase
            .from(table)
            .insert([createData])
            .select();
          
          if (createError) throw createError;
          
          return {
            success: true,
            data: createdData,
            message: `${command.entity} criado(a) com sucesso`
          };
          
        case 'read':
          let query = supabase.from(table).select('*');
          
          // Aplicar filtros
          if (command.filters) {
            Object.entries(command.filters).forEach(([key, value]) => {
              query = query.eq(key, value);
            });
          }
          
          // Filtrar por ID se fornecido
          if (command.id) {
            query = query.eq('id', command.id);
          }
          
          // Aplicar filtros de tenant e company quando aplicável
          if (['transaction', 'task', 'organization'].includes(command.entity) && selectedTenant) {
            query = query.eq('tenant_id', selectedTenant.id);
          }
          if (command.entity === 'transaction' && selectedCompany) {
            query = query.eq('company_id', selectedCompany.id);
          }
          
          const { data: readData, error: readError } = await query;
          
          if (readError) throw readError;
          
          return {
            success: true,
            data: readData,
            message: readData.length > 0 
              ? `Encontrado(s) ${readData.length} registro(s)`
              : 'Nenhum registro encontrado'
          };
          
        case 'update':
          if (!command.id) {
            return {
              success: false,
              error: 'ID não fornecido para atualização'
            };
          }
          
          const { data: updatedData, error: updateError } = await supabase
            .from(table)
            .update(command.data)
            .eq('id', command.id)
            .select();
          
          if (updateError) throw updateError;
          
          return {
            success: true,
            data: updatedData,
            message: `${command.entity} atualizado(a) com sucesso`
          };
          
        case 'delete':
          if (!command.id) {
            return {
              success: false,
              error: 'ID não fornecido para exclusão'
            };
          }
          
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', command.id);
          
          if (deleteError) throw deleteError;
          
          return {
            success: true,
            message: `${command.entity} excluído(a) com sucesso`
          };
          
        case 'list':
          let listQuery = supabase.from(table).select('*');
          
          // Aplicar filtros de tenant e company quando aplicável
          if (['transaction', 'task', 'organization'].includes(command.entity) && selectedTenant) {
            listQuery = listQuery.eq('tenant_id', selectedTenant.id);
          }
          if (command.entity === 'transaction' && selectedCompany) {
            listQuery = listQuery.eq('company_id', selectedCompany.id);
          }
          
          // Limitar resultados para não sobrecarregar
          listQuery = listQuery.limit(20);
          
          const { data: listData, error: listError } = await listQuery;
          
          if (listError) throw listError;
          
          return {
            success: true,
            data: listData,
            message: `Listando ${listData.length} ${command.entity}(s)`
          };
          
        case 'help':
          return {
            success: true,
            message: `Comandos disponíveis:
- Criar: "Crie uma nova [entidade] com [dados]"
- Buscar: "Busque [entidade] com id [id]" ou "Encontre [entidade] onde [campo] é [valor]"
- Atualizar: "Atualize [entidade] com id [id] definindo [campo] como [valor]"
- Excluir: "Exclua [entidade] com id [id]"
- Listar: "Liste todas as [entidades]"

Entidades disponíveis: transação, tarefa, usuário, empresa, tenant, organização`
          };
          
        default:
          return {
            success: false,
            error: 'Tipo de comando não reconhecido'
          };
      }
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao executar comando'
      };
    }
  };
  
  return { executeCommand };
};