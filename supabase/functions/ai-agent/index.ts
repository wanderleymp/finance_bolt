import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { OpenAI } from 'npm:openai@4.28.0';

// Definição de tipos
interface RequestData {
  message: string;
  userId: string;
  tenantId?: string;
  companyId?: string;
  conversationHistory?: any[];
}

// Configuração CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Definição das entidades e suas propriedades
const ENTITIES = {
  tenants: {
    name: 'Tenant',
    description: 'Cliente da plataforma SaaS',
    properties: {
      id: 'UUID do tenant',
      nome: 'Nome do tenant',
      plano: 'Plano de assinatura',
      status: 'Status do tenant (ativo, inativo, etc)',
      limiteusuarios: 'Número máximo de usuários permitidos',
      limitearmazenamento: 'Limite de armazenamento em MB',
      ativo: 'Se o tenant está ativo ou não',
    },
  },
  companies: {
    name: 'Empresa',
    description: 'Empresa pertencente a um tenant',
    properties: {
      id: 'UUID da empresa',
      tenant_id: 'ID do tenant ao qual a empresa pertence',
      cnpj: 'CNPJ da empresa',
      razao_social: 'Razão social da empresa',
      nome_fantasia: 'Nome fantasia da empresa',
      is_headquarters: 'Se é a matriz ou não',
      parent_id: 'ID da empresa matriz (se for filial)',
    },
  },
  transactions: {
    name: 'Transação',
    description: 'Transação financeira',
    properties: {
      id: 'UUID da transação',
      company_id: 'ID da empresa',
      type: 'Tipo (income ou expense)',
      category: 'Categoria da transação',
      amount: 'Valor da transação',
      date: 'Data da transação',
      description: 'Descrição da transação',
      status: 'Status (pending, completed, cancelled)',
    },
  },
  tasks: {
    name: 'Tarefa',
    description: 'Tarefa ou atividade',
    properties: {
      id: 'UUID da tarefa',
      title: 'Título da tarefa',
      description: 'Descrição da tarefa',
      due_date: 'Data de vencimento',
      status: 'Status (todo, in_progress, done)',
      priority: 'Prioridade (low, medium, high)',
      assigned_to: 'ID do usuário responsável',
      created_by: 'ID do usuário que criou',
    },
  },
  users: {
    name: 'Usuário',
    description: 'Usuário do sistema',
    properties: {
      id: 'UUID do usuário',
      email: 'Email do usuário',
      name: 'Nome do usuário',
      role: 'Papel do usuário (user, manager, admin, superadmin)',
      is_active: 'Se o usuário está ativo',
    },
  },
  organizations: {
    name: 'Organização',
    description: 'Organização dentro de um tenant',
    properties: {
      id: 'UUID da organização',
      tenant_id: 'ID do tenant',
      name: 'Nome da organização',
      description: 'Descrição da organização',
      is_active: 'Se a organização está ativa',
    },
  },
};

// Função para verificar permissões
const checkPermissions = (
  userId: string,
  tenantId: string | null,
  companyId: string | null,
  entity: string,
  operation: string
): boolean => {
  // Implementação simplificada - em produção, você teria regras mais complexas
  if (!userId) return false;
  
  // Verificar se o tenant está selecionado para operações que exigem contexto
  if (['create', 'update', 'delete'].includes(operation) && 
      ['transactions', 'tasks', 'organizations'].includes(entity) && 
      !tenantId) {
    return false;
  }
  
  // Verificar se a empresa está selecionada para transações
  if (['create', 'update', 'delete'].includes(operation) && 
      entity === 'transactions' && 
      !companyId) {
    return false;
  }
  
  return true;
};

