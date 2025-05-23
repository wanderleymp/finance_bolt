/*
  # Correção do campo de avatar para usuários
  
  1. Mudanças
     - Verifica se a coluna avatar_url existe na tabela users
     - Adiciona a coluna se não existir
     - Renomeia a coluna para o nome correto se necessário
  
  2. Segurança
     - Mantém as políticas de RLS existentes
     - Não afeta os dados existentes
*/

-- Verificar se a coluna avatar_url existe
DO $$
BEGIN
  -- Se a coluna não existir, adiciona-a
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    -- Verifica se existe alguma coluna com nome parecido que poderia ser renomeada
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'avatarUrl'
    ) THEN
      -- Renomeia a coluna existente
      ALTER TABLE users RENAME COLUMN "avatarUrl" TO avatar_url;
    ELSE
      -- Adiciona uma nova coluna
      ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
  END IF;
END $$;

-- Atualizar dados existentes se necessário
UPDATE users 
SET avatar_url = NULL 
WHERE avatar_url IS NULL;

-- Certifique-se de que a coluna esteja incluída nas políticas RLS
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);