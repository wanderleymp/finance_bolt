/*
  # Implementação de Agentes IA e Bases de Conhecimento

  1. Novas Tabelas
    - `ai_agent_templates`: Templates para criar agentes IA
    - `ai_agent_tools`: Ferramentas que os agentes podem utilizar
    - `ai_agent_conversations`: Conversas entre usuários e agentes
    - `ai_agent_messages`: Mensagens trocadas nas conversas
    - `ai_agent_feedback`: Feedback dos usuários sobre respostas
    - `ai_knowledge_bases`: Bases de conhecimento para RAG
    - `ai_knowledge_documents`: Documentos nas bases de conhecimento
    - `ai_document_chunks`: Chunks de documentos para embeddings

  2. Segurança
    - Políticas RLS para todas as tabelas
    - Separação entre recursos do sistema e de tenants

  3. Funções
    - Processamento de mensagens de agentes
    - Busca semântica em documentos
    - Criação automática de bases de conhecimento para tenants
*/

-- Tabela de Templates de Agentes
CREATE TABLE IF NOT EXISTS ai_agent_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  model_id uuid REFERENCES llm_models(id),
  parameters jsonb NOT NULL DEFAULT '{"temperature": 0.7, "top_p": 1.0}',
  system_prompt text,
  tools jsonb[],
  personality jsonb,
  icon text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Ferramentas para Agentes
CREATE TABLE IF NOT EXISTS ai_agent_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  function_schema jsonb NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  requires_auth boolean NOT NULL DEFAULT false,
  category text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Conversas com Agentes
CREATE TABLE IF NOT EXISTS ai_agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  title text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

-- Tabela de Mensagens de Conversas
CREATE TABLE IF NOT EXISTS ai_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES ai_agent_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
  content text,
  function_call jsonb,
  function_name text,
  function_arguments jsonb,
  function_result jsonb,
  tokens_used integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Feedback sobre Respostas
CREATE TABLE IF NOT EXISTS ai_agent_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES ai_agent_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Bases de Conhecimento
CREATE TABLE IF NOT EXISTS ai_knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  is_system boolean NOT NULL DEFAULT false,
  embedding_model_id uuid REFERENCES llm_models(id),
  chunk_size integer NOT NULL DEFAULT 1000,
  chunk_overlap integer NOT NULL DEFAULT 200,
  metadata jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Documentos em Bases de Conhecimento
CREATE TABLE IF NOT EXISTS ai_knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_base_id uuid NOT NULL REFERENCES ai_knowledge_bases(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  file_path text,
  file_type text,
  file_size integer,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb,
  embedding_status text NOT NULL DEFAULT 'pending',
  chunks_count integer,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Chunks de Documentos (para embeddings)
CREATE TABLE IF NOT EXISTS ai_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES ai_knowledge_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb,
  embedding_data jsonb, -- Armazenar embeddings como jsonb em vez de vector
  tokens_used integer,
  chunk_index integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE ai_agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_chunks ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para ai_agent_templates
CREATE POLICY "Admins can manage system templates"
  ON ai_agent_templates
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "All users can view active templates"
  ON ai_agent_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas de Segurança para ai_agent_tools
CREATE POLICY "Admins can manage system tools"
  ON ai_agent_tools
  FOR ALL
  TO authenticated
  USING (
    is_system = true AND
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "Tenant admins can manage their tenant tools"
  ON ai_agent_tools
  FOR ALL
  TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view available tools"
  ON ai_agent_tools
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    (is_system = true OR
     tenant_id IN (
       SELECT tenant_id FROM tenant_users 
       WHERE user_id = auth.uid()
     ))
  );

-- Políticas de Segurança para ai_agent_conversations
CREATE POLICY "Users can manage their own conversations"
  ON ai_agent_conversations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations in their tenant"
  ON ai_agent_conversations
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas de Segurança para ai_agent_messages
CREATE POLICY "Users can view messages from their conversations"
  ON ai_agent_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM ai_agent_conversations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON ai_agent_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_agent_conversations
      WHERE user_id = auth.uid()
    )
  );

-- Políticas de Segurança para ai_agent_feedback
CREATE POLICY "Users can manage their own feedback"
  ON ai_agent_feedback
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all feedback"
  ON ai_agent_feedback
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

