-- 1. Criação das Extensões Necessárias para Alta Performance com Consultas de Texto (ilike)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Criação dos Índices GIN (Full-Text Search). Impede Sequential Scans destruidores de CPU do banco de dados na busca de postagens/comentários na página da Comunidade.
CREATE INDEX IF NOT EXISTS idx_publications_description_trgm ON publications USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_comments_text_trgm ON comments USING GIN (comment gin_trgm_ops);

-- 3. Inserção ou Correção da Foreign Key Mestra para suportar Joins sem gambiarra (Comentários -> Perfil)
-- NOTA: Se já existir essa FK, a query abaixo apenas será ignorada ou você pode omiti-la, mas garanta que na interface do Supabase a tabela 'comments' na coluna 'user_id' aponta diretamente para a tabela 'profiles' coluna 'user_id'.
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(user_id)
  ON DELETE CASCADE;

-- 4. MITIGAÇÃO DE RCE (Remote Code Execution) e Bypass de Upload
-- Proteção direta no Storage RLS. Verifica que o arquivo possua o mimetype honesto.
-- Se tentar enviar um .php disfarçado de imagem com mimetype suspeito no corpo multipart, o backend rejeita.

-- Aplicar a seguinte condicional no INSERT do bucket 'ComunityPost' e 'Profile' (ou crie política se não tiver):
-- Vá em: Storage > Policies > Crie uma Policy "Check Mime Type" para INSERT com a restrição abaixo no CHECK da RLS:
-- (bucket_id = 'ComunityPost' AND (mimetype = 'image/jpeg' OR mimetype = 'image/png' OR mimetype = 'image/webp' OR mimetype LIKE 'video/%'))

-- Exemplificação teórica completa em RLS nativo caso seja via SQL:
/*
CREATE POLICY "Strict Mime Upload ComunityPost"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ComunityPost' AND 
  (mimetype = 'image/jpeg' OR mimetype = 'image/png' OR mimetype = 'image/webp' OR mimetype LIKE 'video/%')
);
*/
