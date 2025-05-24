/*
  # Implementação do Módulo LLM Manager

  1. Novas Tabelas
    - `llm_providers` - Provedores de LLM (OpenAI, Anthropic, etc.)
    - `llm_models` - Catálogo de modelos disponíveis
    - `llm_provider_credentials` - Credenciais de API por provedor
    - `tenant_llm_settings` - Configurações de LLM por tenant
    - `llm_usage_logs` - Logs de uso de LLM
    - `llm_budget_settings` - Configurações de orçamento e limites
    - `ai_agents` - Agentes de IA configuráveis

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas de acesso para administradores e usuários

  3. Relacionamentos
    - Relações entre provedores, modelos e credenciais
    - Relações entre tenants e configurações de LLM
*/

-- Tabela de Provedores de LLM
CREATE TABLE IF NOT EXISTS llm_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  api_endpoint text,
  auth_method text NOT NULL DEFAULT 'api_key',
  status text NOT NULL DEFAULT 'active',
  rate_limit_requests integer,
  rate_limit_tokens integer,
  rate_limit_period text,
  icon text,
  documentation_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Modelos de LLM
CREATE TABLE IF NOT EXISTS llm_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  context_window integer NOT NULL,
  max_tokens integer NOT NULL,
  input_price_per_1k_tokens numeric(10,6) NOT NULL,
  output_price_per_1k_tokens numeric(10,6) NOT NULL,
  supports_functions boolean NOT NULL DEFAULT false,
  supports_vision boolean NOT NULL DEFAULT false,
  supports_streaming boolean NOT NULL DEFAULT true,
  specialization text[],
  performance_rating integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_id, code)
);

-- Tabela de Credenciais de Provedores
CREATE TABLE IF NOT EXISTS llm_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  credentials jsonb NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  last_test_at timestamptz,
  test_status text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_or_system CHECK (
    (is_system = true AND tenant_id IS NULL) OR
    (is_system = false AND tenant_id IS NOT NULL)
  )
);

-- Tabela de Configurações de LLM por Tenant
CREATE TABLE IF NOT EXISTS tenant_llm_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  default_provider_id uuid REFERENCES llm_providers(id),
  default_model_id uuid REFERENCES llm_models(id),
  fallback_model_id uuid REFERENCES llm_models(id),
  use_system_credentials boolean NOT NULL DEFAULT true,
  credential_id uuid REFERENCES llm_provider_credentials(id),
  default_parameters jsonb NOT NULL DEFAULT '{"temperature": 0.7, "top_p": 1.0, "frequency_penalty": 0.0, "presence_penalty": 0.0}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Tabela de Configurações de Orçamento
CREATE TABLE IF NOT EXISTS llm_budget_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  monthly_budget numeric(10,2) NOT NULL DEFAULT 0,
  daily_limit numeric(10,2),
  token_limit_per_hour integer,
  token_limit_per_day integer,
  alert_threshold_percent integer NOT NULL DEFAULT 80,
  action_on_limit_reached text NOT NULL DEFAULT 'alert',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Tabela de Logs de Uso de LLM
CREATE TABLE IF NOT EXISTS llm_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES llm_providers(id) ON DELETE SET NULL,
  model_id uuid REFERENCES llm_models(id) ON DELETE SET NULL,
  request_id text,
  prompt_tokens integer NOT NULL,
  completion_tokens integer NOT NULL,
  total_tokens integer NOT NULL,
  estimated_cost numeric(10,6) NOT NULL,
  duration_ms integer,
  status text NOT NULL,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Agentes IA
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  model_id uuid REFERENCES llm_models(id),
  fallback_model_id uuid REFERENCES llm_models(id),
  parameters jsonb NOT NULL DEFAULT '{"temperature": 0.7, "top_p": 1.0}',
  system_prompt text,
  tools jsonb[],
  knowledge_base_ids text[],
  personality jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE llm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_llm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para llm_providers
CREATE POLICY "Admins can manage llm_providers"
  ON llm_providers
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "All users can view active llm_providers"
  ON llm_providers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas de Segurança para llm_models
CREATE POLICY "Admins can manage llm_models"
  ON llm_models
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "All users can view active llm_models"
  ON llm_models
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Políticas de Segurança para llm_provider_credentials
CREATE POLICY "Admins can manage system credentials"
  ON llm_provider_credentials
  FOR ALL
  TO authenticated
  USING (
    is_system = true AND
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "Tenant admins can manage their tenant credentials"
  ON llm_provider_credentials
  FOR ALL
  TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their tenant credentials"
  ON llm_provider_credentials
  FOR SELECT
  TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas de Segurança para tenant_llm_settings
CREATE POLICY "Tenant admins can manage their llm settings"
  ON tenant_llm_settings
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their tenant llm settings"
  ON tenant_llm_settings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas de Segurança para llm_budget_settings
CREATE POLICY "Tenant admins can manage their budget settings"
  ON llm_budget_settings
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their tenant budget settings"
  ON llm_budget_settings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid()
    )
  );