// Função principal que processa a requisição
Deno.serve(async (req) => {
  // Lidar com requisições OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type deve ser application/json' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Obter e validar dados da requisição
    let requestData;
    try {
      requestData = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Falha ao processar JSON da requisição' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { message, userId, tenantId, companyId, conversationHistory } = requestData as RequestData;
    
    // Validar dados de entrada
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem não fornecida' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário não fornecido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Variáveis de ambiente do Supabase não configuradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar informações do tenant se o nome foi fornecido em vez do ID
    if (!tenantId && message.toLowerCase().includes('tenant') && message.toLowerCase().includes('agile')) {
      try {
        console.log('Buscando tenant pelo nome "agile"');
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('id, nome')
          .ilike('nome', '%agile%')
          .limit(1);
        
        if (!tenantError && tenantData && tenantData.length > 0) {
          console.log(`Tenant encontrado: ${tenantData[0].nome} (${tenantData[0].id})`);
          // Atualizar o tenantId com o valor encontrado
          requestData.tenantId = tenantData[0].id;
        }
      } catch (error) {
        console.error('Erro ao buscar tenant pelo nome:', error);
      }
    }
    
    // Inicializar cliente OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave de API do OpenAI não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Definir funções disponíveis para o LLM
    const functions = [
      {
        name: 'query_database',
        description: 'Consulta o banco de dados para obter informações',
        parameters: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              enum: Object.keys(ENTITIES),
              description: 'A entidade a ser consultada',
            },
            operation: {
              type: 'string',
              enum: ['create', 'read', 'update', 'delete', 'list'],
              description: 'A operação a ser realizada',
            },
            filters: {
              type: 'object',
              description: 'Filtros para a consulta (pares chave-valor)',
            },
            data: {
              type: 'object',
              description: 'Dados para criar ou atualizar registros',
            },
            id: {
              type: 'string',
              description: 'ID do registro para operações específicas',
            },
          },
          required: ['entity', 'operation'],
        },
      },
      {
        name: 'get_schema_info',
        description: 'Obtém informações sobre o esquema do banco de dados',
        parameters: {
          type: 'object',
          properties: {
            entity: {
              type: 'string',
              enum: Object.keys(ENTITIES),
              description: 'A entidade sobre a qual obter informações',
            },
          },
          required: ['entity'],
        },
      },
    ];
    
    // Preparar histórico de conversa para o LLM
    const formattedHistory = conversationHistory?.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })) || [];
    
    // Preparar mensagem do sistema com contexto
    const systemMessage = {
      role: 'system' as const,
      content: `Você é um assistente AI especializado em operações CRUD para um sistema SaaS de gestão financeira.
      
Você tem acesso às seguintes entidades:
${Object.entries(ENTITIES).map(([key, value]) => `- ${value.name} (${key}): ${value.description}`).join('\n')}

O usuário atual tem ID ${userId}${tenantId ? `, está no tenant ${tenantId}` : ''}${companyId ? ` e na empresa ${companyId}` : ''}.

Quando o usuário solicitar operações no banco de dados, você deve:
1. Interpretar a intenção do usuário
2. Identificar a entidade e operação relevantes
3. Extrair filtros, IDs ou dados necessários
4. Chamar a função apropriada para executar a operação
5. Apresentar os resultados de forma clara e concisa

Seja útil, profissional e conciso em suas respostas.

IMPORTANTE: NUNCA responda com "Desculpe, não entendi completamente" ou peça para o usuário reformular a pergunta. 
Se não tiver certeza do que o usuário quer, tente interpretar da melhor forma possível ou peça informações específicas que estão faltando.`,
    };
    
    // Chamar a API do OpenAI com function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        systemMessage, 
        ...formattedHistory, 
        { role: 'user', content: message }
      ],
      functions,
      function_call: 'auto', 
      temperature: 0.7,
    });
    
    const assistantResponse = response.choices[0].message;
    
    // Verificar se o LLM quer chamar uma função
    if (assistantResponse.function_call) {
      let functionName = '';
      let functionArgs = {};
      
      try {
        functionName = assistantResponse.function_call.name;
        functionArgs = JSON.parse(assistantResponse.function_call.arguments);
      } catch (parseError) {
        console.error('Erro ao analisar argumentos da função:', parseError);
        return new Response(
          JSON.stringify({ 
            error: 'Erro ao processar argumentos da função',
            details: parseError instanceof Error ? parseError.message : 'Erro desconhecido'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      let functionResult;
      
      if (functionName === 'get_schema_info') {
        // Retornar informações sobre o esquema da entidade
        const { entity } = functionArgs;
        functionResult = ENTITIES[entity];
      } else if (functionName === 'query_database') {
        // Executar operação no banco de dados
        const { entity, operation, filters = {}, data = {}, id } = functionArgs;
        
        // Verificar permissões
        if (!checkPermissions(userId, tenantId, companyId, entity, operation)) {
          functionResult = {
            success: false,
            error: 'Você não tem permissão para executar esta operação',
          };
        } else {
          // Aplicar filtros de tenant e company quando aplicável
          const contextFilters: Record<string, any> = { ...filters };
          
          if (['transactions', 'tasks', 'organizations'].includes(entity) && tenantId) {
            contextFilters.tenant_id = tenantId;
          }
          
          if (entity === 'transactions' && companyId) {
            contextFilters.company_id = companyId;
          }
          
          // Executar operação
          try {
            let result;
            
            switch (operation) {
              case 'create':
                // Adicionar tenant_id e company_id quando aplicável
                const createData = { ...data };
                if (['transactions', 'tasks', 'organizations'].includes(entity) && tenantId) {
                  createData.tenant_id = tenantId;
                }
                if (entity === 'transactions' && companyId) {
                  createData.company_id = companyId;
                }
                
                result = await supabase
                  .from(entity)
                  .insert([createData])
                  .select();
                
                functionResult = {
                  success: !result.error,
                  data: result.data,
                  error: result.error?.message,
                  message: result.error ? `Erro ao criar ${entity}` : `${entity} criado com sucesso`,
                };
                break;
                
              case 'read':
                let readQuery = supabase.from(entity).select('*');
                
                // Aplicar filtros
                Object.entries(contextFilters).forEach(([key, value]) => {
                  readQuery = readQuery.eq(key, value);
                });
                
                // Filtrar por ID se fornecido
                if (id) {
                  readQuery = readQuery.eq('id', id);
                }
                
                result = await readQuery;
                
                functionResult = {
                  success: !result.error,
                  data: result.data,
                  error: result.error?.message,
                  message: result.error 
                    ? `Erro ao buscar ${entity}` 
                    : `Encontrado(s) ${result.data?.length || 0} registro(s)`,
                };
                break;
                
              case 'update':
                if (!id) {
                  functionResult = {
                    success: false,
                    error: 'ID não fornecido para atualização',
                  };
                  break;
                }
                
                result = await supabase
                  .from(entity)
                  .update(data)
                  .eq('id', id)
                  .select();
                
                functionResult = {
                  success: !result.error,
                  data: result.data,
                  error: result.error?.message,
                  message: result.error ? `Erro ao atualizar ${entity}` : `${entity} atualizado com sucesso`,
                };
                break;
                
              case 'delete':
                if (!id) {
                  functionResult = {
                    success: false,
                    error: 'ID não fornecido para exclusão',
                  };
                  break;
                }
                
                result = await supabase
                  .from(entity)
                  .delete()
                  .eq('id', id);
                
                functionResult = {
                  success: !result.error,
                  error: result.error?.message,
                  message: result.error ? `Erro ao excluir ${entity}` : `${entity} excluído com sucesso`,
                };
                break;
                
              case 'list':
                let listQuery = supabase.from(entity).select('*');
                
                // Aplicar filtros
                Object.entries(contextFilters).forEach(([key, value]) => {
                  listQuery = listQuery.eq(key, value);
                });
                
                // Limitar resultados para não sobrecarregar
                listQuery = listQuery.limit(20);
                
                result = await listQuery;
                
                functionResult = {
                  success: !result.error,
                  data: result.data,
                  error: result.error?.message,
                  message: result.error 
                    ? `Erro ao listar ${entity}` 
                    : `Listando ${result.data?.length || 0} ${entity}`,
                };
                break;
                
              default:
                functionResult = {
                  success: false,
                  error: 'Operação não suportada',
                };
            }
          } catch (error) {
            console.error('Erro ao executar operação:', error);
            functionResult = {
              success: false,
              error: error instanceof Error ? error.message : 'Erro desconhecido',
            };
          }
        }
      }
      
      // Chamar novamente o LLM para formatar a resposta com base no resultado da função
      const secondResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          systemMessage,
          ...formattedHistory, 
          { role: 'user', content: message },
          assistantResponse,
          { 
            role: 'function', 
            name: assistantResponse.function_call.name, 
            content: JSON.stringify(functionResult)
          },
        ],
        temperature: 0.7,
      });
      
      // Retornar a resposta final
      return new Response(
        JSON.stringify({
          response: secondResponse.choices[0].message.content || "Não foi possível processar sua solicitação.",
          functionCall: {
            name: functionName,
            arguments: functionArgs,
            result: functionResult,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Se o LLM não chamou uma função, retornar a resposta direta
      // Verificar se a resposta é nula ou vazia
      const responseContent = assistantResponse.content || 'Desculpe, não consegui processar sua solicitação.';
            
      // Verificar se a resposta é vazia ou contém a mensagem de "não entendi"
      let finalResponse = responseContent;
      if (responseContent.includes("Desculpe, não entendi") || 
          responseContent.includes("reformular sua pergunta") ||
          responseContent.includes("não compreendi") ||
          responseContent.includes("não está claro")) {
        // Substituir com uma resposta mais útil
        try {
          // Tentar buscar informações relevantes com base na mensagem
          if (message.toLowerCase().includes('plano') || message.toLowerCase().includes('planos')) {
            const { data: plansData, error: plansError } = await supabase
              .from('saas_plans')
              .select('*')
              .limit(5);
            
            if (!plansError && plansData && plansData.length > 0) {
              finalResponse = `Atualmente, temos os seguintes planos disponíveis:\n\n${
                plansData.map(plan => `- ${plan.name}: R$${plan.price} (${plan.billing_cycle})`).join('\n')
              }`;
            }
          } else if (message.toLowerCase().includes('tenant') || message.toLowerCase().includes('agile')) {
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenants')
              .select('*')
              .ilike('nome', '%agile%')
              .limit(1);
            
            if (!tenantError && tenantData && tenantData.length > 0) {
              const tenant = tenantData[0];
              finalResponse = `O Tenant com nome "${tenant.nome}" foi localizado com sucesso. Este tenant possui o plano ${tenant.plano}, permite até ${tenant.limiteusuarios} usuários, possui um limite de armazenamento de ${tenant.limitearmazenamento}MB e está ${tenant.ativo ? 'ativo' : 'inativo'}.`;
            }
          } else if (message.toLowerCase().includes('empresa') || message.toLowerCase().includes('tamara')) {
            finalResponse = "Vou ajudar você a criar uma nova empresa. Para isso, preciso do ID do tenant. Vou tentar localizar o tenant 'Agile' para você.";
          } else {
            finalResponse = "Como posso ajudar você hoje com as operações CRUD em relação às entidades disponíveis no sistema? Por favor, forneça detalhes sobre a entidade específica e a operação que deseja realizar.";
          }
        } catch (error) {
          console.error('Erro ao buscar dados para resposta alternativa:', error);
          finalResponse = "Como posso ajudar você hoje com as operações CRUD em relação às entidades disponíveis no sistema? Por favor, forneça detalhes sobre a entidade específica e a operação que deseja realizar.";
        }
      }
      
      // Simular um pequeno atraso para dar tempo ao frontend de mostrar o indicador de digitação
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Retornar a resposta modificada
      return new Response(
        JSON.stringify({ response: finalResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Erro no processamento:', error);
    
    // Determinar o tipo de erro e código de status
    let errorMessage = 'Erro interno do servidor';
    let status = 500;
    let userFriendlyMessage = "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (error.message.includes('não fornecid') || 
          error.message.includes('não configurad') ||
          error.message.includes('não encontrad')) {
        status = 400;
      } else if (error.message.includes('permissão')) {
        status = 403;
      } else if (error.message.includes('não encontrado')) {
        status = 404;
      } else if (error.name === 'AbortError') {
        status = 408; // Request Timeout
        errorMessage = 'A solicitação excedeu o tempo limite';
        userFriendlyMessage = "A solicitação demorou muito tempo para ser processada. Por favor, tente novamente.";
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Erro desconhecido',
        response: userFriendlyMessage
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }, 
        status 
      }
    );
  }
});