-- Políticas de Segurança para ai_knowledge_bases
CREATE POLICY "Admins can manage system knowledge bases"
  ON ai_knowledge_bases
  FOR ALL
  TO authenticated
  USING (
    is_system = true AND
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "Tenant admins can manage their tenant knowledge bases"
  ON ai_knowledge_bases
  FOR ALL
  TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view knowledge bases in their tenant"
  ON ai_knowledge_bases
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    (is_system = true OR
     tenant_id IN (
       SELECT tenant_id FROM tenant_users 
       WHERE user_id = auth.uid()
     ))
  );

-- Políticas de Segurança para ai_knowledge_documents
CREATE POLICY "Users can view documents in their knowledge bases"
  ON ai_knowledge_documents
  FOR SELECT
  TO authenticated
  USING (
    knowledge_base_id IN (
      SELECT id FROM ai_knowledge_bases
      WHERE is_active = true AND
      (is_system = true OR
       tenant_id IN (
         SELECT tenant_id FROM tenant_users 
         WHERE user_id = auth.uid()
       ))
    )
  );

CREATE POLICY "Tenant admins can manage documents in their tenant"
  ON ai_knowledge_documents
  FOR ALL
  TO authenticated
  USING (
    knowledge_base_id IN (
      SELECT id FROM ai_knowledge_bases
      WHERE is_system = false AND
      tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Políticas de Segurança para ai_document_chunks
CREATE POLICY "Users can view chunks in their knowledge bases"
  ON ai_document_chunks
  FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM ai_knowledge_documents
      WHERE knowledge_base_id IN (
        SELECT id FROM ai_knowledge_bases
        WHERE is_active = true AND
        (is_system = true OR
         tenant_id IN (
           SELECT tenant_id FROM tenant_users 
           WHERE user_id = auth.uid()
         ))
      )
    )
  );

-- Triggers para atualização de timestamps
CREATE TRIGGER update_ai_agent_templates_timestamp
BEFORE UPDATE ON ai_agent_templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ai_agent_tools_timestamp
BEFORE UPDATE ON ai_agent_tools
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ai_agent_conversations_timestamp
BEFORE UPDATE ON ai_agent_conversations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ai_knowledge_bases_timestamp
BEFORE UPDATE ON ai_knowledge_bases
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ai_knowledge_documents_timestamp
BEFORE UPDATE ON ai_knowledge_documents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Função para atualizar o timestamp da última mensagem em uma conversa
CREATE OR REPLACE FUNCTION update_conversation_last_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_agent_conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp da última mensagem
CREATE TRIGGER update_conversation_last_message
AFTER INSERT ON ai_agent_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message_timestamp();

-- Inserir templates padrão de agentes
INSERT INTO ai_agent_templates (
  name, description, type, is_system, 
  system_prompt, parameters, personality, 
  icon, category, is_active
)
VALUES
  (
    'Assistente Jurídico', 
    'Template para criar assistentes especializados em questões jurídicas',
    'legal_assistant',
    true,
    'Você é um assistente jurídico especializado em direito brasileiro. Forneça informações precisas e baseadas na legislação atual.',
    '{"temperature": 0.2, "top_p": 0.8}',
    '{"tone": "formal", "style": "professional", "expertise": "legal"}',
    'scale',
    'legal',
    true
  ),
  (
    'Assistente Financeiro', 
    'Template para criar assistentes especializados em finanças e contabilidade',
    'financial_assistant',
    true,
    'Você é um assistente financeiro especializado em contabilidade e finanças empresariais. Forneça análises precisas e recomendações baseadas em dados.',
    '{"temperature": 0.1, "top_p": 0.7}',
    '{"tone": "analytical", "style": "data-driven", "expertise": "finance"}',
    'dollar-sign',
    'finance',
    true
  ),
  (
    'Assistente de Atendimento', 
    'Template para criar assistentes de primeiro atendimento e triagem',
    'customer_service',
    true,
    'Você é um assistente de atendimento ao cliente. Seja cordial, empático e eficiente em direcionar os clientes para os serviços adequados.',
    '{"temperature": 0.7, "top_p": 0.9}',
    '{"tone": "friendly", "style": "conversational", "expertise": "customer_service"}',
    'message-circle',
    'customer_service',
    true
  ),
  (
    'Assistente de Documentos', 
    'Template para criar assistentes especializados em análise de documentos',
    'document_assistant',
    true,
    'Você é um assistente especializado em análise de documentos. Extraia informações relevantes, identifique padrões e forneça resumos concisos.',
    '{"temperature": 0.3, "top_p": 0.8}',
    '{"tone": "analytical", "style": "concise", "expertise": "document_analysis"}',
    'file-text',
    'documents',
    true
  ),
  (
    'Assistente de Pesquisa', 
    'Template para criar assistentes especializados em pesquisa e análise',
    'research_assistant',
    true,
    'Você é um assistente de pesquisa. Ajude a encontrar informações, analisar dados e sintetizar conhecimento de forma clara e objetiva.',
    '{"temperature": 0.4, "top_p": 0.9}',
    '{"tone": "informative", "style": "thorough", "expertise": "research"}',
    'search',
    'research',
    true
  )