-- Políticas de Segurança para llm_usage_logs
CREATE POLICY "Admins can view all usage logs"
  ON llm_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "Users can view their own usage logs"
  ON llm_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas de Segurança para ai_agents
CREATE POLICY "Admins can manage system agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (
    is_system = true AND
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'superadmin') OR is_super = true
    )
  );

CREATE POLICY "Tenant admins can manage their tenant agents"
  ON ai_agents
  FOR ALL
  TO authenticated
  USING (
    is_system = false AND
    tenant_id IN (
      SELECT tenant_id FROM tenant_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view active agents"
  ON ai_agents
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

-- Inserir provedores padrão
INSERT INTO llm_providers (code, name, description, api_endpoint, auth_method, icon, documentation_url)
VALUES
  ('openai', 'OpenAI', 'Provedor de modelos GPT como GPT-4 e GPT-3.5', 'https://api.openai.com/v1', 'api_key', 'brain-circuit', 'https://platform.openai.com/docs/api-reference'),
  ('anthropic', 'Anthropic', 'Provedor de modelos Claude', 'https://api.anthropic.com', 'api_key', 'brain', 'https://docs.anthropic.com/claude/reference/getting-started-with-the-api'),
  ('google', 'Google AI', 'Provedor de modelos Gemini', 'https://generativelanguage.googleapis.com', 'api_key', 'globe', 'https://ai.google.dev/docs'),
  ('cohere', 'Cohere', 'Provedor especializado em embeddings e RAG', 'https://api.cohere.ai/v1', 'api_key', 'layers', 'https://docs.cohere.com/reference/about'),
  ('local', 'Modelos Locais', 'Modelos executados localmente via API', 'http://localhost:11434/api', 'none', 'cpu', 'https://github.com/ollama/ollama')
ON CONFLICT (code) DO NOTHING;

-- Inserir modelos padrão para OpenAI
INSERT INTO llm_models (
  provider_id, code, name, description, context_window, max_tokens,
  input_price_per_1k_tokens, output_price_per_1k_tokens,
  supports_functions, supports_vision, specialization
)
VALUES
  (
    (SELECT id FROM llm_providers WHERE code = 'openai'),
    'gpt-4-turbo', 'GPT-4 Turbo', 'Modelo mais avançado da OpenAI com capacidades de visão',
    128000, 4096, 0.01, 0.03, true, true, ARRAY['general', 'code', 'vision']
  ),
  (
    (SELECT id FROM llm_providers WHERE code = 'openai'),
    'gpt-4', 'GPT-4', 'Modelo avançado da OpenAI com excelente raciocínio',
    8192, 4096, 0.03, 0.06, true, false, ARRAY['general', 'code', 'reasoning']
  ),
  (
    (SELECT id FROM llm_providers WHERE code = 'openai'),
    'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'Modelo equilibrado entre custo e performance',
    16385, 4096, 0.0005, 0.0015, true, false, ARRAY['general', 'chat']
  )
ON CONFLICT (provider_id, code) DO NOTHING;

-- Inserir modelos padrão para Anthropic
INSERT INTO llm_models (
  provider_id, code, name, description, context_window, max_tokens,
  input_price_per_1k_tokens, output_price_per_1k_tokens,
  supports_functions, supports_vision, specialization
)
VALUES
  (
    (SELECT id FROM llm_providers WHERE code = 'anthropic'),
    'claude-3-opus', 'Claude 3 Opus', 'Modelo mais avançado da Anthropic',
    200000, 4096, 0.015, 0.075, false, true, ARRAY['general', 'reasoning']
  ),
  (
    (SELECT id FROM llm_providers WHERE code = 'anthropic'),
    'claude-3-sonnet', 'Claude 3 Sonnet', 'Modelo intermediário da Anthropic',
    200000, 4096, 0.003, 0.015, false, true, ARRAY['general', 'chat']
  ),
  (
    (SELECT id FROM llm_providers WHERE code = 'anthropic'),
    'claude-3-haiku', 'Claude 3 Haiku', 'Modelo mais rápido e econômico da Anthropic',
    200000, 4096, 0.00025, 0.00125, false, true, ARRAY['general', 'chat']
  )
ON CONFLICT (provider_id, code) DO NOTHING;

-- Inserir modelos padrão para Google
INSERT INTO llm_models (
  provider_id, code, name, description, context_window, max_tokens,
  input_price_per_1k_tokens, output_price_per_1k_tokens,
  supports_functions, supports_vision, specialization
)
VALUES
  (
    (SELECT id FROM llm_providers WHERE code = 'google'),
    'gemini-1.5-pro', 'Gemini 1.5 Pro', 'Modelo avançado do Google com contexto muito longo',
    1000000, 8192, 0.00035, 0.00105, true, true, ARRAY['general', 'vision', 'code']
  ),
  (
    (SELECT id FROM llm_providers WHERE code = 'google'),
    'gemini-1.5-flash', 'Gemini 1.5 Flash', 'Modelo rápido e econômico do Google',
    1000000, 8192, 0.000175, 0.000525, true, true, ARRAY['general', 'chat']
  )
ON CONFLICT (provider_id, code) DO NOTHING;

-- Inserir agentes padrão do sistema
INSERT INTO ai_agents (
  name, description, type, is_system, 
  model_id, parameters, system_prompt, 
  personality, is_active
)
VALUES
  (
    'Assistente Jurídico', 
    'Assistente especializado em questões jurídicas',
    'legal_assistant',
    true,
    (SELECT id FROM llm_models WHERE code = 'gpt-4-turbo' LIMIT 1),
    '{"temperature": 0.2, "top_p": 0.8}',
    'Você é um assistente jurídico especializado em direito brasileiro. Forneça informações precisas e baseadas na legislação atual.',
    '{"tone": "formal", "style": "professional", "expertise": "legal"}',
    true
  ),
  (
    'Assistente Financeiro', 
    'Assistente especializado em finanças e contabilidade',
    'financial_assistant',
    true,
    (SELECT id FROM llm_models WHERE code = 'gpt-4' LIMIT 1),
    '{"temperature": 0.1, "top_p": 0.7}',
    'Você é um assistente financeiro especializado em contabilidade e finanças empresariais. Forneça análises precisas e recomendações baseadas em dados.',
    '{"tone": "analytical", "style": "data-driven", "expertise": "finance"}',
    true
  ),
  (
    'Assistente de Atendimento', 
    'Assistente para primeiro atendimento e triagem',
    'customer_service',
    true,
    (SELECT id FROM llm_models WHERE code = 'gpt-3.5-turbo' LIMIT 1),
    '{"temperature": 0.7, "top_p": 0.9}',
    'Você é um assistente de atendimento ao cliente. Seja cordial, empático e eficiente em direcionar os clientes para os serviços adequados.',
    '{"tone": "friendly", "style": "conversational", "expertise": "customer_service"}',
    true
  )
ON CONFLICT DO NOTHING;

-- Funções para o LLM Manager

-- Função para testar conexão com provedor de LLM
CREATE OR REPLACE FUNCTION test_llm_provider_connection(
  provider_id uuid,
  credentials jsonb
) RETURNS jsonb AS $$
DECLARE
  provider_record record;
  result jsonb;
BEGIN
  -- Obter informações do provedor
  SELECT * INTO provider_record FROM llm_providers WHERE id = provider_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Provedor não encontrado',
      'status_code', 404
    );
  END IF;
  
  -- Simulação de teste de conexão (em produção, faria uma chamada real à API)
  -- Esta é uma versão simplificada para demonstração
  
  -- Verificar se as credenciais têm os campos necessários
  IF provider_record.auth_method = 'api_key' AND (credentials->>'api_key') IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'API key não fornecida',
      'status_code', 400
    );
  END IF;
  
  -- Simular sucesso ou falha aleatória para demonstração
  IF random() > 0.2 THEN
    result := jsonb_build_object(
      'success', true,
      'message', 'Conexão estabelecida com sucesso',
      'status_code', 200,
      'response_time_ms', floor(random() * 500 + 100)::int
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'Falha na conexão: ' || 
        CASE floor(random() * 3)::int
          WHEN 0 THEN 'API key inválida'
          WHEN 1 THEN 'Timeout na conexão'
          ELSE 'Serviço indisponível'
        END,
      'status_code', 
        CASE floor(random() * 3)::int
          WHEN 0 THEN 401
          WHEN 1 THEN 408
          ELSE 503
        END
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular custo de uso de LLM
CREATE OR REPLACE FUNCTION calculate_llm_usage_cost(
  model_id uuid,
  prompt_tokens integer,
  completion_tokens integer
) RETURNS numeric AS $$
DECLARE
  model_record record;
  input_cost numeric;
  output_cost numeric;
  total_cost numeric;
BEGIN
  -- Obter informações do modelo
  SELECT * INTO model_record FROM llm_models WHERE id = model_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Modelo não encontrado';
  END IF;
  
  -- Calcular custo
  input_cost := (prompt_tokens / 1000.0) * model_record.input_price_per_1k_tokens;
  output_cost := (completion_tokens / 1000.0) * model_record.output_price_per_1k_tokens;
  total_cost := input_cost + output_cost;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limites de orçamento
CREATE OR REPLACE FUNCTION check_llm_budget_limits(
  tenant_id uuid
) RETURNS jsonb AS $$
DECLARE
  budget_record record;
  current_month_usage numeric;
  current_day_usage numeric;
  current_hour_tokens integer;
  result jsonb;
BEGIN
  -- Obter configurações de orçamento
  SELECT * INTO budget_record FROM llm_budget_settings WHERE tenant_id = tenant_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'has_limits', false,
      'message', 'Sem limites configurados'
    );
  END IF;
  
  -- Calcular uso atual do mês
  SELECT COALESCE(SUM(estimated_cost), 0) INTO current_month_usage
  FROM llm_usage_logs
  WHERE tenant_id = tenant_id
    AND created_at >= date_trunc('month', CURRENT_DATE);
  
  -- Calcular uso atual do dia
  SELECT COALESCE(SUM(estimated_cost), 0) INTO current_day_usage
  FROM llm_usage_logs
  WHERE tenant_id = tenant_id
    AND created_at >= date_trunc('day', CURRENT_DATE);
  
  -- Calcular tokens da última hora
  SELECT COALESCE(SUM(total_tokens), 0) INTO current_hour_tokens
  FROM llm_usage_logs
  WHERE tenant_id = tenant_id
    AND created_at >= (CURRENT_TIMESTAMP - interval '1 hour');
  
  -- Verificar limites
  result := jsonb_build_object(
    'has_limits', true,
    'monthly_budget', budget_record.monthly_budget,
    'current_month_usage', current_month_usage,
    'monthly_budget_percent', 
      CASE WHEN budget_record.monthly_budget > 0 
        THEN round((current_month_usage / budget_record.monthly_budget) * 100, 2)
        ELSE 0
      END,
    'daily_limit', budget_record.daily_limit,
    'current_day_usage', current_day_usage,
    'daily_limit_percent',
      CASE WHEN budget_record.daily_limit > 0 
        THEN round((current_day_usage / budget_record.daily_limit) * 100, 2)
        ELSE 0
      END,
    'token_limit_per_hour', budget_record.token_limit_per_hour,
    'current_hour_tokens', current_hour_tokens,
    'token_limit_percent',
      CASE WHEN budget_record.token_limit_per_hour > 0 
        THEN round((current_hour_tokens::numeric / budget_record.token_limit_per_hour) * 100, 2)
        ELSE 0
      END
  );
  
  -- Verificar se algum limite foi excedido
  IF budget_record.monthly_budget > 0 AND current_month_usage >= budget_record.monthly_budget THEN
    result := result || jsonb_build_object(
      'limit_exceeded', true,
      'limit_type', 'monthly_budget',
      'action', budget_record.action_on_limit_reached
    );
  ELSIF budget_record.daily_limit > 0 AND current_day_usage >= budget_record.daily_limit THEN
    result := result || jsonb_build_object(
      'limit_exceeded', true,
      'limit_type', 'daily_limit',
      'action', budget_record.action_on_limit_reached
    );
  ELSIF budget_record.token_limit_per_hour > 0 AND current_hour_tokens >= budget_record.token_limit_per_hour THEN
    result := result || jsonb_build_object(
      'limit_exceeded', true,
      'limit_type', 'token_limit_per_hour',
      'action', budget_record.action_on_limit_reached
    );
  ELSE
    result := result || jsonb_build_object(
      'limit_exceeded', false
    );
    
    -- Verificar alertas de limite próximo
    IF budget_record.monthly_budget > 0 AND 
       (current_month_usage / budget_record.monthly_budget) * 100 >= budget_record.alert_threshold_percent THEN
      result := result || jsonb_build_object(
        'alert', true,
        'alert_type', 'monthly_budget',
        'alert_message', format('Uso mensal atingiu %s%% do orçamento', 
          round((current_month_usage / budget_record.monthly_budget) * 100, 0)
        )
      );
    ELSIF budget_record.daily_limit > 0 AND 
          (current_day_usage / budget_record.daily_limit) * 100 >= budget_record.alert_threshold_percent THEN
      result := result || jsonb_build_object(
        'alert', true,
        'alert_type', 'daily_limit',
        'alert_message', format('Uso diário atingiu %s%% do limite', 
          round((current_day_usage / budget_record.daily_limit) * 100, 0)
        )
      );
    END IF;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas as tabelas
