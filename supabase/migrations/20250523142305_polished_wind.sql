/*
  # Dados mock para sistema SaaS
  
  1. Inserção de dados de exemplo para planos
  2. Inserção de dados de exemplo para módulos
  3. Inserção de dados de exemplo para tenants
  4. Configuração de relacionamentos entre entidades
*/

-- Inserir módulos padrão
INSERT INTO saas_modules (name, code, description, icon, is_core, price, is_active)
VALUES
  ('CRM', 'crm', 'Gerenciamento de Relacionamento com o Cliente para controlar informações e interações com clientes', 'users', TRUE, 0, TRUE),
  ('Financeiro', 'finance', 'Gerenciamento financeiro para faturamento, pagamentos e relatórios financeiros', 'dollar-sign', FALSE, 29.90, TRUE),
  ('Gerenciamento de Tarefas', 'tasks', 'Ferramentas de gerenciamento de tarefas e projetos para organizar trabalho e melhorar produtividade', 'check-square', TRUE, 0, TRUE),
  ('Gestão de Documentos', 'documents', 'Armazenamento de documentos, controle de versão e recursos de compartilhamento', 'folder', FALSE, 19.90, TRUE),
  ('Comunicação', 'communication', 'Ferramentas de comunicação interna e externa incluindo chat e e-mail', 'message-square', FALSE, 14.90, TRUE),
  ('Documentos Fiscais Eletrônicos', 'tax_docs', 'Gerenciamento de documentos fiscais eletrônicos e conformidade', 'file-text', FALSE, 39.90, TRUE),
  ('Prática Jurídica', 'legal', 'Ferramentas para gerenciamento de prática jurídica incluindo acompanhamento de processos', 'scale', FALSE, 49.90, TRUE),
  ('Administração SaaS', 'saas_admin', 'Ferramentas avançadas de administração para gerenciamento de plataforma SaaS', 'settings', FALSE, 99.90, TRUE),
  ('Análise de Dados', 'analytics', 'Ferramentas para análise e visualização de dados de negócios', 'bar-chart-2', FALSE, 49.90, TRUE),
  ('Automação de Marketing', 'marketing', 'Ferramentas para automação de campanhas e análise de marketing', 'at-sign', FALSE, 39.90, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Inserir planos padrão
INSERT INTO saas_plans (name, description, price, billing_cycle, user_limit, storage_limit, is_recommended, is_active)
VALUES
  ('Básico', 'Para pequenos negócios ou empreendedores solo', 29.90, 'monthly', 3, 5120, FALSE, TRUE),
  ('Profissional', 'Para negócios em crescimento com mais necessidades', 79.90, 'monthly', 10, 20480, TRUE, TRUE),
  ('Empresarial', 'Para grandes organizações com requisitos avançados', 199.90, 'monthly', 50, 102400, FALSE, TRUE),
  ('Básico Anual', 'Para pequenos negócios com pagamento anual', 299.00, 'yearly', 3, 5120, FALSE, TRUE),
  ('Profissional Anual', 'Para negócios em crescimento com pagamento anual', 799.00, 'yearly', 10, 20480, FALSE, TRUE),
  ('Empresarial Anual', 'Para grandes organizações com pagamento anual', 1999.00, 'yearly', 50, 102400, FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Associar módulos aos planos (se não existirem)
-- Plano Básico: CRM + Gerenciamento de Tarefas
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Básico'
AND m.code IN ('crm', 'tasks')
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Plano Básico Anual: CRM + Gerenciamento de Tarefas
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Básico Anual'
AND m.code IN ('crm', 'tasks')
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Plano Profissional: CRM + Financeiro + Tarefas + Documentos + Comunicação
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Profissional'
AND m.code IN ('crm', 'finance', 'tasks', 'documents', 'communication')
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Plano Profissional Anual: CRM + Financeiro + Tarefas + Documentos + Comunicação
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Profissional Anual'
AND m.code IN ('crm', 'finance', 'tasks', 'documents', 'communication')
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Plano Empresarial: Todos os módulos
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Empresarial'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Plano Empresarial Anual: Todos os módulos
INSERT INTO plan_modules (plan_id, module_id)
SELECT 
  p.id,
  m.id
FROM saas_plans p, saas_modules m
WHERE p.name = 'Empresarial Anual'
AND NOT EXISTS (
  SELECT 1 FROM plan_modules
  WHERE plan_id = p.id AND module_id = m.id
);

-- Inserir tenants de exemplo (se não existirem)
DO $$
BEGIN
  -- Verificar se já existem tenants
  IF NOT EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
    -- Inserir tenants de exemplo
    INSERT INTO tenants (nome, plano, status, ativo, limiteusuarios, limitearmazenamento, slug)
    VALUES
      ('ABC Contabilidade', 'enterprise', 'ativo', TRUE, 50, 102400, 'abc-contabilidade'),
      ('XYZ Comércio', 'pro', 'ativo', TRUE, 10, 20480, 'xyz-comercio'),
      ('Tech Solutions', 'basic', 'ativo', TRUE, 3, 5120, 'tech-solutions'),
      ('Legal Partners', 'enterprise', 'inativo', FALSE, 50, 102400, 'legal-partners'),
      ('Dental Clinic', 'pro', 'ativo', TRUE, 10, 20480, 'dental-clinic');
      
    -- Inserir assinaturas para os tenants
    INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, billing_cycle, amount)
    SELECT 
      t.id,
      (SELECT id FROM saas_plans WHERE LOWER(name) LIKE LOWER(t.plano) || '%' AND billing_cycle = 'monthly' LIMIT 1),
      CASE WHEN t.status = 'ativo' THEN 'active' ELSE 'inactive' END,
      'monthly',
      CASE 
        WHEN t.plano = 'basic' THEN 29.90
        WHEN t.plano = 'pro' THEN 79.90
        WHEN t.plano = 'enterprise' THEN 199.90
        ELSE 0
      END
    FROM tenants t
    WHERE NOT EXISTS (
      SELECT 1 FROM tenant_subscriptions ts WHERE ts.tenant_id = t.id
    );
    
    -- Associar módulos aos tenants com base em seus planos
    INSERT INTO tenant_modules (tenant_id, module_id, is_active)
    SELECT 
      ts.tenant_id,
      pm.module_id,
      TRUE
    FROM tenant_subscriptions ts
    JOIN plan_modules pm ON ts.plan_id = pm.plan_id
    WHERE NOT EXISTS (
      SELECT 1 FROM tenant_modules tm 
      WHERE tm.tenant_id = ts.tenant_id AND tm.module_id = pm.module_id
    );
  END IF;
END $$;