ON CONFLICT DO NOTHING;

-- Inserir ferramentas padrão para agentes
INSERT INTO ai_agent_tools (
  code, name, description, function_schema,
  is_system, requires_auth, category, icon, is_active
)
VALUES
  (
    'search_documents',
    'Pesquisar Documentos',
    'Pesquisa documentos na base de conhecimento',
    '{
      "name": "search_documents",
      "description": "Pesquisa documentos na base de conhecimento",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Termos de busca"
          },
          "knowledge_base_id": {
            "type": "string",
            "description": "ID da base de conhecimento (opcional)"
          },
          "limit": {
            "type": "integer",
            "description": "Número máximo de resultados"
          }
        },
        "required": ["query"]
      }
    }',
    true,
    false,
    'knowledge',
    'search',
    true
  ),
  (
    'create_document',
    'Criar Documento',
    'Cria um novo documento no sistema',
    '{
      "name": "create_document",
      "description": "Cria um novo documento no sistema",
      "parameters": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Título do documento"
          },
          "content": {
            "type": "string",
            "description": "Conteúdo do documento"
          },
          "category": {
            "type": "string",
            "description": "Categoria do documento"
          }
        },
        "required": ["title", "content"]
      }
    }',
    true,
    true,
    'documents',
    'file-plus',
    true
  ),
  (
    'calendar_query',
    'Consultar Calendário',
    'Consulta eventos no calendário',
    '{
      "name": "calendar_query",
      "description": "Consulta eventos no calendário",
      "parameters": {
        "type": "object",
        "properties": {
          "start_date": {
            "type": "string",
            "description": "Data de início (YYYY-MM-DD)"
          },
          "end_date": {
            "type": "string",
            "description": "Data de fim (YYYY-MM-DD)"
          },
          "calendar_id": {
            "type": "string",
            "description": "ID do calendário (opcional)"
          }
        },
        "required": ["start_date"]
      }
    }',
    true,
    true,
    'calendar',
    'calendar',
    true
  ),
  (
    'financial_summary',
    'Resumo Financeiro',
    'Obtém um resumo financeiro',
    '{
      "name": "financial_summary",
      "description": "Obtém um resumo financeiro",
      "parameters": {
        "type": "object",
        "properties": {
          "period": {
            "type": "string",
            "description": "Período (day, week, month, year)",
            "enum": ["day", "week", "month", "year"]
          },
          "company_id": {
            "type": "string",
            "description": "ID da empresa (opcional)"
          }
        },
        "required": ["period"]
      }
    }',
    true,
    true,
    'finance',
    'dollar-sign',
    true
  ),
  (
    'create_task',
    'Criar Tarefa',
    'Cria uma nova tarefa',
    '{
      "name": "create_task",
      "description": "Cria uma nova tarefa",
      "parameters": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string",
            "description": "Título da tarefa"
          },
          "description": {
            "type": "string",
            "description": "Descrição da tarefa"
          },
          "due_date": {
            "type": "string",
            "description": "Data de vencimento (YYYY-MM-DD)"
          },
          "priority": {
            "type": "string",
            "description": "Prioridade (low, medium, high)",
            "enum": ["low", "medium", "high"]
          },
          "assigned_to": {
            "type": "string",
            "description": "ID do usuário responsável (opcional)"
          }
        },
        "required": ["title"]
      }
    }',
    true,
    true,
    'tasks',
    'check-square',
    true
  )
ON CONFLICT DO NOTHING;

-- Criar uma base de conhecimento padrão do sistema
INSERT INTO ai_knowledge_bases (
  name, description, is_system, chunk_size, chunk_overlap, is_active
)
VALUES
  (
    'Base de Conhecimento Geral',
    'Base de conhecimento geral do sistema, compartilhada entre todos os tenants',
    true,
    1000,
    200,
    true
  )
ON CONFLICT DO NOTHING;