CREATE TRIGGER update_llm_providers_timestamp
BEFORE UPDATE ON llm_providers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_llm_models_timestamp
BEFORE UPDATE ON llm_models
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_llm_provider_credentials_timestamp
BEFORE UPDATE ON llm_provider_credentials
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tenant_llm_settings_timestamp
BEFORE UPDATE ON tenant_llm_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_llm_budget_settings_timestamp
BEFORE UPDATE ON llm_budget_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ai_agents_timestamp
BEFORE UPDATE ON ai_agents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Função para criar estrutura de pastas para um agente
CREATE OR REPLACE FUNCTION create_agent_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  tenant_record record;
  storage_config_id uuid;
BEGIN
  -- Obter informações do tenant se o agente não for do sistema
  IF NEW.is_system = false AND NEW.tenant_id IS NOT NULL THEN
    SELECT * INTO tenant_record FROM tenants WHERE id = NEW.tenant_id;
    
    IF FOUND THEN
      -- Buscar configuração de armazenamento padrão do tenant
      SELECT sc.id INTO storage_config_id
      FROM storage_configs sc
      WHERE sc.tenant_id = NEW.tenant_id AND sc.is_default = true
      LIMIT 1;
      
      -- Se não encontrar, buscar configuração de sistema padrão
      IF storage_config_id IS NULL THEN
        SELECT sc.id INTO storage_config_id
        FROM storage_configs sc
        WHERE sc.config_type = 'system' AND sc.is_default = true
        LIMIT 1;
      END IF;
      
      -- Se encontrou uma configuração de armazenamento, cria mapeamento
      IF storage_config_id IS NOT NULL THEN
        -- Criar mapeamento de armazenamento para o agente
        INSERT INTO module_storage_mappings (
          module_code,
          storage_config_id,
          tenant_id,
          priority,
          settings,
          is_active
        ) VALUES (
          'ai_agents',
          storage_config_id,
          NEW.tenant_id,
          1,
          jsonb_build_object(
            'basePath', format('/agents/%s', NEW.id),
            'allowedFileTypes', ARRAY['pdf', 'docx', 'txt', 'json', 'csv']
          ),
          true
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar estrutura de pastas quando um agente é criado
CREATE TRIGGER create_agent_folder_structure_trigger
AFTER INSERT ON ai_agents
FOR EACH ROW EXECUTE FUNCTION create_agent_folder_structure();

-- Função para obter contexto para um agente
CREATE OR REPLACE FUNCTION get_agent_context(agent_id uuid)
RETURNS jsonb AS $$
DECLARE
  agent_record record;
  tenant_record record;
  model_record record;
  context jsonb;
BEGIN
  -- Obter informações do agente
  SELECT * INTO agent_record FROM ai_agents WHERE id = agent_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Agente não encontrado'
    );
  END IF;
  
  -- Obter informações do modelo
  SELECT * INTO model_record FROM llm_models WHERE id = agent_record.model_id;
  
  -- Inicializar contexto
  context := jsonb_build_object(
    'agent', jsonb_build_object(
      'id', agent_record.id,
      'name', agent_record.name,
      'type', agent_record.type,
      'description', agent_record.description,
      'system_prompt', agent_record.system_prompt,
      'is_system', agent_record.is_system
    ),
    'model', CASE WHEN model_record.id IS NOT NULL THEN
      jsonb_build_object(
        'id', model_record.id,
        'name', model_record.name,
        'context_window', model_record.context_window,
        'supports_functions', model_record.supports_functions,
        'supports_vision', model_record.supports_vision
      )
    ELSE
      NULL
    END,
    'parameters', agent_record.parameters,
    'tools', agent_record.tools
  );
  
  -- Adicionar informações do tenant se não for um agente do sistema
  IF agent_record.is_system = false AND agent_record.tenant_id IS NOT NULL THEN
    SELECT * INTO tenant_record FROM tenants WHERE id = agent_record.tenant_id;
    
    IF FOUND THEN
      context := context || jsonb_build_object(
        'tenant', jsonb_build_object(
          'id', tenant_record.id,
          'name', tenant_record.nome,
          'plan', tenant_record.plano
        )
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'context', context
  );
END;
$$ LANGUAGE plpgsql;