# Finance AI - Sistema SaaS de Gestão Financeira

## 1. Objetivo Principal do Sistema

O Finance AI é uma plataforma SaaS (Software as a Service) multitenancy para gestão financeira empresarial, que permite gerenciar múltiplos tenants (clientes), empresas, transações financeiras e documentos. O sistema possui uma arquitetura completa com suporte a múltiplos níveis de acesso, módulos ativáveis e um painel administrativo para gerenciamento da plataforma.

## 2. Tecnologias Utilizadas

- **Frontend**: React 18 com TypeScript
- **Estilização**: TailwindCSS
- **Roteamento**: React Router v6
- **Gerenciamento de Estado**: Context API do React
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL via Supabase
- **Armazenamento**: Supabase Storage
- **Ícones**: Lucide React
- **Gráficos**: Chart.js com React-Chartjs-2
- **Formulários**: React Hook Form
- **Bundler/Dev Server**: Vite

## 3. Estrutura Geral do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   ├── admin/          # Componentes específicos para área admin
│   ├── layout/         # Layouts (MainLayout, AdminLayout)
│   ├── ui/             # Componentes de UI genéricos
│   └── widgets/        # Widgets para dashboard
├── contexts/           # Contextos React para gerenciamento de estado
├── data/               # Dados mockados para desenvolvimento
├── lib/                # Bibliotecas e utilitários
├── pages/              # Páginas da aplicação
│   ├── admin/          # Páginas do painel administrativo
│   │   ├── Credentials/    # Gerenciamento de credenciais
│   │   ├── Modules/        # Gerenciamento de módulos
│   │   ├── Organizations/  # Gerenciamento de organizações
│   │   ├── Plans/          # Gerenciamento de planos
│   │   ├── Storage/        # Gerenciamento de armazenamento
│   │   ├── Tenants/        # Gerenciamento de tenants
│   │   └── Users/          # Gerenciamento de usuários
│   ├── auth/           # Páginas de autenticação
│   ├── financial/      # Páginas de gestão financeira
│   ├── documents/      # Páginas de gestão de documentos
│   └── tasks/          # Páginas de gestão de tarefas
├── routes/             # Configuração de rotas
├── types/              # Definições de tipos TypeScript
└── main.tsx           # Ponto de entrada da aplicação
```

## 4. Funcionalidades Implementadas

### Sistema Multitenancy
- Suporte a múltiplos tenants (clientes)
- Cada tenant pode ter múltiplas empresas
- Isolamento de dados entre tenants

### Autenticação e Autorização
- Login/Logout
- Registro de usuários
- Recuperação de senha
- Níveis de acesso (usuário, gerente, admin, superadmin)
- Seleção de tenant e empresa

### Painel Administrativo SaaS
- Gestão de tenants
- Gestão de planos e assinaturas
- Gestão de módulos do sistema
- Gestão de usuários
- Gestão de organizações
- Gestão de credenciais de integração
- Gestão de armazenamento

### Dashboard e Widgets
- Resumo financeiro
- Gráficos de fluxo de caixa
- Lista de tarefas pendentes
- Notificações
- Atividades recentes

### Módulos Funcionais
- Financeiro (transações, receitas, despesas)
- Documentos
- Tarefas
- Configurações

### Recursos Adicionais
- Tema claro/escuro
- Assistente AI integrado
- Notificações em tempo real
- Perfil de usuário personalizável

## 5. Rotas Implementadas

### Rotas de Autenticação
- `/login` - Página de login
- `/register` - Página de registro
- `/forgot-password` - Recuperação de senha
- `/select-tenant` - Seleção de tenant
- `/select-company` - Seleção de empresa

### Rotas Principais
- `/` - Dashboard principal
- `/financeiro` - Gestão financeira
- `/financeiro/transacoes` - Transações financeiras
- `/documentos` - Gestão de documentos
- `/tarefas` - Gestão de tarefas
- `/perfil` - Perfil do usuário
- `/configuracoes` - Configurações do sistema

### Rotas Administrativas
- `/admin` - Dashboard administrativo
- `/admin/tenants` - Gestão de tenants
- `/admin/plans` - Gestão de planos
- `/admin/modules` - Gestão de módulos
- `/admin/organizations` - Gestão de organizações
- `/admin/users` - Gestão de usuários
- `/admin/credentials` - Gestão de credenciais
- `/admin/storage` - Gestão de armazenamento

## 6. Configurações Importantes

### Autenticação
- Implementada com Supabase Auth
- Suporte a autenticação por email/senha
- Opção para desabilitar confirmação de email
- Persistência de sessão via localStorage/sessionStorage

### Controle de Acesso
- Row Level Security (RLS) no Supabase
- Políticas de acesso baseadas em tenant e usuário
- Middleware de proteção de rotas (ProtectedRoute, AdminRoute)

### Armazenamento
- Configuração flexível de provedores de armazenamento
- Suporte a múltiplos provedores (local, S3, Google Drive, etc.)
- Mapeamento de módulos para configurações de armazenamento

### Internacionalização
- Suporte a múltiplos idiomas por tenant
- Interface preparada para tradução

## 7. Partes Pendentes ou Em Construção

### Funcionalidades
- Implementação completa do módulo de relatórios
- Implementação completa do módulo de mensagens
- Integração com serviços de pagamento
- Sistema de notificações em tempo real
- Implementação completa do assistente AI

### Técnico
- Testes unitários e de integração
- Otimização de performance
- Implementação de cache
- Melhorias de acessibilidade
- Documentação de API
- CI/CD para deploy automático

### Integrações
- Integração com serviços de email
- Integração com serviços de SMS
- Webhooks para eventos do sistema
- API pública para integrações externas

## 8. Modelo de Dados

O sistema utiliza um banco de dados PostgreSQL com as seguintes tabelas principais:

- `users` - Usuários do sistema
- `tenants` - Clientes da plataforma SaaS
- `companies` - Empresas pertencentes aos tenants
- `organizations` - Organizações dentro dos tenants
- `saas_plans` - Planos de assinatura disponíveis
- `saas_modules` - Módulos do sistema
- `tenant_modules` - Módulos ativados para cada tenant
- `tenant_subscriptions` - Assinaturas dos tenants
- `transactions` - Transações financeiras
- `tasks` - Tarefas do sistema
- `notifications` - Notificações para usuários
- `system_credentials` - Credenciais para integrações
- `storage_configs` - Configurações de armazenamento

## 9. Próximos Passos

1. Implementar testes automatizados
2. Completar módulos pendentes
3. Melhorar a documentação
4. Implementar integrações com serviços externos
5. Otimizar performance e escalabilidade
6. Preparar para deploy em produção