-- Função para criar uma base de conhecimento para um tenant
CREATE OR REPLACE FUNCTION create_tenant_knowledge_base()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar base de conhecimento padrão para o tenant
  INSERT INTO ai_knowledge_bases (
    name,
    description,
    tenant_id,
    is_system,
    chunk_size,
    chunk_overlap,
    is_active,
    created_by
  ) VALUES (
    NEW.nome || ' - Base de Conhecimento',
    'Base de conhecimento padrão para ' || NEW.nome,
    NEW.id,
    false,
    1000,
    200,
    true,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar base de conhecimento quando um tenant é criado
CREATE TRIGGER create_tenant_knowledge_base_trigger
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION create_tenant_knowledge_base();

-- Função para processar mensagem de agente
CREATE OR REPLACE FUNCTION process_agent_message(
  p_agent_id uuid,
  p_user_id uuid,
  p_content text,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_agent record;
  v_model record;
  v_tenant_id uuid;
  v_conversation_id uuid;
  v_result jsonb;
BEGIN
  -- Obter informações do agente
  SELECT * INTO v_agent FROM ai_agents WHERE id = p_agent_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Agente não encontrado'
    );
  END IF;
  
  -- Obter tenant_id do usuário se o agente não for do sistema
  IF v_agent.is_system = false THEN
    v_tenant_id := v_agent.tenant_id;
  ELSE
    -- Para agentes do sistema, buscar o tenant do usuário
    SELECT tenant_id INTO v_tenant_id
    FROM tenant_users
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;
  
  -- Obter informações do modelo
  IF v_agent.model_id IS NOT NULL THEN
    SELECT * INTO v_model FROM llm_models WHERE id = v_agent.model_id;
  END IF;
  
  -- Verificar se já existe uma conversa ou criar uma nova
  IF p_conversation_id IS NULL THEN
    -- Criar nova conversa
    INSERT INTO ai_agent_conversations (
      agent_id,
      user_id,
      tenant_id,
      title,
      status,
      created_at,
      updated_at,
      last_message_at
    ) VALUES (
      p_agent_id,
      p_user_id,
      v_tenant_id,
      'Nova conversa com ' || v_agent.name,
      'active',
      now(),
      now(),
      now()
    ) RETURNING id INTO v_conversation_id;
  ELSE
    -- Verificar se a conversa existe e pertence ao usuário
    SELECT id INTO v_conversation_id
    FROM ai_agent_conversations
    WHERE id = p_conversation_id AND user_id = p_user_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Conversa não encontrada ou não pertence ao usuário'
      );
    END IF;
  END IF;
  
  -- Inserir mensagem do usuário
  INSERT INTO ai_agent_messages (
    conversation_id,
    role,
    content,
    created_at
  ) VALUES (
    v_conversation_id,
    'user',
    p_content,
    now()
  );
  
  -- Em uma implementação real, aqui seria feita a chamada para o LLM
  -- e o processamento da resposta. Para esta demonstração, vamos simular.
  
  -- Simular resposta do assistente
  INSERT INTO ai_agent_messages (
    conversation_id,
    role,
    content,
    tokens_used,
    created_at
  ) VALUES (
    v_conversation_id,
    'assistant',
    'Esta é uma resposta simulada do agente ' || v_agent.name || '. Em uma implementação real, esta resposta seria gerada pelo modelo ' || COALESCE(v_model.name, 'padrão') || '.',
    100, -- tokens simulados
    now()
  );
  
  -- Retornar resultado
  RETURN jsonb_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'agent', jsonb_build_object(
      'id', v_agent.id,
      'name', v_agent.name,
      'type', v_agent.type
    ),
    'message', 'Mensagem processada com sucesso'
  );
END;
$$ LANGUAGE plpgsql;

-- Função para busca semântica em documentos
CREATE OR REPLACE FUNCTION semantic_search(
  p_query text,
  p_knowledge_base_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  document_id uuid,
  document_title text,
  chunk_content text,
  similarity float
) AS $$
BEGIN
  -- Esta é uma implementação simulada
  -- Em uma implementação real, seria feita uma busca por similaridade de embeddings
  
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.title as document_title,
    c.content as chunk_content,
    0.85 as similarity
  FROM 
    ai_knowledge_documents d
    JOIN ai_document_chunks c ON d.id = c.document_id
  WHERE 
    d.knowledge_base_id = p_knowledge_base_id
    AND d.status = 'processed'
    AND c.content ILIKE '%' || p_query || '%'
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;